// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import the module to trigger custom element registration
import "./color-picker.js";

describe("ird-color-picker", () => {
  let picker: HTMLElement;

  beforeEach(() => {
    // Mock SDPIComponents (not available in test environment)
    (window as unknown as Record<string, unknown>).SDPIComponents = undefined;

    picker = document.createElement("ird-color-picker");

    // Clear document body using DOM API
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }

    document.body.appendChild(picker);
  });

  describe("DOM structure", () => {
    it("should create container with swatch, hex input, and clear button", () => {
      const container = picker.querySelector("div");
      expect(container).not.toBeNull();

      const inputs = picker.querySelectorAll("input");
      expect(inputs.length).toBe(2); // hidden color + text

      const colorInput = picker.querySelector('input[type="color"]');
      expect(colorInput).not.toBeNull();

      const textInput = picker.querySelector('input[type="text"]');
      expect(textInput).not.toBeNull();
      expect(textInput!.getAttribute("placeholder")).toBe("Not set");

      const button = picker.querySelector("button");
      expect(button).not.toBeNull();
      expect(button!.textContent).toBe("\u00D7");
    });
  });

  describe("value getter/setter", () => {
    it("should default to empty string (not set)", () => {
      expect((picker as HTMLInputElement).value).toBe("");
    });

    it("should accept hex color values", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      expect((picker as HTMLInputElement).value).toBe("#ff0000");
    });

    it("should accept empty string for not set", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      (picker as HTMLInputElement).value = "";
      expect((picker as HTMLInputElement).value).toBe("");
    });

    it("should normalize legacy #000001 sentinel to empty string", () => {
      (picker as HTMLInputElement).value = "#000001";
      expect((picker as HTMLInputElement).value).toBe("");
    });
  });

  describe("display update", () => {
    it("should show not-set indicator when value is empty", () => {
      (picker as HTMLInputElement).value = "";
      const swatch = picker.querySelector("div > div") as HTMLDivElement;
      expect(swatch.style.backgroundImage).toContain("data:image/svg+xml");
    });

    it("should show color in swatch when value is set", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      const swatch = picker.querySelector("div > div") as HTMLDivElement;
      expect(swatch.style.backgroundColor).toBe("rgb(255, 0, 0)");
    });

    it("should show hex in text input when value is set", () => {
      (picker as HTMLInputElement).value = "#00aaff";
      const textInput = picker.querySelector('input[type="text"]') as HTMLInputElement;
      expect(textInput.value).toBe("#00aaff");
    });

    it("should clear text input when not set", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      (picker as HTMLInputElement).value = "";
      const textInput = picker.querySelector('input[type="text"]') as HTMLInputElement;
      expect(textInput.value).toBe("");
    });

    it("should hide clear button when not set", () => {
      (picker as HTMLInputElement).value = "";
      const button = picker.querySelector("button") as HTMLButtonElement;
      expect(button.style.display).toBe("none");
    });

    it("should show clear button when value is set", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      const button = picker.querySelector("button") as HTMLButtonElement;
      expect(button.style.display).toBe("");
    });
  });

  describe("clear button", () => {
    it("should clear the value when clicked", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      const button = picker.querySelector("button") as HTMLButtonElement;
      button.click();
      expect((picker as HTMLInputElement).value).toBe("");
    });

    it("should dispatch change event when clicked", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      const handler = vi.fn();
      picker.addEventListener("change", handler);
      const button = picker.querySelector("button") as HTMLButtonElement;
      button.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("hex input", () => {
    it("should accept valid 6-digit hex on blur", () => {
      const textInput = picker.querySelector('input[type="text"]') as HTMLInputElement;
      textInput.value = "#aabbcc";
      textInput.dispatchEvent(new Event("blur"));
      expect((picker as HTMLInputElement).value).toBe("#aabbcc");
    });

    it("should accept valid 3-digit hex and expand", () => {
      const textInput = picker.querySelector('input[type="text"]') as HTMLInputElement;
      textInput.value = "#abc";
      textInput.dispatchEvent(new Event("blur"));
      expect((picker as HTMLInputElement).value).toBe("#aabbcc");
    });

    it("should accept hex without # prefix", () => {
      const textInput = picker.querySelector('input[type="text"]') as HTMLInputElement;
      textInput.value = "ff0000";
      textInput.dispatchEvent(new Event("blur"));
      expect((picker as HTMLInputElement).value).toBe("#ff0000");
    });

    it("should be case-insensitive", () => {
      const textInput = picker.querySelector('input[type="text"]') as HTMLInputElement;
      textInput.value = "#AABBCC";
      textInput.dispatchEvent(new Event("blur"));
      expect((picker as HTMLInputElement).value).toBe("#aabbcc");
    });

    it("should revert display on invalid hex", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      const textInput = picker.querySelector('input[type="text"]') as HTMLInputElement;
      textInput.value = "not-a-color";
      textInput.dispatchEvent(new Event("blur"));
      // Value should not change
      expect((picker as HTMLInputElement).value).toBe("#ff0000");
      // Display should revert
      expect(textInput.value).toBe("#ff0000");
    });

    it("should clear value when hex input is emptied", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      const textInput = picker.querySelector('input[type="text"]') as HTMLInputElement;
      textInput.value = "";
      textInput.dispatchEvent(new Event("blur"));
      expect((picker as HTMLInputElement).value).toBe("");
    });

    it("should commit on Enter key", () => {
      const textInput = picker.querySelector('input[type="text"]') as HTMLInputElement;
      textInput.value = "#00ff00";
      textInput.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      expect((picker as HTMLInputElement).value).toBe("#00ff00");
    });
  });

  describe("save", () => {
    it("should call saveToStreamDeck with current value", () => {
      const saveFn = vi.fn();
      (picker as unknown as Record<string, unknown>).saveToStreamDeck = saveFn;

      (picker as HTMLInputElement).value = "#ff0000";
      (picker as unknown as { save(): void }).save();

      expect(saveFn).toHaveBeenCalledWith("#ff0000");
    });

    it("should call saveToStreamDeck with empty string when cleared", () => {
      const saveFn = vi.fn();
      (picker as unknown as Record<string, unknown>).saveToStreamDeck = saveFn;

      (picker as HTMLInputElement).value = "";
      (picker as unknown as { save(): void }).save();

      expect(saveFn).toHaveBeenCalledWith("");
    });

    it("should be a no-op when saveToStreamDeck is null", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      // saveToStreamDeck is null by default (no SDPIComponents in test)
      expect(() => (picker as unknown as { save(): void }).save()).not.toThrow();
    });
  });
});
