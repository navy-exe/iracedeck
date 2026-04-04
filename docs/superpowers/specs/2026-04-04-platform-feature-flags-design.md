# Platform Feature Flags

## Context

iRaceDeck supports two platforms: Elgato Stream Deck (QT6.7+ SVG renderer) and Mirabox VSD Craft (QT5 SVG Tiny 1.2 only). Some features — like border glow which uses `feGaussianBlur` — work on Elgato but are silently ignored on Mirabox. Today there is no mechanism to gate features by platform, so Mirabox users see PI controls for features that have no visible effect, and glow SVG code ships unnecessarily in the Mirabox bundle.

This design introduces build-time platform feature flags: a JSON config per plugin package that Rollup reads at compile time to inject constants into plugin code and EJS templates. Dead code is eliminated by the bundler; unsupported PI controls are excluded from HTML output.

## Config File

Each plugin package root gets a `platform-features.json`:

### Stream Deck (`packages/stream-deck-plugin/platform-features.json`)

```json
{
  "capabilities": {
    "svgFilters": true,
    "svgMasks": true,
    "svgPatterns": true
  },
  "features": {
    "borderGlow": true
  }
}
```

### Mirabox (`packages/mirabox-plugin/platform-features.json`)

```json
{
  "capabilities": {
    "svgFilters": false,
    "svgMasks": false,
    "svgPatterns": false
  },
  "features": {
    "borderGlow": false
  }
}
```

### Flag categories

- **Capabilities** map to SVG rendering engine support (QT5 vs QT6.7+). These are the source of truth.
- **Features** are higher-level product flags that depend on one or more capabilities. When adding a new feature that requires a capability, add it to `features` and document the dependency.

## Build-time Injection

### Plugin code (Rollup)

Each plugin's `rollup.config.mjs` reads its `platform-features.json` and uses `@rollup/plugin-replace` to inject compile-time constants:

```javascript
import replace from "@rollup/plugin-replace";
import { readFileSync } from "node:fs";

const platformFeatures = JSON.parse(readFileSync("platform-features.json", "utf-8"));

// In plugins array:
replace({
  preventAssignment: true,
  values: {
    "__CAPABILITY_SVG_FILTERS__": JSON.stringify(platformFeatures.capabilities.svgFilters),
    "__CAPABILITY_SVG_MASKS__": JSON.stringify(platformFeatures.capabilities.svgMasks),
    "__CAPABILITY_SVG_PATTERNS__": JSON.stringify(platformFeatures.capabilities.svgPatterns),
    "__FEATURE_BORDER_GLOW__": JSON.stringify(platformFeatures.features.borderGlow),
  },
}),
```

Rollup's dead-code elimination + terser strips unreachable branches from the output bundle.

### Type declarations

`packages/deck-core/src/platform-features.d.ts` provides global type declarations:

```typescript
declare const __CAPABILITY_SVG_FILTERS__: boolean;
declare const __CAPABILITY_SVG_MASKS__: boolean;
declare const __CAPABILITY_SVG_PATTERNS__: boolean;
declare const __FEATURE_BORDER_GLOW__: boolean;
```

### PI templates (EJS)

The `piTemplatePlugin` accepts a `platformFeaturesPath` option and passes the parsed JSON as a `platform` variable to EJS render context:

```javascript
// In pi-template-plugin.mjs
const platformFeaturesPath = path.resolve(options.platformFeaturesPath || "platform-features.json");
const platformFeatures = existsSync(platformFeaturesPath)
  ? JSON.parse(readFileSync(platformFeaturesPath, "utf-8"))
  : { capabilities: {}, features: {} };

// In ejs.render() data:
platform: platformFeatures,
```

**Important:** The Mirabox plugin reuses PI templates from the Elgato plugin dir, but must pass its own `platformFeaturesPath` so that Mirabox-specific flags are used:

