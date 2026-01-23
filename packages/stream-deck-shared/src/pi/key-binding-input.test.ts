import { describe, expect, it } from "vitest";

import { formatKeyBinding, type KeyBindingValue, parseKeyBinding, parseSimpleDefault } from "./key-binding-utils.js";

describe("key-binding-input", () => {
  describe("formatKeyBinding", () => {
    it("should return 'Not set' for null value", () => {
      expect(formatKeyBinding(null)).toBe("Not set");
    });

    it("should return 'Not set' for empty key", () => {
      expect(formatKeyBinding({ key: "", modifiers: [] })).toBe("Not set");
    });

    it("should format simple key without modifiers", () => {
      expect(formatKeyBinding({ key: "a", modifiers: [] })).toBe("A");
    });

    it("should format key with single modifier", () => {
      expect(formatKeyBinding({ key: "a", modifiers: ["ctrl"] })).toBe("Ctrl + A");
    });

    it("should format key with multiple modifiers in correct order", () => {
      expect(formatKeyBinding({ key: "a", modifiers: ["alt", "ctrl", "shift"] })).toBe("Ctrl + Shift + Alt + A");
    });

    it("should use display names for special keys", () => {
      expect(formatKeyBinding({ key: "space", modifiers: [] })).toBe("Space");
      expect(formatKeyBinding({ key: "enter", modifiers: [] })).toBe("Enter");
      expect(formatKeyBinding({ key: "escape", modifiers: [] })).toBe("Esc");
    });

    it("should format function keys correctly", () => {
      expect(formatKeyBinding({ key: "f1", modifiers: [] })).toBe("F1");
      expect(formatKeyBinding({ key: "f12", modifiers: ["ctrl"] })).toBe("Ctrl + F12");
    });

    it("should format arrow keys correctly", () => {
      expect(formatKeyBinding({ key: "up", modifiers: [] })).toBe("Up");
      expect(formatKeyBinding({ key: "down", modifiers: ["shift"] })).toBe("Shift + Down");
    });

    it("should format numpad keys correctly", () => {
      expect(formatKeyBinding({ key: "numpad0", modifiers: [] })).toBe("Num 0");
      expect(formatKeyBinding({ key: "numpad_add", modifiers: [] })).toBe("Num +");
    });

    it("should handle undefined modifiers gracefully", () => {
      const value = { key: "a" } as KeyBindingValue;

      expect(formatKeyBinding(value)).toBe("A");
    });
  });

  describe("parseKeyBinding", () => {
    it("should return null for null input", () => {
      expect(parseKeyBinding(null)).toBeNull();
    });

    it("should return null for empty string", () => {
      expect(parseKeyBinding("")).toBeNull();
    });

    it("should parse valid JSON key binding", () => {
      const json = '{"key":"a","modifiers":["ctrl"]}';
      const result = parseKeyBinding(json);

      expect(result).toEqual({ key: "a", modifiers: ["ctrl"] });
    });

    it("should parse key binding with multiple modifiers", () => {
      const json = '{"key":"f1","modifiers":["ctrl","shift","alt"]}';
      const result = parseKeyBinding(json);

      expect(result).toEqual({ key: "f1", modifiers: ["ctrl", "shift", "alt"] });
    });

    it("should parse key binding with no modifiers", () => {
      const json = '{"key":"space","modifiers":[]}';
      const result = parseKeyBinding(json);

      expect(result).toEqual({ key: "space", modifiers: [] });
    });

    it("should return null for invalid JSON", () => {
      expect(parseKeyBinding("not json")).toBeNull();
    });

    it("should return null for missing key property", () => {
      expect(parseKeyBinding('{"modifiers":["ctrl"]}')).toBeNull();
    });

    it("should return null for non-string key", () => {
      expect(parseKeyBinding('{"key":123,"modifiers":[]}')).toBeNull();
    });

    it("should return null for non-array modifiers", () => {
      expect(parseKeyBinding('{"key":"a","modifiers":"ctrl"}')).toBeNull();
    });
  });

  describe("parseSimpleDefault", () => {
    it("should parse simple key without modifiers", () => {
      expect(parseSimpleDefault("a")).toEqual({ key: "a", modifiers: [] });
    });

    it("should parse function key", () => {
      expect(parseSimpleDefault("F1")).toEqual({ key: "f1", modifiers: [] });
    });

    it("should parse key with single modifier", () => {
      expect(parseSimpleDefault("Ctrl+A")).toEqual({ key: "a", modifiers: ["ctrl"] });
    });

    it("should parse key with multiple modifiers", () => {
      expect(parseSimpleDefault("Ctrl+Shift+Alt+A")).toEqual({
        key: "a",
        modifiers: ["ctrl", "shift", "alt"],
      });
    });

    it("should handle 'Control' alias for 'ctrl'", () => {
      expect(parseSimpleDefault("Control+A")).toEqual({ key: "a", modifiers: ["ctrl"] });
    });

    it("should handle spaces around plus signs", () => {
      expect(parseSimpleDefault("Ctrl + Shift + A")).toEqual({
        key: "a",
        modifiers: ["ctrl", "shift"],
      });
    });

    it("should be case-insensitive", () => {
      expect(parseSimpleDefault("CTRL+SHIFT+A")).toEqual({
        key: "a",
        modifiers: ["ctrl", "shift"],
      });
    });

    it("should return null for invalid key", () => {
      expect(parseSimpleDefault("InvalidKey")).toBeNull();
    });

    it("should return null for modifier-only input", () => {
      expect(parseSimpleDefault("Ctrl+Shift")).toBeNull();
    });

    it("should parse special keys", () => {
      expect(parseSimpleDefault("Space")).toEqual({ key: "space", modifiers: [] });
      expect(parseSimpleDefault("Ctrl+Enter")).toEqual({ key: "enter", modifiers: ["ctrl"] });
    });
  });
});
