/**
 * iRacing SDK - Memory-mapped file reader
 * Uses native addon to access Windows APIs for reading iRacing's shared memory
 */
import { closeMemoryMap, findWindow, openMemoryMap, readMemory } from "@iracedeck/iracing-native";
import yaml from "yaml";

import { ChatCommand } from "./commands/ChatCommand.js";
import { getLogger } from "./logger.js";
import {
  IRSDK_MAX_BUFS,
  IRSDK_MAX_DESC,
  IRSDK_MAX_STRING,
  IRSDKHeader,
  SessionInfo,
  StatusField,
  TelemetryData,
  VarBuf,
  VarHeader,
  VarType,
} from "./types.js";

// iRacing shared memory name
const IRACING_MEMMAPFILENAME = "Local\\IRSDKMemMapFileName";

// iRacing window title
const IRACING_WINDOW_TITLE = "iRacing.com Simulator";

/**
 * iRacing SDK Client
 * Manages connection to iRacing's shared memory and provides telemetry data
 */
export class IRacingSDK {
  private memHandle: number = 0;
  private header: IRSDKHeader | null = null;
  private varHeaders: VarHeader[] = [];
  private lastSessionInfoUpdate = -1;
  private sessionInfo: SessionInfo | null = null;

  /**
   * Check if iRacing is running and memory-mapped file is accessible
   */
  isConnected(): boolean {
    if (!this.memHandle) {
      return false;
    }

    // Check status field in header - re-read it to get current status
    if (!this.header) {
      return false;
    }

    // Re-read the status field from shared memory to detect disconnection
    try {
      const statusBuffer = readMemory(this.memHandle, 4, 4); // status is at offset 4, 4 bytes
      const currentStatus = statusBuffer.readInt32LE(0);
      this.header.status = currentStatus; // Update cached header

      return (currentStatus & StatusField.Connected) !== 0;
    } catch (error) {
      getLogger().error(`[iRacing SDK] Failed to read status field: ${error}`);

      return false;
    }
  }

  /**
   * Connect to iRacing's shared memory
   */
  connect(): boolean {
    // Try to open the memory-mapped file
    this.memHandle = openMemoryMap(IRACING_MEMMAPFILENAME);

    if (!this.memHandle) {
      return false;
    }

    // Parse the header
    this.parseHeader();

    const connected = this.isConnected();
    if (connected) {
      getLogger().info(`[iRacing SDK] Connected - ${this.varHeaders.length} variables available`);
    }

    return connected;
  }

  /**
   * Disconnect from iRacing's shared memory
   */
  disconnect(): void {
    if (this.memHandle) {
      closeMemoryMap(this.memHandle);
      this.memHandle = 0;
    }

    this.header = null;
    this.varHeaders = [];
    this.sessionInfo = null;
    this.lastSessionInfoUpdate = -1;
  }

  /**
   * Parse the main header from shared memory
   */
  private parseHeader(): void {
    if (!this.memHandle) return;

    // Read header structure (144 bytes base + variable buffers)
    const headerView = readMemory(this.memHandle, 0, 144);

    this.header = {
      ver: headerView.readInt32LE(0),
      status: headerView.readInt32LE(4),
      tickRate: headerView.readInt32LE(8),
      sessionInfoUpdate: headerView.readInt32LE(12),
      sessionInfoLen: headerView.readInt32LE(16),
      sessionInfoOffset: headerView.readInt32LE(20),
      numVars: headerView.readInt32LE(24),
      varHeaderOffset: headerView.readInt32LE(28),
      numBuf: headerView.readInt32LE(32),
      bufLen: headerView.readInt32LE(36),
      padData: [],
      varBuf: [],
    };

    // Parse variable buffers (16 bytes each)
    for (let i = 0; i < IRSDK_MAX_BUFS; i++) {
      const offset = 48 + i * 16;
      this.header.varBuf.push({
        tickCount: headerView.readInt32LE(offset),
        bufOffset: headerView.readInt32LE(offset + 4),
        padData: [],
      });
    }

    // Parse variable headers
    this.parseVarHeaders();
  }

