/// <reference lib="dom" />
/**
 * Color Picker Web Component for Stream Deck Property Inspector
 *
 * A custom color picker that supports a "not set" state, inline hex display,
 * and a built-in clear button. Replaces `<sdpi-color>` which always requires
 * a value and used the #000001 sentinel hack for "not set".
 *
 * Usage in HTML:
 * ```html
 * <!-- Per-action color override -->
 * <sdpi-item label="Background">
 *   <ird-color-picker id="my-id" setting="colorOverrides.backgroundColor"></ird-color-picker>
 * </sdpi-item>
 *
 * <!-- Global color setting -->
 * <sdpi-item label="Background">
 *   <ird-color-picker id="my-id" setting="colorBackgroundColor" global></ird-color-picker>
 * </sdpi-item>
 * ```
 *
 * Attributes:
 * - setting: The settings key name (supports dot-notation for nested paths)
 * - default: Default hex color when no saved value exists
 * - global: When present, uses plugin-level global settings
 *
 * Stored values:
 * - Has color: hex string like "#ff0000"
 * - Not set: empty string ""
 */
import { SDPI_THEME } from "./key-binding-utils.js";

/** Inline SVG data URI for the "not set" indicator: white with red diagonal line */
const NOT_SET_BACKGROUND = `url("data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
    '<rect width="24" height="24" fill="white"/>' +
    '<line x1="0" y1="24" x2="24" y2="0" stroke="red" stroke-width="2"/>' +
    "</svg>",
)}")`;

/** Regex for validating hex color input (3 or 6 hex digits, with or without #) */
const HEX_REGEX = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Normalize a hex color string to lowercase 6-digit format with # prefix.
 * Returns empty string for invalid input.
 */
function normalizeHex(input: string): string {
  const trimmed = input.trim();

  if (!HEX_REGEX.test(trimmed)) return "";

  let hex = trimmed.startsWith("#") ? trimmed.slice(1) : trimmed;

  // Expand 3-digit shorthand to 6-digit
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  return `#${hex.toLowerCase()}`;
}

/**
 * Check if a value is the legacy #000001 sentinel (meaning "not set").
 */
function isLegacySentinel(value: string): boolean {
  return value === "#000001";
}

/**
 * ColorPicker - Custom element that integrates with sdpi-components
 * via SDPIComponents.useSettings() for proper settings persistence.
 *
 * Features:
 * - "Not set" state with Illustrator-style red diagonal indicator
 * - Inline editable hex code display
 * - Built-in clear button
 * - Normalizes legacy #000001 sentinel to empty string on load
 */
export class ColorPicker extends HTMLElement {
  private container: HTMLDivElement | null = null;
  private swatch: HTMLDivElement | null = null;
  private nativeInput: HTMLInputElement | null = null;
  private hexInput: HTMLInputElement | null = null;
  private clearBtn: HTMLButtonElement | null = null;
  private currentValue = "";
  private saveToStreamDeck: ((value: string) => void) | null = null;
  private _dispatching = false;
  private _initialized = false;

  static get observedAttributes(): string[] {
    return ["value", "setting", "default", "global"];
  }

  get value(): string {
    return this.currentValue;
  }

  set value(val: string) {
    // Normalize legacy sentinel to empty
    if (isLegacySentinel(val)) val = "";

    this.currentValue = val;
    this.updateDisplay();
  }

  connectedCallback(): void {
    if (this._initialized) return;

    this._initialized = true;

    this.buildDOM();
    this.attachListeners();
    this.hookSettings();
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null): void {
    if (name === "value" && newValue !== null) {
      this.value = newValue;
    }
  }

  private buildDOM(): void {
    // Container
    this.container = document.createElement("div");
    Object.assign(this.container.style, {
      display: "flex",
      alignItems: "center",
      gap: "6px",
    });

    // Swatch (clickable/keyboard-accessible color preview)
    this.swatch = document.createElement("div");
    this.swatch.setAttribute("tabindex", "0");
    this.swatch.setAttribute("role", "button");
    Object.assign(this.swatch.style, {
      width: "26px",
      height: "26px",
      minWidth: "26px",
      borderRadius: "3px",
      cursor: "pointer",
      border: "1px solid #555",
      boxSizing: "border-box",
      backgroundSize: "cover",
    });

    // Hidden native color input
    this.nativeInput = document.createElement("input");
    this.nativeInput.type = "color";
    Object.assign(this.nativeInput.style, {
      position: "absolute",
      opacity: "0",
      width: "0",
      height: "0",
      pointerEvents: "none",
    });

    // Editable hex text input
    this.hexInput = document.createElement("input");
    this.hexInput.type = "text";
    this.hexInput.placeholder = "Not set";
    this.hexInput.maxLength = 7;
    Object.assign(this.hexInput.style, {
      flex: "1",
      backgroundColor: SDPI_THEME.background,
      color: SDPI_THEME.text,
      fontFamily: SDPI_THEME.fontFamily,
      fontSize: SDPI_THEME.fontSize,
      border: "none",
      borderBottom: "1px solid #555",
      outline: "none",
      padding: "2px 4px",
      height: "26px",
      boxSizing: "border-box",
      minWidth: "0",
    });

    // Clear button
    this.clearBtn = document.createElement("button");
    this.clearBtn.type = "button";
    this.clearBtn.textContent = "\u00D7"; // ×
    this.clearBtn.title = "Clear color";
    Object.assign(this.clearBtn.style, {
      background: "none",
      border: "none",
      color: "#808080",
      cursor: "pointer",
      fontSize: "16px",
      lineHeight: "1",
      padding: "0 2px",
      flexShrink: "0",
    });

    this.container.appendChild(this.swatch);
    this.container.appendChild(this.nativeInput);
    this.container.appendChild(this.hexInput);
    this.container.appendChild(this.clearBtn);
    this.appendChild(this.container);

    this.updateDisplay();
  }

