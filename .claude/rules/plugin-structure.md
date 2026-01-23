---
# Stream Deck Plugin Structure

## Production Plugins
- `stream-deck-plugin-pit` (com.iracedeck.sd.pit) - Pit service actions
- `stream-deck-plugin-comms` (com.iracedeck.sd.comms) - Communication actions
- `stream-deck-plugin-core` (com.iracedeck.sd.core) - Core driving/interface actions (planned)

## Legacy
- `stream-deck-plugin` (com.iracedeck.sd) - Legacy plugin, will be transitioned away from. Do not add new actions here.

## Test/Reference Only
- `stream-deck-plugin-hotkeys` (com.iracedeck.sd.hotkeys) - Test plugin for keyboard functionality. Not for production actions. Reference `do-iracing-hotkey.ts` for keyboard sending patterns only.

## Creating New Plugins
Copy structure from `stream-deck-plugin-pit` as the reference implementation.
