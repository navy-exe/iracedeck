/**
 * Interfaces for dependency injection
 *
 * These interfaces allow for testability and follow the Dependency Inversion principle.
 */
import type { BroadcastMsg, IRSDKHeader, VarHeader } from "@iracedeck/iracing-native";

/**
 * Interface for the native iRacing SDK
 * Wraps the native addon functionality for dependency injection
 */
export interface INativeSDK {
  // Connection
  startup(): boolean;
  shutdown(): void;
  isConnected(): boolean;

  // Data access
  getHeader(): IRSDKHeader | null;
  getData(index: number): Buffer | null;
  waitForData(timeoutMs?: number): Buffer | null;
  getSessionInfoStr(): string | null;
  getVarHeaderEntry(index: number): VarHeader | null;
  varNameToIndex(name: string): number;

  // Broadcast
  broadcastMsg(msg: BroadcastMsg | number, var1: number, var2?: number, var3?: number): void;

  // Chat
  sendChatMessage(message: string): boolean;
}
