/// <reference lib="dom" />
/**
 * Key Binding Input Web Component for Stream Deck Property Inspector
 *
 * A custom input component that captures keyboard shortcuts.
 * Click to start recording, press a key combination, and it saves automatically.
 *
 * Usage in HTML:
 * ```html
 * <sdpi-item label="Hotkey">
 *   <ird-key-binding setting="myHotkey" default="F1"></ird-key-binding>
 * </sdpi-item>
 * ```
 *
 * The stored value is a JSON string with format:
 * { "key": "f1", "modifiers": ["ctrl", "shift"] }
 */
import {
  formatKeyBinding,
  type KeyBindingValue,
  parseKeyBinding,
  parseSimpleDefault,
  SDPI_THEME,
  UI_TEXT,
} from "./key-binding-utils.js";
import { KEY_CODE_MAP, type Modifier } from "./key-maps.js";

// Re-export for backwards compatibility and public API
export { formatKeyBinding, parseKeyBinding, parseSimpleDefault, type KeyBindingValue };

/**
 * SDPIComponents global type declaration.
 *
 * This component integrates with Elgato's sdpi-components library (sdpi-components.js)
 * which exposes window.SDPIComponents as its public API. The useSettings hook provides:
 * - Automatic settings loading when PI connects to Stream Deck
 * - Settings persistence via Stream Deck's setSettings API
 * - Change notifications when settings update externally
 *
 * This global dependency is intentional - it's the standard integration pattern
 * for custom PI components that need to persist settings to Stream Deck.
 */
declare global {
  interface Window {
    SDPIComponents?: {
      useSettings: (
        key: string,
        callback: (value: string) => void,
        debounceMs?: number | null,
      ) => [() => Promise<string>, (value: string) => void];
    };
  }
}

/**
 * KeyBindingInput - Custom element that integrates with sdpi-components
 * via SDPIComponents.useSettings() for proper settings persistence.
 */
class KeyBindingInput extends HTMLElement {
  private displayInput: HTMLInputElement | null = null;
  private isRecording = false;
  private currentValue: KeyBindingValue | null = null;
  private saveToStreamDeck: ((value: string) => void) | null = null;

  constructor() {
    super();

    // Bind event handlers
    this.handleClick = this.handleClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleBlur = this.handleBlur.bind(this);
  }

  /**
   * Value getter - returns JSON string for sdpi-components
   */
  get value(): string {
    return this.currentValue ? JSON.stringify(this.currentValue) : "";
  }

  /**
   * Value setter - accepts JSON string from sdpi-components
   */
  set value(val: string) {
    if (val) {
      this.currentValue = parseKeyBinding(val);
    } else {
      this.currentValue = null;
    }

    this.updateDisplay();
  }

  connectedCallback(): void {
    // Create visible input for user interaction
    this.displayInput = document.createElement("input");
    this.displayInput.type = "text";
    this.displayInput.readOnly = true;
    this.displayInput.placeholder = UI_TEXT.PLACEHOLDER;

    // Apply SDPI-matching styles directly (SDPI uses Shadow DOM so CSS vars aren't inherited)
    Object.assign(this.displayInput.style, {
      backgroundColor: SDPI_THEME.background,
      color: SDPI_THEME.text,
      fontFamily: SDPI_THEME.fontFamily,
      fontSize: SDPI_THEME.fontSize,
      height: SDPI_THEME.height,
      padding: SDPI_THEME.padding,
      border: "none",
      borderRadius: "0",
      boxSizing: "border-box",
      width: "100%",
      cursor: "pointer",
    });

    this.appendChild(this.displayInput);

    // Get setting name and integrate with SDPIComponents
    const settingName = this.getAttribute("setting");

    if (settingName && window.SDPIComponents) {
      // Use SDPIComponents.useSettings to get/save settings
      const [, save] = window.SDPIComponents.useSettings(
        settingName,
        (value: string) => {
          // Called when settings are loaded or changed externally
          this.value = value;
        },
        null, // No debounce
      );
      this.saveToStreamDeck = save;
    }

    // Get default value if specified and no value is set yet
    const defaultValue = this.getAttribute("default");

    if (defaultValue && !this.currentValue) {
      // Parse simple default like "F1" or "Ctrl+Shift+A"
      this.currentValue = parseSimpleDefault(defaultValue);
    }

    this.updateDisplay();

    this.displayInput.addEventListener("click", this.handleClick);
    this.displayInput.addEventListener("keydown", this.handleKeyDown);
    this.displayInput.addEventListener("blur", this.handleBlur);
  }

