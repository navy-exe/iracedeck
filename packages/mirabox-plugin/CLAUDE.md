# @iracedeck/mirabox-plugin

Mirabox plugin for iRaceDeck. Registers actions from `@iracedeck/actions` with VSD Craft via `@iracedeck/deck-adapter-mirabox`.

Mirrors the structure of `@iracedeck/stream-deck-plugin` but targets Mirabox devices instead of Elgato Stream Deck.

## Key Differences from stream-deck-plugin

- Uses `VSDPlatformAdapter` instead of `ElgatoPlatformAdapter`
- Manifest uses `"Knob"` instead of `"Encoder"` for dial actions
- No `Encoder.layout` field (VSD doesn't support encoder layouts)
- Uses `ws` package for WebSocket communication (VSD bundles Node.js 20)
- `SDKVersion: 1` instead of `3`

Property Inspector assets (web components, EJS templates, partials, data, `sdpi-components.js`) come from `@iracedeck/pi-components`, the same shared package the Elgato plugin consumes. The `rollup.config.mjs` imports `piTemplatePlugin`, `templatesDir`, `partialsDir`, and `browserDir` from `@iracedeck/pi-components/build`. Generated HTML is then stripped of the `lang="en"` attribute (`stripHtmlLangPlugin`) because VSD Craft does not accept it.

## Build

```bash
pnpm build  # Rollup → com.iracedeck.sd.core.sdPlugin/bin/plugin.js
```

## Window Focus

The `window-focus.ts` module is duplicated from `stream-deck-plugin` rather than shared via `deck-core`, to avoid adding test infrastructure to `deck-core`. Extraction is planned as a follow-up.