```javascript
// In mirabox-plugin/rollup.config.mjs
piTemplatePlugin({
  templatesDir: path.join(elgatoPluginPath, "src/pi"),
  outputDir: `${sdPlugin}/ui`,
  partialsDir: path.join(elgatoPluginPath, "src/pi-templates/partials"),
  manifestPath: `${sdPlugin}/manifest.json`,
  platformFeaturesPath: path.resolve("platform-features.json"), // Mirabox's own config
}),
```

EJS template usage:

```ejs
<% if (locals.platform && locals.platform.features.borderGlow !== false) { %>
  <!-- glow controls -->
<% } %>
```

## Action code usage

Actions do not check feature flags directly. The gating happens in shared `deck-core` utilities:

### `icon-base.ts` — `generateBorderParts()`

```typescript
if (!border.glowEnabled || !__FEATURE_BORDER_GLOW__) {
  return { defs: "", rects: borderRect };
}
```

### `title-settings.ts` — `resolveBorderSettings()`

Forces `glowEnabled: false` when `__FEATURE_BORDER_GLOW__` is false, so downstream code never sees glow as enabled.

## Affected files

| File | Change |
|------|--------|
| `packages/stream-deck-plugin/platform-features.json` | **New.** Feature flags for Elgato (all enabled). |
| `packages/mirabox-plugin/platform-features.json` | **New.** Feature flags for Mirabox (glow/filters disabled). |
| `packages/deck-core/src/platform-features.d.ts` | **New.** Global type declarations for `__FEATURE_*__` and `__CAPABILITY_*__` constants. |
| `packages/deck-core/src/icon-base.ts` | Gate glow SVG generation behind `__FEATURE_BORDER_GLOW__`. |
| `packages/deck-core/src/title-settings.ts` | Force `glowEnabled: false` when flag is off. |
| `packages/stream-deck-plugin/rollup.config.mjs` | Add `@rollup/plugin-replace` with constants from config. |
| `packages/mirabox-plugin/rollup.config.mjs` | Add `@rollup/plugin-replace` with constants from config. |
| `packages/stream-deck-plugin/src/build/pi-template-plugin.mjs` | Accept `platformFeaturesPath`, pass `platform` to EJS context. |
| `packages/stream-deck-plugin/src/pi-templates/partials/border-overrides.ejs` | Wrap glow controls in feature flag conditional. |
| `packages/stream-deck-plugin/src/pi-templates/partials/global-border-defaults.ejs` | Wrap global glow settings in feature flag conditional. |

No changes to individual action files — they call `generateBorderParts()` / `resolveBorderSettings()` which handle gating internally.

## Testing & Verification

### Unit tests

- `icon-base.test.ts` — Test `generateBorderParts()` with `__FEATURE_BORDER_GLOW__` true and false; verify glow SVG emitted/omitted.
- `title-settings.test.ts` — Test `resolveBorderSettings()` forces `glowEnabled: false` when flag is off.

### Setting flags in tests

Vitest `define` in `vitest.config.ts`:

```typescript
define: {
  __FEATURE_BORDER_GLOW__: true,
  __CAPABILITY_SVG_FILTERS__: true,
  __CAPABILITY_SVG_MASKS__: true,
  __CAPABILITY_SVG_PATTERNS__: true,
}
```

For false-path tests, use `vi.stubGlobal()`.

### Build verification

- `pnpm build` succeeds for both plugins.
- Mirabox output bundle contains no `feGaussianBlur` or `ird-border-glow` strings.
- Mirabox PI HTML contains no glow controls.
- Stream Deck output contains glow code and controls.

### Manual verification

- Stream Deck: enable border + glow, confirm glow renders on device.
- Mirabox: enable border, confirm no glow controls in PI, border works without glow.

## Adding new feature flags

1. Add the capability or feature to both `platform-features.json` files (enabled/disabled per platform).
2. Add the `__CAPABILITY_*__` or `__FEATURE_*__` constant to `platform-features.d.ts`.
3. Add the replacement entry to both `rollup.config.mjs` files.
4. Use the constant in `deck-core` utilities (not in individual actions).
5. Wrap relevant PI controls in `<% if (locals.platform?.features.X !== false) { %>`.
6. Add tests for both true/false paths.