  disconnectedCallback(): void {
    if (this.displayInput) {
      this.displayInput.removeEventListener("click", this.handleClick);
      this.displayInput.removeEventListener("keydown", this.handleKeyDown);
      this.displayInput.removeEventListener("blur", this.handleBlur);
    }
  }

  /**
   * Programmatically set the key binding value.
   * Part of the custom element public API for external/programmatic access.
   */
  setValue(value: KeyBindingValue | null): void {
    this.currentValue = value;
    this.updateDisplay();
  }

  /**
   * Programmatically get the current key binding value.
   * Part of the custom element public API for external/programmatic access.
   */
  getValue(): KeyBindingValue | null {
    return this.currentValue;
  }

  private handleClick(): void {
    if (!this.isRecording) {
      this.startRecording();
    }
  }

  private startRecording(): void {
    if (!this.displayInput) return;

    this.isRecording = true;
    this.displayInput.value = UI_TEXT.RECORDING;
    this.displayInput.style.backgroundColor = SDPI_THEME.recordingBackground;
    this.displayInput.style.borderColor = SDPI_THEME.recordingBorder;
    this.displayInput.focus();
  }

  private stopRecording(): void {
    if (!this.displayInput) return;

    this.isRecording = false;
    // Restore SDPI theme colors
    this.displayInput.style.backgroundColor = SDPI_THEME.background;
    this.displayInput.style.borderColor = "";
    this.displayInput.blur();
    this.updateDisplay();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!this.isRecording) return;

    e.preventDefault();
    e.stopPropagation();

    // Escape cancels recording
    if (e.code === "Escape") {
      this.stopRecording();

      return;
    }

    // Ignore modifier-only keys
    if (
      e.code === "ControlLeft" ||
      e.code === "ControlRight" ||
      e.code === "ShiftLeft" ||
      e.code === "ShiftRight" ||
      e.code === "AltLeft" ||
      e.code === "AltRight" ||
      e.code === "MetaLeft" ||
      e.code === "MetaRight"
    ) {
      return;
    }

    // Get the key from our map
    const key = KEY_CODE_MAP[e.code];

    if (!key) {
      // Unknown key, ignore
      return;
    }

    // Build modifiers array
    const modifiers: Modifier[] = [];

    if (e.ctrlKey) modifiers.push("ctrl");

    if (e.shiftKey) modifiers.push("shift");

    if (e.altKey) modifiers.push("alt");

    // Set the new value
    this.currentValue = { key, modifiers };

    // Stop recording and update display
    this.stopRecording();

    // Notify Stream Deck of the change
    this.notifyChange();
  }

  private handleBlur(): void {
    if (this.isRecording) {
      this.stopRecording();
    }
  }

  private updateDisplay(): void {
    if (this.displayInput) {
      this.displayInput.value = formatKeyBinding(this.currentValue);
    }
  }

  private notifyChange(): void {
    // Save to Stream Deck via SDPIComponents.useSettings
    if (this.saveToStreamDeck) {
      this.saveToStreamDeck(this.value);
    }
  }

  /**
   * Observed attributes for the custom element.
   * - "value": Allows setting the key binding via HTML attribute (JSON string format).
   *   Part of the standard custom element API contract.
   * - "default": Initial default value if no setting exists.
   */
  static get observedAttributes(): string[] {
    return ["value", "default"];
  }

  attributeChangedCallback(name: string, _oldValue: string, newValue: string): void {
    if (name === "value" && newValue) {
      this.currentValue = parseKeyBinding(newValue);
      this.updateDisplay();
    }
  }
}

// Register the custom element
if (typeof customElements !== "undefined") {
  customElements.define("ird-key-binding", KeyBindingInput);
}

export { KeyBindingInput };
