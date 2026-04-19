/**
 * @iracedeck/iracing-native
 *
 * Native Node.js addon for iRacing SDK integration.
 * Uses the official iRacing SDK for telemetry access and broadcast messaging.
 *
 * On non-Windows platforms, a mock implementation is used automatically
 * to enable development and testing on macOS/Linux.
 */
import { existsSync } from "fs";
import { createRequire } from "module";
import { platform } from "os";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

import type { BroadcastMsg, IRSDKHeader, VarHeader } from "./defines.js";
import { IRacingNativeMock } from "./mock-impl.js";

// Re-export all types and enums from defines
export * from "./defines.js";
export { IRacingNativeMock } from "./mock-impl.js";

/**
 * Audio mixer channel indices for the miniaudio engine.
 */
export enum AudioChannel {
  /** Pit lane background noise (loops) */
  Ambient = 0,
  /** Walkie-talkie open/close ticks */
  SFX = 1,
  /** Engineer voice messages, reminders, toggles */
  Voice = 2,
  /** Directional spotter ticks (independent) */
  Spotter = 3,
}

/**
 * Result codes from focusIRacingWindow().
 */
export enum FocusResult {
  /** Window was already in the foreground */
  AlreadyFocused = 0,
  /** Window was found and successfully focused */
  Focused = 1,
  /** No window with the expected title exists */
  WindowNotFound = 2,
  /** Window was found but focus did not transfer within timeout */
  FocusTimedOut = 3,
}

// Try to load native addon (only on Windows, with safety catch).
// Force mock mode by creating a `.mock` file in the sdPlugin folder,
// or by setting IRACEDECK_MOCK=1 in the environment.
let addon: any = null;
const forceMock = !!process.env.IRACEDECK_MOCK || existsSync(join(process.cwd(), ".mock"));

if (platform() === "win32" && !forceMock) {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const require = createRequire(import.meta.url);
    addon = require(join(__dirname, "..", "build", "Release", "iracing_native.node"));
  } catch {
    /* Native addon not available — mock will be used */
  }
}

/**
 * iRacing Native SDK
 *
 * Provides direct access to the iRacing SDK via native addon.
 * On non-Windows platforms (or when the native addon is unavailable),
 * delegates to IRacingNativeMock for simulated data.
 *
 * This is the low-level interface - for most use cases, use @iracedeck/iracing-sdk instead.
 */
export class IRacingNative {
  private mock: IRacingNativeMock | null = null;

  private getMock(): IRacingNativeMock {
    if (!this.mock) this.mock = new IRacingNativeMock();

    return this.mock;
  }

  // ============================================================================
  // SDK Connection
  // ============================================================================

  /**
   * Initialize connection to iRacing
   * @returns true if connected
   */
  startup(): boolean {
    return addon ? addon.startup() : this.getMock().startup();
  }

  /**
   * Close connection to iRacing
   */
  shutdown(): void {
    if (addon) {
      addon.shutdown();
    } else {
      this.getMock().shutdown();
    }
  }

  /**
   * Check if connected to iRacing
   * @returns true if connected
   */
  isConnected(): boolean {
    return addon ? addon.isConnected() : this.getMock().isConnected();
  }

  // ============================================================================
  // Data Access
  // ============================================================================

  /**
   * Get the iRacing SDK header
   * @returns Header object or null if not connected
   */
  getHeader(): IRSDKHeader | null {
    return addon ? addon.getHeader() : this.getMock().getHeader();
  }

  /**
   * Get telemetry data from a specific buffer
   * @param index - Buffer index (0-3)
   * @returns Buffer with telemetry data or null
   */
  getData(index: number): Buffer | null {
    return addon ? addon.getData(index) : this.getMock().getData(index);
  }

  /**
   * Wait for new data to be available
   * @param timeoutMs - Timeout in milliseconds (default 16 for ~60fps)
   * @returns Buffer with new data or null if timeout
   */
  waitForData(timeoutMs?: number): Buffer | null {
    return addon ? addon.waitForData(timeoutMs) : this.getMock().waitForData(timeoutMs);
  }

