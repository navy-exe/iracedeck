# Keyboard/Hotkey System Implementation Plan

Add keyboard hotkey support to iRaceDeck using the `keysender` npm package, allowing Stream Deck buttons to send keyboard shortcuts to iRacing.

**Key Requirement**: All hotkeys must be user-configurable via the Stream Deck Property Inspector UI, with iRacing defaults pre-populated.

---

## Step 1: Keyboard Types and iRacing Presets

**Scope**: Create type definitions and iRacing default hotkey presets in stream-deck-shared.

### Files to Create

**`packages/stream-deck-shared/src/keyboard-types.ts`**

```typescript
export type KeyboardModifier = "ctrl" | "shift" | "alt";

export type KeyboardKey =
  // Letters a-z
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j"
  | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t"
  | "u" | "v" | "w" | "x" | "y" | "z"
  // Numbers 0-9
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
  // Function keys
  | "f1" | "f2" | "f3" | "f4" | "f5" | "f6" | "f7" | "f8" | "f9" | "f10" | "f11" | "f12"
  // Special keys
  | "tab" | "space" | "enter" | "escape" | "backspace" | "delete"
  | "up" | "down" | "left" | "right"
  | "home" | "end" | "pageup" | "pagedown"
  | "=" | "-" | "[" | "]" | "/" | "\\" | ";" | "'" | "," | "." | "`";

export interface KeyCombination {
  key: KeyboardKey;
  modifiers?: KeyboardModifier[];
}

export interface IRacingHotkeyPreset {
  id: string;
  name: string;
  description: string;
  defaultKey: KeyCombination;
  category: "blackbox" | "controls" | "camera" | "misc";
}

/** All valid keyboard keys as array (for Property Inspector dropdowns) */
export const KEYBOARD_KEYS: KeyboardKey[] = [
  "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
  "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12",
  "tab", "space", "enter", "escape", "backspace", "delete",
  "up", "down", "left", "right", "home", "end", "pageup", "pagedown",
  "=", "-", "[", "]", "/", "\\", ";", "'", ",", ".", "`"
];
```

**`packages/stream-deck-shared/src/iracing-hotkeys.ts`**

Define iRacing default keyboard shortcuts (from https://www.iracing.com/keyboard-shortcuts/):

| ID | Name | Default Key | Category |
|----|------|-------------|----------|
| blackbox-timing | Lap Timing | F1 | blackbox |
| blackbox-standings | Standings | F2 | blackbox |
| blackbox-relative | Relative | F3 | blackbox |
| blackbox-fuel | Fuel | F4 | blackbox |
| blackbox-tires | Tire Pressure | F5 | blackbox |
| blackbox-tire-info | Tire Info | F6 | blackbox |
| blackbox-pit-adjustments | Pit Adjustments | F7 | blackbox |
| blackbox-car-adjustments | Car Adjustments | F8 | blackbox |
| control-starter | Starter | S | controls |
| control-ignition | Ignition | I | controls |
| control-pit-limiter | Pit Limiter | A | controls |
| control-tow | Tow/Reset | Shift+R | controls |
| control-bias-increase | Brake Bias + | = | controls |
| control-bias-decrease | Brake Bias - | - | controls |
| camera-look-left | Look Left | Z | camera |
| camera-look-right | Look Right | X | camera |
| misc-chat | Text Chat | T | misc |
| misc-delta | Splits/Delta | Tab | misc |

Export functions: `getHotkeyPreset(id)`, `getHotkeysByCategory(category)`, `IRACING_HOTKEY_PRESETS`.

**`packages/stream-deck-shared/src/iracing-hotkeys.test.ts`**

Test that:
- All presets have unique IDs
- `getHotkeyPreset()` returns correct preset
- `getHotkeysByCategory()` filters correctly

### Files to Modify

**`packages/stream-deck-shared/src/index.ts`** - Add exports:
```typescript
export * from "./keyboard-types.js";
export * from "./iracing-hotkeys.js";
```

### Verification
- `pnpm build` in stream-deck-shared succeeds
- `pnpm test` passes for iracing-hotkeys tests

---

## Step 2: Keyboard Service

**Scope**: Create the keyboard service singleton that wraps keysender.

**Prerequisite**: Step 1 complete.

### Files to Create

**`packages/stream-deck-shared/src/keyboard-service.ts`**

Follow the pattern from `sdk-singleton.ts`:

```typescript
import type { ILogger } from "@iracedeck/logger";
import type { KeyboardKey, KeyCombination } from "./keyboard-types.js";

export interface IKeyboardService {
  sendKey(key: KeyboardKey): Promise<boolean>;
  sendKeyCombination(combination: KeyCombination): Promise<boolean>;
}

// Singleton instance
let keyboardService: KeyboardService | null = null;

