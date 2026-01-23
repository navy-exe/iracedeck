/**
 * Key code mappings for keyboard input capture.
 *
 * Maps browser KeyboardEvent.code values to our internal key format.
 */

/** Maps browser key codes (KeyboardEvent.code) to internal key identifiers */
export const KEY_CODE_MAP: Record<string, string> = {
  // Letters
  KeyA: "a",
  KeyB: "b",
  KeyC: "c",
  KeyD: "d",
  KeyE: "e",
  KeyF: "f",
  KeyG: "g",
  KeyH: "h",
  KeyI: "i",
  KeyJ: "j",
  KeyK: "k",
  KeyL: "l",
  KeyM: "m",
  KeyN: "n",
  KeyO: "o",
  KeyP: "p",
  KeyQ: "q",
  KeyR: "r",
  KeyS: "s",
  KeyT: "t",
  KeyU: "u",
  KeyV: "v",
  KeyW: "w",
  KeyX: "x",
  KeyY: "y",
  KeyZ: "z",
  // Numbers
  Digit0: "0",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",
  // Numpad
  Numpad0: "numpad0",
  Numpad1: "numpad1",
  Numpad2: "numpad2",
  Numpad3: "numpad3",
  Numpad4: "numpad4",
  Numpad5: "numpad5",
  Numpad6: "numpad6",
  Numpad7: "numpad7",
  Numpad8: "numpad8",
  Numpad9: "numpad9",
  NumpadAdd: "numpad_add",
  NumpadSubtract: "numpad_subtract",
  NumpadMultiply: "numpad_multiply",
  NumpadDivide: "numpad_divide",
  NumpadDecimal: "numpad_decimal",
  NumpadEnter: "numpad_enter",
  // Function keys
  F1: "f1",
  F2: "f2",
  F3: "f3",
  F4: "f4",
  F5: "f5",
  F6: "f6",
  F7: "f7",
  F8: "f8",
  F9: "f9",
  F10: "f10",
  F11: "f11",
  F12: "f12",
  // Navigation
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  Home: "home",
  End: "end",
  PageUp: "pageup",
  PageDown: "pagedown",
  // Special keys
  Tab: "tab",
  Space: "space",
  Enter: "enter",
  Escape: "escape",
  Backspace: "backspace",
  Delete: "delete",
  Insert: "insert",
  // Symbols
  Minus: "-",
  Equal: "=",
  BracketLeft: "[",
  BracketRight: "]",
  Backslash: "\\",
  Semicolon: ";",
  Quote: "'",
  Backquote: "`",
  Comma: ",",
  Period: ".",
  Slash: "/",
};

/** Maps internal key identifiers to human-readable display names */
export const KEY_DISPLAY_NAMES: Record<string, string> = {
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
  pageup: "Page Up",
  pagedown: "Page Down",
  space: "Space",
  enter: "Enter",
  escape: "Esc",
  backspace: "Backspace",
  delete: "Delete",
  insert: "Insert",
  tab: "Tab",
  home: "Home",
  end: "End",
  numpad0: "Num 0",
  numpad1: "Num 1",
  numpad2: "Num 2",
  numpad3: "Num 3",
  numpad4: "Num 4",
  numpad5: "Num 5",
  numpad6: "Num 6",
  numpad7: "Num 7",
  numpad8: "Num 8",
  numpad9: "Num 9",
  numpad_add: "Num +",
  numpad_subtract: "Num -",
  numpad_multiply: "Num *",
  numpad_divide: "Num /",
  numpad_decimal: "Num .",
  numpad_enter: "Num Enter",
};

/** Set of valid key identifiers for validation */
export const VALID_KEYS = new Set(Object.values(KEY_CODE_MAP));

/** Checks if a key identifier is valid */
export function isValidKey(key: string): boolean {
  return VALID_KEYS.has(key);
}

/** Supported modifier keys */
export const MODIFIERS = ["ctrl", "shift", "alt"] as const;

/** Type for modifier keys */
export type Modifier = (typeof MODIFIERS)[number];

/** Aliases for modifier names (used when parsing defaults) */
export const MODIFIER_ALIASES: Record<string, Modifier> = {
  control: "ctrl",
};
