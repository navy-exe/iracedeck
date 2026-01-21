/**
 * Keyboard Service Singleton
 *
 * Provides a lazy-initialized singleton for sending keyboard inputs using keysender.
 * Uses Hardware class for hardware-level key injection that works with games.
 *
 * Usage:
 * 1. Call initializeKeyboard() once at plugin startup
 * 2. Use getKeyboard() in your actions to send key combinations
 *
 * @example
 * // In plugin.ts (entry point)
 * import { initializeKeyboard } from "@iracedeck/stream-deck-shared";
 *
 * await initializeKeyboard(logger);
 *
 * // In action files
 * import { getKeyboard } from "@iracedeck/stream-deck-shared";
 *
 * const keyboard = getKeyboard();
 * await keyboard.sendKeyCombination({ key: "f3" });
 * await keyboard.sendKeyCombination({ key: "r", modifiers: ["shift"] });
 */
import type { ILogger } from "@iracedeck/logger";
import { silentLogger } from "@iracedeck/logger";
// Import keysender types for proper typing
import type { Keyboard, KeyboardButton } from "keysender";

import type { KeyboardKey, KeyboardModifier, KeyCombination } from "./keyboard-types.js";

/**
 * Interface for the keyboard service.
 */
export interface IKeyboardService {
  /**
   * Send a single key press.
   * @param key - The key to press
   * @returns true if successful, false if an error occurred
   */
  sendKey(key: KeyboardKey): Promise<boolean>;

  /**
   * Send a key combination (key with optional modifiers).
   * @param combination - The key combination to send
   * @returns true if successful, false if an error occurred
   */
  sendKeyCombination(combination: KeyCombination): Promise<boolean>;
}

/**
 * Map from our KeyboardKey type to keysender's KeyboardButton.
 * Most keys are the same, but some need mapping.
 */
const KEY_MAP: Partial<Record<KeyboardKey, KeyboardButton>> = {
  // Special keys that need mapping (keysender uses camelCase)
  pageup: "pageUp",
  pagedown: "pageDown",
  // capslock: "capsLock", // if we ever add this
};

/**
 * Convert our KeyboardKey to keysender's KeyboardButton.
 */
function toKeysenderKey(key: KeyboardKey): KeyboardButton {
  return KEY_MAP[key] ?? (key as KeyboardButton);
}

/**
 * Convert our KeyboardModifier to keysender's KeyboardButton.
 */
function toKeysenderModifier(modifier: KeyboardModifier): KeyboardButton {
  // keysender uses the same names: ctrl, shift, alt
  return modifier as KeyboardButton;
}

/**
 * Interface for the Hardware instance from keysender.
 */
interface KeysenderHardware {
  keyboard: Keyboard;
}

/**
 * Keyboard service implementation using keysender.
 */
class KeyboardService implements IKeyboardService {
  private hardware: KeysenderHardware | null = null;
  private logger: ILogger;
  private initPromise: Promise<void> | null = null;

  constructor(logger: ILogger) {
    this.logger = logger;
  }

  /**
   * Lazily initialize keysender Hardware instance.
   * This avoids loading the native module until actually needed.
   */
  private async ensureInitialized(): Promise<KeysenderHardware> {
    if (this.hardware) {
      return this.hardware;
    }

    if (this.initPromise) {
      await this.initPromise;

      return this.hardware!;
    }

    this.initPromise = (async () => {
      try {
        // Dynamic import to avoid loading during test environment
        const keysender = await import("keysender");
        // Create Hardware instance without arguments for desktop-wide targeting
        this.hardware = new keysender.Hardware() as KeysenderHardware;
        this.logger.debug("Keysender Hardware initialized");
      } catch (error) {
        this.logger.error(`Failed to initialize keysender: ${error}`);
        throw error;
      }
    })();

    await this.initPromise;

    return this.hardware!;
  }

  async sendKey(key: KeyboardKey): Promise<boolean> {
    try {
      const hw = await this.ensureInitialized();
      const mappedKey = toKeysenderKey(key);
      this.logger.debug(`Sending key: ${mappedKey}`);
      await hw.keyboard.sendKey(mappedKey);

      return true;
    } catch (error) {
      this.logger.error(`Failed to send key: ${key}: ${error}`);

      return false;
    }
  }

  async sendKeyCombination(combination: KeyCombination): Promise<boolean> {
    try {
      const hw = await this.ensureInitialized();
      const keys: KeyboardButton[] = [];

      // Add modifiers first
      if (combination.modifiers) {
        for (const modifier of combination.modifiers) {
          keys.push(toKeysenderModifier(modifier));
        }
      }

      // Add the main key
      keys.push(toKeysenderKey(combination.key));

      this.logger.debug(`Sending key combination: ${keys.join("+")}`);

      if (keys.length === 1) {
        await hw.keyboard.sendKey(keys[0]);
      } else {
        await hw.keyboard.sendKey(keys);
      }

      return true;
    } catch (error) {
      this.logger.error(`Failed to send key combination: ${JSON.stringify(combination)}: ${error}`);

      return false;
    }
  }
}

// Singleton instance
let keyboardService: KeyboardService | null = null;

/**
 * Initialize the keyboard service singleton.
 * Should be called once at plugin startup.
 *
 * @param logger - Optional logger instance for keyboard service logging
 * @returns The initialized keyboard service
 * @throws Error if called more than once
 */
export async function initializeKeyboard(logger: ILogger = silentLogger): Promise<IKeyboardService> {
  if (keyboardService) {
    throw new Error("Keyboard service already initialized. initializeKeyboard() should only be called once.");
  }

  keyboardService = new KeyboardService(logger);

  return keyboardService;
}

/**
 * Get the keyboard service for sending key combinations.
 *
 * @returns The keyboard service instance
 * @throws Error if keyboard service hasn't been initialized
 */
export function getKeyboard(): IKeyboardService {
  if (!keyboardService) {
    throw new Error("Keyboard service not initialized. Call initializeKeyboard() first in your plugin entry point.");
  }

  return keyboardService;
}

/**
 * Check if the keyboard service has been initialized.
 *
 * @returns true if keyboard service is initialized, false otherwise
 */
export function isKeyboardInitialized(): boolean {
  return keyboardService !== null;
}

/**
 * Reset the keyboard service singleton (for testing purposes only).
 * @internal
 */
export function _resetKeyboard(): void {
  keyboardService = null;
}
