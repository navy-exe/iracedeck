---
# Keyboard Shortcuts & Hotkey Actions

## Reference
`docs/keyboard-shortcuts.md` is the authoritative source for iRacing keyboard defaults.

## Implementation
- Define binding IDs in action settings
- Use defaults from docs/keyboard-shortcuts.md
- Use `getKeyboard().sendKeyCombination()` from stream-deck-shared
- Do NOT use `iracing-hotkeys.ts` (test plugin only)
