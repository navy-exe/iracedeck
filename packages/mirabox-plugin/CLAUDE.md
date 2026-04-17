# @iracedeck/mirabox-plugin

Mirabox plugin for iRaceDeck. Registers actions from `@iracedeck/actions` with VSD Craft via `@iracedeck/deck-adapter-mirabox`.

Mirrors the structure of `@iracedeck/stream-deck-plugin` but targets Mirabox devices instead of Elgato Stream Deck.

## Key Differences from stream-deck-plugin

- Uses `VSDPlatformAdapter` instead of `ElgatoPlatformAdapter`
- Manifest uses `"Knob"` instead of `"Encoder"` for dial actions
- No `Encoder.layout` field (VSD doesn't support encoder layouts)
- Uses `ws` package for WebSocket communication (VSD bundles Node.js 20)
- `SDKVersion: 1` instead of `3`

PI framework (web components, EJS partials, compile plugin, `sdpi-components.js`) comes from `@iracedeck/pi-components`, the same shared package the Elgato plugin consumes. Per-action PI templates, static icons, and template data come from `@iracedeck/actions` (`src/actions/<name>/*.ejs` + `icon.svg` + `key.svg`, and shared `src/actions/data/*.json`). The `rollup.config.mjs` imports `piTemplatePlugin`, `partialsDir`, and `browserDir` from `@iracedeck/pi-components/build`, computes `actionTemplatesDir` locally from the `@iracedeck/actions` path, and copies per-action `icon.svg`/`key.svg` into `com.iracedeck.sd.core.sdPlugin/imgs/actions/<name>/`. The plugin-level branding icons in `imgs/plugin/` are still copied from `stream-deck-plugin` until a dedicated branding package lands. Generated HTML is then stripped of the `lang="en"` attribute (`stripHtmlLangPlugin`) because VSD Craft does not accept it.

## Build

```bash
pnpm build  # Rollup → com.iracedeck.sd.core.sdPlugin/bin/plugin.js
```

## Window Focus

The `window-focus.ts` module is duplicated from `stream-deck-plugin` rather than shared via `deck-core`, to avoid adding test infrastructure to `deck-core`. Extraction is planned as a follow-up.