  /**
   * Get session info YAML string
   * @returns Session info string or null
   */
  getSessionInfoStr(): string | null {
    return addon ? addon.getSessionInfoStr() : this.getMock().getSessionInfoStr();
  }

  /**
   * Get variable header by index
   * @param index - Variable index
   * @returns Variable header object or null
   */
  getVarHeaderEntry(index: number): VarHeader | null {
    return addon ? addon.getVarHeaderEntry(index) : this.getMock().getVarHeaderEntry(index);
  }

  /**
   * Get variable index by name
   * @param name - Variable name
   * @returns Index or -1 if not found
   */
  varNameToIndex(name: string): number {
    return addon ? addon.varNameToIndex(name) : this.getMock().varNameToIndex(name);
  }

  // ============================================================================
  // Broadcast Messages
  // ============================================================================

  /**
   * Send a broadcast message to iRacing
   * @param msg - Broadcast message type
   * @param var1 - First parameter
   * @param var2 - Second parameter (optional)
   * @param var3 - Third parameter (optional)
   */
  broadcastMsg(msg: BroadcastMsg | number, var1: number, var2?: number, var3?: number): void {
    if (addon) {
      addon.broadcastMsg(msg, var1, var2 ?? 0, var3 ?? 0);
    } else {
      this.getMock().broadcastMsg(msg, var1, var2, var3);
    }
  }

  // ============================================================================
  // Chat
  // ============================================================================

  /**
   * Send a complete chat message to iRacing.
   *
   * The native addon runs the entire chat-send pipeline on a libuv worker
   * thread and returns a Promise, so the JS event loop remains responsive
   * during the ~400ms native work. Concurrent sends are serialized natively.
   *
   * @param message - The message to send
   * @returns Promise resolving to true on success, false on failure
   */
  sendChatMessage(message: string): Promise<boolean> {
    return addon ? addon.sendChatMessage(message) : this.getMock().sendChatMessage(message);
  }

  // ============================================================================
  // Window Management
  // ============================================================================

  /**
   * Attempt to bring the iRacing simulator window to the foreground.
   * Uses AttachThreadInput pattern for reliable window focusing on Windows.
   *
   * @returns FocusResult status code (0=already focused, 1=focused, 2=not found, 3=timed out)
   */
  focusIRacingWindow(): number {
    return addon ? addon.focusIRacingWindow() : this.getMock().focusIRacingWindow();
  }

  // ============================================================================
  // Keyboard Input
  // ============================================================================

  /**
   * Send a key combination using PS/2 scan codes.
   * Presses each scan code in order (modifiers first, then main key),
   * then releases all in reverse order.
   *
   * Uses SendInput with KEYEVENTF_SCANCODE for layout-independent key sending.
   * Extended keys (arrows, delete, etc.) use bit 0x100 to signal KEYEVENTF_EXTENDEDKEY.
   *
   * @param scanCodes - Array of PS/2 scan codes
   */
  sendScanKeys(scanCodes: number[]): void {
    if (addon) {
      addon.sendScanKeys(scanCodes);
    } else {
      this.getMock().sendScanKeys(scanCodes);
    }
  }

  /**
   * Press scan codes without releasing (for key hold/long-press).
   * Presses each scan code in order (modifiers first, then main key).
   * Caller must call {@link sendScanKeyUp} to release the keys.
   *
   * @param scanCodes - Array of PS/2 scan codes
   */
  sendScanKeyDown(scanCodes: number[]): void {
    if (addon) {
      addon.sendScanKeyDown(scanCodes);
    } else {
      this.getMock().sendScanKeyDown(scanCodes);
    }
  }