  private openNativePicker(): void {
    this.nativeInput!.value = this.currentValue || "#000000";
    this.nativeInput!.click();
  }

  private attachListeners(): void {
    // Swatch click/keyboard opens native picker
    this.swatch!.addEventListener("click", () => {
      this.openNativePicker();
    });

    this.swatch!.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        this.openNativePicker();
      }
    });

    // Native picker live preview
    this.nativeInput!.addEventListener("input", () => {
      if (this.swatch) {
        this.swatch.style.backgroundImage = "none";
        this.swatch.style.backgroundColor = this.nativeInput!.value;
      }
    });

    // Native picker commit
    this.nativeInput!.addEventListener("change", () => {
      this.currentValue = this.nativeInput!.value;
      this.updateDisplay();
      this.notifyChange();
    });

    // Hex input commit on blur
    this.hexInput!.addEventListener("blur", () => {
      this.commitHexInput();
    });

    // Hex input commit on Enter
    this.hexInput!.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        this.commitHexInput();
        this.hexInput!.blur();
      }
    });

    // Clear button
    this.clearBtn!.addEventListener("click", () => {
      this.currentValue = "";
      this.updateDisplay();
      this.notifyChange();
    });

    // Handle external change events (from preset buttons: el.value = x; el.dispatchEvent(change))
    this.addEventListener("change", (_e: Event) => {
      if (!this._dispatching) {
        this.saveToStreamDeck?.(this.currentValue);
      }
    });
  }

  private hookSettings(): void {
    const settingName = this.getAttribute("setting");
    const defaultValue = this.getAttribute("default") ?? "";
    const useGlobal = this.hasAttribute("global");

    if (settingName && window.SDPIComponents) {
      const useSettingsHook = useGlobal ? window.SDPIComponents.useGlobalSettings : window.SDPIComponents.useSettings;

      const [, save] = useSettingsHook(
        settingName,
        (value: string) => {
          // Normalize legacy #000001 sentinel to empty string on load
          if (isLegacySentinel(value)) value = "";

          // Apply default for display only — don't persist, so per-action
          // overrides stay empty until the user explicitly sets a value
          if (!value && defaultValue) {
            this.currentValue = normalizeHex(defaultValue) || "";
            this.updateDisplay();

            return;
          }

          this.currentValue = value || "";
          this.updateDisplay();
        },
        null,
      );

      this.saveToStreamDeck = save;
    }
  }

  private commitHexInput(): void {
    const raw = this.hexInput!.value.trim();

    // Empty input = clear (not set)
    if (raw === "") {
      if (this.currentValue !== "") {
        this.currentValue = "";
        this.updateDisplay();
        this.notifyChange();
      }

      return;
    }

    const normalized = normalizeHex(raw);

    if (normalized && normalized !== this.currentValue) {
      this.currentValue = normalized;
      this.updateDisplay();
      this.notifyChange();
    } else if (!normalized) {
      // Invalid input — revert display
      this.updateDisplay();
    }
  }

  private notifyChange(): void {
    this._dispatching = true;
    this.saveToStreamDeck?.(this.currentValue);
    this.dispatchEvent(new Event("change", { bubbles: true }));
    this._dispatching = false;
  }

  private updateDisplay(): void {
    if (!this.swatch || !this.hexInput || !this.clearBtn) return;

    const hasValue = this.currentValue.length > 0;

    if (hasValue) {
      this.swatch.style.backgroundImage = "none";
      this.swatch.style.backgroundColor = this.currentValue;
      this.hexInput.value = this.currentValue;
      this.hexInput.style.color = SDPI_THEME.text;
      this.clearBtn.style.display = "";
    } else {
      this.swatch.style.backgroundColor = "transparent";
      this.swatch.style.backgroundImage = NOT_SET_BACKGROUND;
      this.hexInput.value = "";
      this.hexInput.style.color = "#808080";
      this.clearBtn.style.display = "none";
    }
  }
}

// Register the custom element
if (typeof customElements !== "undefined") {
  if (!customElements.get("ird-color-picker")) {
    customElements.define("ird-color-picker", ColorPicker);
  }
}
