import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { _resetKeyboard, getKeyboard, initializeKeyboard, isKeyboardInitialized } from "./keyboard-service.js";

// Mock the keysender module
const mockSendKey = vi.fn().mockResolvedValue(undefined);

vi.mock("keysender", () => ({
  Hardware: class MockHardware {
    keyboard = {
      sendKey: mockSendKey,
    };
  },
}));

// Mock the logger
vi.mock("@iracedeck/logger", () => ({
  silentLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Keyboard Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    _resetKeyboard();
  });

  describe("isKeyboardInitialized", () => {
    it("should return false before initialization", () => {
      expect(isKeyboardInitialized()).toBe(false);
    });

    it("should return true after initialization", async () => {
      await initializeKeyboard();

      expect(isKeyboardInitialized()).toBe(true);
    });
  });

  describe("initializeKeyboard", () => {
    it("should return the keyboard service", async () => {
      const service = await initializeKeyboard();

      expect(service).toHaveProperty("sendKey");
      expect(service).toHaveProperty("sendKeyCombination");
    });

    it("should throw if called twice", async () => {
      await initializeKeyboard();

      await expect(initializeKeyboard()).rejects.toThrow("Keyboard service already initialized");
    });
  });

  describe("getKeyboard", () => {
    it("should throw if not initialized", () => {
      expect(() => getKeyboard()).toThrow("Keyboard service not initialized");
    });

    it("should return the keyboard service after initialization", async () => {
      await initializeKeyboard();
      const service = getKeyboard();

      expect(service).toHaveProperty("sendKey");
      expect(service).toHaveProperty("sendKeyCombination");
    });
  });

  describe("sendKey", () => {
    it("should send a key press", async () => {
      await initializeKeyboard();
      const keyboard = getKeyboard();

      const result = await keyboard.sendKey("f3");

      expect(result).toBe(true);
      expect(mockSendKey).toHaveBeenCalledWith("f3");
    });

    it("should map special keys correctly", async () => {
      await initializeKeyboard();
      const keyboard = getKeyboard();

      await keyboard.sendKey("pageup");
      expect(mockSendKey).toHaveBeenCalledWith("pageUp");

      await keyboard.sendKey("pagedown");
      expect(mockSendKey).toHaveBeenCalledWith("pageDown");
    });

    it("should return false on error", async () => {
      mockSendKey.mockRejectedValueOnce(new Error("Test error"));
      await initializeKeyboard();
      const keyboard = getKeyboard();

      const result = await keyboard.sendKey("a");

      expect(result).toBe(false);
    });
  });

  describe("sendKeyCombination", () => {
    it("should send a key combination without modifiers", async () => {
      await initializeKeyboard();
      const keyboard = getKeyboard();

      const result = await keyboard.sendKeyCombination({ key: "f1" });

      expect(result).toBe(true);
      expect(mockSendKey).toHaveBeenCalledWith("f1");
    });

    it("should send a key combination with single modifier", async () => {
      await initializeKeyboard();
      const keyboard = getKeyboard();

      const result = await keyboard.sendKeyCombination({
        key: "r",
        modifiers: ["shift"],
      });

      expect(result).toBe(true);
      expect(mockSendKey).toHaveBeenCalledWith(["shift", "r"]);
    });

    it("should send a key combination with multiple modifiers", async () => {
      await initializeKeyboard();
      const keyboard = getKeyboard();

      const result = await keyboard.sendKeyCombination({
        key: "s",
        modifiers: ["ctrl", "shift"],
      });

      expect(result).toBe(true);
      expect(mockSendKey).toHaveBeenCalledWith(["ctrl", "shift", "s"]);
    });

    it("should return false on error", async () => {
      mockSendKey.mockRejectedValueOnce(new Error("Test error"));
      await initializeKeyboard();
      const keyboard = getKeyboard();

      const result = await keyboard.sendKeyCombination({ key: "a" });

      expect(result).toBe(false);
    });
  });

  describe("_resetKeyboard", () => {
    it("should reset the keyboard service state", async () => {
      await initializeKeyboard();

      expect(isKeyboardInitialized()).toBe(true);

      _resetKeyboard();

      expect(isKeyboardInitialized()).toBe(false);
    });

    it("should allow re-initialization after reset", async () => {
      await initializeKeyboard();
      _resetKeyboard();

      await expect(initializeKeyboard()).resolves.not.toThrow();
    });
  });
});