  /**
   * Parse variable header definitions
   */
  private parseVarHeaders(): void {
    if (!this.memHandle || !this.header) return;

    this.varHeaders = [];
    const varHeaderSize = 144; // Size of each VarHeader struct

    for (let i = 0; i < this.header.numVars; i++) {
      const offset = this.header.varHeaderOffset + i * varHeaderSize;
      const varHeaderBuf = readMemory(this.memHandle, offset, varHeaderSize);

      const varHeader: VarHeader = {
        type: varHeaderBuf.readInt32LE(0),
        offset: varHeaderBuf.readInt32LE(4),
        count: varHeaderBuf.readInt32LE(8),
        countAsTime: varHeaderBuf.readInt8(12) !== 0,
        name: this.readString(varHeaderBuf, 16, IRSDK_MAX_STRING),
        desc: this.readString(varHeaderBuf, 48, IRSDK_MAX_DESC),
        unit: this.readString(varHeaderBuf, 112, IRSDK_MAX_STRING),
      };

      this.varHeaders.push(varHeader);
    }
  }

  /**
   * Read null-terminated string from buffer
   */
  private readString(buffer: Buffer, offset: number, maxLen: number): string {
    const bytes: number[] = [];
    for (let i = 0; i < maxLen; i++) {
      const byte = buffer.readUInt8(offset + i);
      if (byte === 0) break;
      bytes.push(byte);
    }

    return Buffer.from(bytes).toString("ascii");
  }

  /**
   * Get the latest telemetry data
   * Uses tick count verification to ensure consistent reads
   */
  getTelemetry(): TelemetryData | null {
    if (!this.isConnected() || !this.header || !this.memHandle) {
      return null;
    }

    // Retry up to 3 times to get a consistent read
    for (let attempt = 0; attempt < 3; attempt++) {
      // Re-read the variable buffer tick counts from shared memory
      const varBufs = this.readVarBufs();
      if (!varBufs) {
        return null;
      }

      // Find the latest buffer
      let latestBufIndex = 0;
      let latestTickCount = varBufs[0].tickCount;
      for (let i = 1; i < varBufs.length; i++) {
        if (varBufs[i].tickCount > latestTickCount) {
          latestTickCount = varBufs[i].tickCount;
          latestBufIndex = i;
        }
      }

      const latestBuf = varBufs[latestBufIndex];
      if (latestBuf.bufOffset === 0) {
        return null;
      }

      // Read the ENTIRE telemetry buffer in one go for speed
      const bufferData = readMemory(this.memHandle, latestBuf.bufOffset, this.header.bufLen);

      // Parse telemetry from the buffer
      const telemetry: TelemetryData = {};

      for (const varHeader of this.varHeaders) {
        const value = this.parseVariableFromBuffer(bufferData, varHeader);
        telemetry[varHeader.name] = value;
      }

      // Verify the tick count didn't change during our read
      const verifyBufs = this.readVarBufs();
      if (verifyBufs && verifyBufs[latestBufIndex].tickCount === latestTickCount) {
        // Consistent read - return the data
        return telemetry;
      }

      // Tick count changed during read, retry
      getLogger().debug(`[iRacing SDK] Tick count changed during read, retrying (attempt ${attempt + 1})`);
    }

    // All retries failed, return null
    getLogger().warn("[iRacing SDK] Failed to get consistent telemetry read after 3 attempts");

    return null;
  }

  /**
   * Read the variable buffer headers from shared memory
   */
  private readVarBufs(): VarBuf[] | null {
    if (!this.memHandle) return null;

    try {
      const varBufs: VarBuf[] = [];
      for (let i = 0; i < IRSDK_MAX_BUFS; i++) {
        const offset = 48 + i * 16; // varBuf starts at offset 48, each is 16 bytes
        const bufData = readMemory(this.memHandle, offset, 16);
        varBufs.push({
          tickCount: bufData.readInt32LE(0),
          bufOffset: bufData.readInt32LE(4),
          padData: [],
        });
      }

      return varBufs;
    } catch (error) {
      getLogger().error(`[iRacing SDK] Failed to read varBufs: ${error}`);

      return null;
    }
  }