export async function initializeKeyboard(logger?: ILogger): Promise<IKeyboardService>;
export function getKeyboard(): IKeyboardService;
export function isKeyboardInitialized(): boolean;
export function _resetKeyboard(): void; // For testing
```

Implementation notes:
- Use dynamic import for keysender to avoid loading during tests
- Use `Hardware` class (not `Virtual`) for game compatibility
- Hardware class without arguments targets desktop-wide (active window receives input)
- Wrap calls in try/catch, return boolean success

**`packages/stream-deck-shared/src/keyboard-service.test.ts`**

Mock keysender module with `vi.mock()`. Test:
- `isKeyboardInitialized()` returns false before init
- `initializeKeyboard()` returns service
- `initializeKeyboard()` throws if called twice
- `getKeyboard()` throws if not initialized
- `sendKey()` and `sendKeyCombination()` work with mock

### Files to Modify

**`packages/stream-deck-shared/package.json`** - Add dependency:
```json
"dependencies": {
  "keysender": "^2.3.1"
}
```

**`packages/stream-deck-shared/src/index.ts`** - Add exports:
```typescript
export {
  initializeKeyboard,
  getKeyboard,
  isKeyboardInitialized,
  _resetKeyboard,
  type IKeyboardService,
} from "./keyboard-service.js";
```

### Verification
- `pnpm install` succeeds (keysender builds with node-gyp)
- `pnpm build` succeeds
- `pnpm test` passes

---

## Step 3: Plugin Package Scaffolding

**Scope**: Create the new plugin package structure (no actions yet).

**Prerequisite**: Step 2 complete.

### Reference Files
Copy structure from `packages/stream-deck-plugin-comms/`:
- `package.json` - update name to `@iracedeck/stream-deck-plugin-hotkeys`
- `tsconfig.json` - same pattern
- `rollup.config.mjs` - same pattern, ensure `keysender` is in externals
- `src/svg.d.ts` - same

### Files to Create

**`packages/stream-deck-plugin-hotkeys/package.json`**
```json
{
  "name": "@iracedeck/stream-deck-plugin-hotkeys",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "rollup -c",
    "watch": "rollup -c -w",
    "postbuild": "cd com.iracedeck.sd.hotkeys.sdPlugin/bin && npm install --install-links"
  },
  "dependencies": {
    "@elgato/streamdeck": "^2.0.0",
    "@iracedeck/stream-deck-shared": "workspace:*",
    "zod": "^3.24.0"
  }
}
```

**`packages/stream-deck-plugin-hotkeys/rollup.config.mjs`**

Same as comms plugin, with externals including `keysender`.

**`packages/stream-deck-plugin-hotkeys/src/plugin.ts`**

Entry point that:
1. Calls `initializeSDK()`
2. Calls `initializeKeyboard()`
3. Registers actions (empty for now)
4. Calls `streamDeck.connect()`

**`packages/stream-deck-plugin-hotkeys/com.iracedeck.sd.hotkeys.sdPlugin/manifest.json`**

Reference `packages/stream-deck-plugin-comms/com.iracedeck.sd.comms.sdPlugin/manifest.json`:
- UUID: `com.iracedeck.sd.hotkeys`
- Name: "iRaceDeck Hotkeys"
- Actions: empty array for now
- NodeJS configuration same as comms

**Folder structure**:
```
com.iracedeck.sd.hotkeys.sdPlugin/
├── manifest.json
├── bin/
│   └── .gitkeep
├── imgs/
│   ├── plugin-icon.png (copy from another plugin)
│   └── plugin-icon@2x.png
└── ui/
    └── .gitkeep
```

### Verification
- `pnpm build` in the new package succeeds
- No TypeScript errors

---

## Step 4: Generic Hotkey Action

**Scope**: Create the DoHotkey action with Property Inspector UI.

**Prerequisite**: Step 3 complete.

### Key Requirement: User-Configurable Keys

The Property Inspector must allow users to:
1. Select a key from dropdown (all valid keys)
2. Toggle Ctrl modifier (checkbox)
3. Toggle Shift modifier (checkbox)
4. Toggle Alt modifier (checkbox)
5. Set custom label (optional text input)

### Files to Create

**`packages/stream-deck-plugin-hotkeys/icons/do-hotkey.svg`**

SVG template following project conventions:
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" data-no-na="true">
  <g filter="url(#activity-state)">
    <!-- Keyboard icon graphic -->
    {{textElement}}
  </g>
</svg>
```

**`packages/stream-deck-plugin-hotkeys/src/actions/do-hotkey.ts`**

```typescript
import { z } from "zod";

const HotkeySettings = z.object({
  key: z.string().default("f1"),      // KeyboardKey
  ctrl: z.coerce.boolean().default(false),
  shift: z.coerce.boolean().default(false),
  alt: z.coerce.boolean().default(false),
  label: z.string().default(""),      // Custom display label
});

@action({ UUID: "com.iracedeck.sd.hotkeys.do-hotkey" })
export class DoHotkey extends ConnectionStateAwareAction<HotkeySettings> {
  // onWillAppear: parse settings, render icon with key label
  // onKeyDown: build KeyCombination from settings, call getKeyboard().sendKeyCombination()
  // onDidReceiveSettings: update icon when settings change
}
```

