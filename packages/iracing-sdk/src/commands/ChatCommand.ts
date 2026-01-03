/**
 * ChatCommand - Chat commands for iRacing
 *
 * Handles chat operations using the iRacing broadcast API and Windows messaging
 */
import { sendChatString, sendKeyPress, VK_RETURN } from "@iracedeck/iracing-native";

import { getLogger } from "../logger.js";
import { BroadcastCommand } from "./BroadcastCommand.js";
import { BroadcastMsg, ChatCommandMode } from "./constants.js";

/**
 * Chat commands
 */
export class ChatCommand extends BroadcastCommand {
  private static _instance: ChatCommand;

  private constructor() {
    super();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ChatCommand {
    if (!ChatCommand._instance) {
      ChatCommand._instance = new ChatCommand();
    }

    return ChatCommand._instance;
  }

  /**
   * Send a chat broadcast message
   */
  private sendChatBroadcast(command: ChatCommandMode, subCommand: number = 0): boolean {
    getLogger().debug(`[ChatCommand] sendBroadcast ${ChatCommandMode[command]}, ${subCommand}`);

    return this.sendBroadcast(BroadcastMsg.ChatCommand, command, subCommand);
  }

  /**
   * Trigger a chat macro (1-15)
   * @param macroNum Macro number (1-15, as shown in app.ini)
   * @returns Success
   */
  macro(macroNum: number): boolean {
    if (macroNum < 1 || macroNum > 15) {
      getLogger().warn(`[ChatCommand] Invalid macro number: ${macroNum}. Must be 1-15.`);

      return false;
    }

    getLogger().info(`[ChatCommand] Triggering chat macro ${macroNum}`);

    // API uses 0-based indexing, but app.ini uses 1-based numbering
    return this.sendChatBroadcast(ChatCommandMode.Macro, macroNum - 1);
  }

  /**
   * Open the chat window
   * @returns Success
   */
  beginChat(): boolean {
    getLogger().debug("[ChatCommand] Opening chat window");

    return this.sendChatBroadcast(ChatCommandMode.BeginChat);
  }

  /**
   * Reply to last private message
   * @returns Success
   */
  reply(): boolean {
    getLogger().debug("[ChatCommand] Opening reply to last private message");

    return this.sendChatBroadcast(ChatCommandMode.Reply);
  }

  /**
   * Close the chat window
   * @returns Success
   */
  cancel(): boolean {
    getLogger().debug("[ChatCommand] Closing chat window");

    return this.sendChatBroadcast(ChatCommandMode.Cancel);
  }

  /**
   * Send a custom chat message to iRacing
   * Opens chat, types the message, and sends it
   * @param hwnd Window handle to send the message to
   * @param message The message to send
   * @returns Success
   */
  sendMessage(hwnd: number, message: string): boolean {
    if (!message || message.trim().length === 0) {
      getLogger().warn("[ChatCommand] Cannot send empty message");

      return false;
    }

    if (!hwnd) {
      getLogger().error("[ChatCommand] Invalid window handle");

      return false;
    }

    try {
      getLogger().info(`[ChatCommand] Sending chat message: "${message}"`);

      // Open chat window
      this.beginChat();

      getLogger().info("[ChatCommand] Chat window opened");

      // Wait for chat window to open, then type message
      setTimeout(() => {
        // Send each character using WM_CHAR (optimized in native addon)
        sendChatString(hwnd, message);

        // Press Enter to send
        sendKeyPress(hwnd, VK_RETURN);

        // Close chat window
        this.cancel();

        getLogger().info("[ChatCommand] Chat message sent successfully");
      }, 5);

      return true;
    } catch (error) {
      getLogger().error(`[ChatCommand] Error sending chat message: ${error}`);

      return false;
    }
  }
}