  /**
   * Release scan codes without pressing (for key hold/long-press).
   * Releases each scan code in reverse order (main key first, then modifiers).
   * Should be called after {@link sendScanKeyDown} to release held keys.
   *
   * @param scanCodes - Array of PS/2 scan codes
   */
  sendScanKeyUp(scanCodes: number[]): void {
    if (addon) {
      addon.sendScanKeyUp(scanCodes);
    } else {
      this.getMock().sendScanKeyUp(scanCodes);
    }
  }

  // ──── Audio Engine (miniaudio — multi-channel mixer) ────────────────────────

  /**
   * Initialize the miniaudio audio engine.
   * @returns true if the engine was created successfully
   */
  initAudioEngine(): boolean {
    return addon ? addon.initAudioEngine() : this.getMock().initAudioEngine();
  }

  /**
   * Destroy the miniaudio engine and release all resources.
   */
  destroyAudioEngine(): void {
    if (addon) {
      addon.destroyAudioEngine();
    } else {
      this.getMock().destroyAudioEngine();
    }
  }

  /**
   * Play an audio file on a specific mixer channel.
   * Stops any existing sound on that channel first.
   * Supports WAV, MP3, and FLAC formats.
   *
   * @param channel - Channel index (0–3, use AudioChannel enum)
   * @param filePath - Absolute path to the audio file
   * @param loop - Whether to loop the sound (default false)
   * @param volume - Volume level 0.0–1.0 (default 1.0)
   * @returns true if playback started successfully
   */
  playOnChannel(channel: number, filePath: string, loop = false, volume = 1.0): boolean {
    return addon
      ? addon.playOnChannel(channel, filePath, loop, volume)
      : this.getMock().playOnChannel(channel, filePath, loop, volume);
  }

  /**
   * Stop playback on a specific channel and release the sound.
   * @param channel - Channel index (0–3)
   */
  stopChannel(channel: number): void {
    if (addon) {
      addon.stopChannel(channel);
    } else {
      this.getMock().stopChannel(channel);
    }
  }

  /**
   * Set the volume on a specific channel.
   * @param channel - Channel index (0–3)
   * @param volume - Volume level 0.0–1.0
   */
  setChannelVolume(channel: number, volume: number): void {
    if (addon) {
      addon.setChannelVolume(channel, volume);
    } else {
      this.getMock().setChannelVolume(channel, volume);
    }
  }

  /**
   * Check if a channel is currently playing audio.
   * @param channel - Channel index (0–3)
   * @returns true if the channel has active playback
   */
  isChannelPlaying(channel: number): boolean {
    return addon ? addon.isChannelPlaying(channel) : this.getMock().isChannelPlaying(channel);
  }

  /**
   * Register a callback that fires when a channel's sound finishes playing.
   * The callback is marshaled from the audio thread to the JS main thread.
   *
   * @param channel - Channel index (0–3)
   * @param callback - Function to call when playback completes
   */
  setChannelEndCallback(channel: number, callback: () => void): void {
    if (addon) {
      addon.setChannelEndCallback(channel, callback);
    } else {
      this.getMock().setChannelEndCallback(channel, callback);
    }
  }

  /**
   * Stop all mixer channels.
   */
  stopAllChannels(): void {
    if (addon) {
      addon.stopAllChannels();
    } else {
      this.getMock().stopAllChannels();
    }
  }

  /**
   * Seek a channel to a random position (for ambient variation).
   */
  seekChannelRandom(channel: number): void {
    if (addon) {
      addon.seekChannelRandom(channel);
    } else {
      this.getMock().seekChannelRandom(channel);
    }
  }

  /**
   * Get list of available audio playback devices.
   */
  getAudioDevices(): Array<{ index: number; name: string; isDefault: boolean }> {
    if (addon) {
      return addon.getAudioDevices();
    }

    return this.getMock().getAudioDevices();
  }

  /**
   * Switch audio output to a specific device. -1 for system default.
   */
  setAudioDevice(deviceIndex: number): boolean {
    if (addon) {
      return addon.setAudioDevice(deviceIndex);
    }

    return this.getMock().setAudioDevice(deviceIndex);
  }
}