  /**
   * Parse a variable value from a pre-loaded buffer
   */
  private parseVariableFromBuffer(buffer: Buffer, varHeader: VarHeader): any {
    const { type, count, offset } = varHeader;

    // Handle arrays
    if (count > 1) {
      const values: any[] = [];
      let elementSize = 4; // Default to 4 bytes

      if (type === VarType.Char) elementSize = 1;
      else if (type === VarType.Double) elementSize = 8;

      for (let i = 0; i < count; i++) {
        const elemOffset = offset + i * elementSize;
        values.push(this.parseSingleValueFromBuffer(buffer, elemOffset, type));
      }

      return values;
    }

    // Handle single values
    return this.parseSingleValueFromBuffer(buffer, offset, type);
  }

  /**
   * Parse a single value of a specific type from a buffer
   */
  private parseSingleValueFromBuffer(buffer: Buffer, offset: number, type: VarType): any {
    // Bounds check
    if (offset < 0 || offset >= buffer.length) {
      return null;
    }

    switch (type) {
      case VarType.Char:
        return buffer.readInt8(offset);
      case VarType.Bool:
        return buffer.readInt8(offset) !== 0;
      case VarType.Int:
      case VarType.BitField:
        return buffer.readInt32LE(offset);
      case VarType.Float:
        return buffer.readFloatLE(offset);
      case VarType.Double:
        return buffer.readDoubleLE(offset);
      default:
        return null;
    }
  }

  /**
   * Get session info (YAML data)
   */
  getSessionInfo(): SessionInfo | null {
    if (!this.isConnected() || !this.header || !this.memHandle) {
      return null;
    }

    // Check if session info has been updated
    if (this.header.sessionInfoUpdate === this.lastSessionInfoUpdate && this.sessionInfo) {
      return this.sessionInfo;
    }

    // Read session info YAML string
    const sessionInfoBuf = readMemory(this.memHandle, this.header.sessionInfoOffset, this.header.sessionInfoLen);
    const yamlString = this.readString(sessionInfoBuf, 0, this.header.sessionInfoLen);

    // Parse YAML to object
    try {
      this.sessionInfo = yaml.parse(yamlString);
      this.lastSessionInfoUpdate = this.header.sessionInfoUpdate;
    } catch (error) {
      getLogger().error(`[iRacing SDK] Failed to parse session info YAML: ${error}`);

      return null;
    }

    return this.sessionInfo;
  }

  /**
   * Get a specific telemetry variable by name
   */
  getVar(name: string): any {
    const telemetry = this.getTelemetry();
    if (!telemetry) return null;

    return telemetry[name];
  }

  /**
   * Get list of all available variable names
   */
  getVarNames(): string[] {
    return this.varHeaders.map((v) => v.name);
  }

  /**
   * Get variable header info by name
   */
  getVarHeader(name: string): VarHeader | null {
    return this.varHeaders.find((v) => v.name === name) || null;
  }

  /**
   * Find the iRacing window
   * @returns Window handle as number, or 0 if not found
   */
  findIRacingWindow(): number {
    getLogger().info("[iRacing SDK] Finding iRacing window");
    const hwnd = findWindow(null, IRACING_WINDOW_TITLE);
    if (!hwnd) {
      getLogger().warn("[iRacing SDK] iRacing window not found");
    } else {
      getLogger().info("[iRacing SDK] iRacing window found");
    }

    return hwnd;
  }

  /**
   * Send a custom chat message to iRacing
   * @param message The message to send
   */
  sendChatMessage(message: string): boolean {
    getLogger().info("[iRacing SDK] About to send a chat message");

    if (!this.isConnected()) {
      getLogger().warn("[iRacing SDK] Cannot send chat message - not connected");

      return false;
    }

    try {
      const hwnd = this.findIRacingWindow();

      if (!hwnd) {
        getLogger().error("[iRacing SDK] Could not find iRacing window");

        return false;
      }

      getLogger().debug("[iRacing SDK] iRacing window found");

      return ChatCommand.getInstance().sendMessage(hwnd, message);
    } catch (error) {
      getLogger().error(`[iRacing SDK] Error sending chat message: ${error}`);

      return false;
    }
  }
}