**`packages/stream-deck-plugin-hotkeys/com.iracedeck.sd.hotkeys.sdPlugin/ui/do-hotkey.html`**

Property Inspector HTML with:
- `<select>` dropdown for key (populated from KEYBOARD_KEYS)
- Three checkboxes for Ctrl, Shift, Alt
- Text input for custom label
- Use SDPIComponents or plain HTML matching other plugins' UI

### Files to Modify

**`packages/stream-deck-plugin-hotkeys/com.iracedeck.sd.hotkeys.sdPlugin/manifest.json`**

Add action:
```json
{
  "Actions": [{
    "UUID": "com.iracedeck.sd.hotkeys.do-hotkey",
    "Name": "Hotkey",
    "Tooltip": "Send a keyboard hotkey",
    "Icon": "imgs/actions/do-hotkey",
    "PropertyInspectorPath": "ui/do-hotkey.html"
  }]
}
```

**`packages/stream-deck-plugin-hotkeys/src/plugin.ts`**

Import and the action will auto-register via decorator.

### Verification
- Build succeeds
- Install plugin in Stream Deck
- Add DoHotkey action to a button
- Open Property Inspector - verify dropdown shows all keys, checkboxes work
- Configure to send "F3", press button with iRacing open
- Verify Relative black box opens

---

## Step 5: iRacing Preset Hotkey Action

**Scope**: Create DoIRacingHotkey action with preset selection and optional key override.

**Prerequisite**: Step 4 complete.

### Key Requirement: Preset with Override

Property Inspector must allow users to:
1. Select preset from dropdown (grouped by category)
2. See the default key binding for selected preset
3. Optionally override with custom key/modifiers

### Files to Create

**`packages/stream-deck-plugin-hotkeys/icons/do-iracing-hotkey.svg`**

SVG template with iRacing-style icon.

**`packages/stream-deck-plugin-hotkeys/src/actions/do-iracing-hotkey.ts`**

```typescript
const IRacingHotkeySettings = z.object({
  presetId: z.string().default("blackbox-relative"),
  // Override fields (if empty, use preset defaults)
  overrideKey: z.string().optional(),
  overrideCtrl: z.coerce.boolean().optional(),
  overrideShift: z.coerce.boolean().optional(),
  overrideAlt: z.coerce.boolean().optional(),
});

@action({ UUID: "com.iracedeck.sd.hotkeys.do-iracing-hotkey" })
export class DoIRacingHotkey extends ConnectionStateAwareAction<IRacingHotkeySettings> {
  // onWillAppear: get preset, render icon with preset name
  // onKeyDown: get preset, apply overrides if set, send key combination
  // onDidReceiveSettings: update icon
}
```

**`packages/stream-deck-plugin-hotkeys/com.iracedeck.sd.hotkeys.sdPlugin/ui/do-iracing-hotkey.html`**

Property Inspector with:
- Preset dropdown (`<optgroup>` by category)
- "Default binding" display showing preset's key
- "Override" section (collapsed by default) with key dropdown and modifier checkboxes

### Files to Modify

**`packages/stream-deck-plugin-hotkeys/com.iracedeck.sd.hotkeys.sdPlugin/manifest.json`**

Add action:
```json
{
  "UUID": "com.iracedeck.sd.hotkeys.do-iracing-hotkey",
  "Name": "iRacing Hotkey",
  "Tooltip": "Send an iRacing keyboard shortcut",
  "Icon": "imgs/actions/do-iracing-hotkey",
  "PropertyInspectorPath": "ui/do-iracing-hotkey.html"
}
```

### Verification
- Build succeeds
- Add DoIRacingHotkey action
- Select "Fuel" preset - verify it shows "F4" as default
- Press button - verify Fuel black box opens in iRacing
- Override to different key - verify override works

---

## Step 6: Final Integration and Documentation

**Scope**: Ensure everything builds together, update docs.

**Prerequisite**: Step 5 complete.

### Tasks

1. Run `pnpm install` from root
2. Run `pnpm build` - all packages should build
3. Run `pnpm lint:fix && pnpm format:fix`
4. Run `pnpm test` - all tests should pass
5. Manual end-to-end test with iRacing

### Files to Modify (if needed)

**`turbo.json`** - Add hotkeys package if not auto-discovered.

**`CLAUDE.md`** - Add section documenting keyboard service usage (optional, only if requested).

### Verification Checklist
- [ ] `pnpm install` succeeds
- [ ] `pnpm build` succeeds for all packages
- [ ] `pnpm test` passes
- [ ] `pnpm lint:fix` reports no errors
- [ ] Plugin appears in Stream Deck
- [ ] DoHotkey action works with custom key configuration
- [ ] DoIRacingHotkey action works with presets
- [ ] Key overrides work in DoIRacingHotkey
- [ ] Icons display correctly
- [ ] Keys are sent to iRacing when it's the active window
