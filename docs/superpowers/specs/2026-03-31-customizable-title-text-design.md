# Customizable Button Title Text

**Issue:** #238
**Date:** 2026-03-31

## Context

Users want to control the font size, position, and content of button title text (the label at the top of Stream Deck keys like "TC 1", "FFB", "FUEL PRESS"). Currently these are hardcoded at 18px in SVG templates with no customization. The community also wants the ability to hide icon graphics entirely for clean text-only buttons.

This feature introduces a title settings system that mirrors the existing color overrides architecture: global defaults with per-action overrides.

## Scope

### In scope

- **28 static-label actions** — full title settings (all actions using mainLabel/subLabel)
- **Telemetry Display & Session Info** — title settings apply to their `titleLabel` only; value display stays unchanged
- **All mode icons** — title settings apply when mode changes and a new icon is generated
- **Icon architecture refactor** — split self-contained SVGs into base template + graphic snippets
- **subLabel consolidation** — merge mainLabel/subLabel into a single multi-line titleText

### Out of scope

- Dynamic custom-rendered actions (fuel-service toggle-fuel-fill, tire-service change-compound, chat send-message/macro)
- Status bar
- Inline rich text formatting (tracked in #239)
- Per-line bold/weight styling

## Settings Schema

### TitleOverridesSchema (per-action)

Added to `CommonSettings` in `deck-core/src/common-settings.ts`, alongside `ColorOverridesSchema`:

```typescript
const TitleOverridesSchema = z.object({
  showTitle: z.union([z.boolean(), z.string()])
    .transform(val => val === true || val === "true")
    .optional(),
  showGraphics: z.union([z.boolean(), z.string()])
    .transform(val => val === true || val === "true")
    .optional(),
  titleText: z.string().optional(),
  bold: z.union([z.boolean(), z.string()])
    .transform(val => val === true || val === "true")
    .optional(),
  fontSize: z.coerce.number().min(5).max(50).optional(),
  position: z.enum(["top", "middle", "bottom", "custom"]).optional(),
  customPosition: z.coerce.number().min(-50).max(50).optional(),
}).optional();

const CommonSettings = z.object({
  flagsOverlay: /* existing */,
  colorOverrides: ColorOverridesSchema,
  titleOverrides: TitleOverridesSchema,
});
```

All fields are optional — unset fields fall through to global or defaults.

### Global title settings

Flat keys in global settings (matching the color pattern):

- `titleShowTitle` (boolean, default: true)
- `titleShowGraphics` (boolean, default: true)
- `titleBold` (boolean, default: true)
- `titleFontSize` (number, default: 18)
- `titlePosition` (string: "top" | "middle" | "bottom" | "custom", default: "bottom")
- `titleCustomPosition` (number, default: 0)

No global `titleText` — each action has its own default text.

Accessed via `getGlobalTitleSettings()` in `global-settings.ts`.

## Resolution Chain

`resolveTitleSettings()` in `icon-template.ts`:

```typescript
interface ResolvedTitleSettings {
  showTitle: boolean;
  showGraphics: boolean;
  titleText: string;
  bold: boolean;
  fontSize: number;
  position: "top" | "middle" | "bottom" | "custom";
  customPosition: number;
}

function resolveTitleSettings(
  graphicSvg: string,
  globalTitleSettings: GlobalTitleSettings,
  actionOverrides?: TitleOverrides,
  actionDefaultText?: string,
): ResolvedTitleSettings
```

Per field, resolution order:

1. Per-action override (`settings.titleOverrides.*`)
2. Global default (`getGlobalTitleSettings().*`)
3. Hardcoded default (true, true, 18, "bottom", 0, true)

Special case for `titleText`:

1. Per-action override (`titleOverrides.titleText`)
2. Code-provided default (`actionDefaultText` parameter)
3. `<desc>` metadata default (`title.text`)

Sentinel values: `undefined` = "use next level". Empty string `""` for titleText = "use next level".

## Label Consolidation

### mainLabel + subLabel → titleText

Current two-label system is replaced by a single multi-line titleText:

- Default text = `subLabel\nmainLabel` (preserving current visual order: context line on top, action word on bottom)
- Example: mainLabel="NEXT", subLabel="CAMERA" → titleText="CAMERA\nNEXT"
- Users can override with any custom text via the Title Text textarea
- Bold toggle applies uniformly to all lines (no per-line styling)

### Inverted layout actions

Actions that currently use "inverted" label layout (splits-delta-cycle, some camera-controls modes) already have their visual order handled by the subLabel/mainLabel content — the consolidation preserves this since we use `subLabel\nmainLabel` order.

## Icon Architecture Refactor

### Before: self-contained icon SVGs

Each icon file contains the full SVG: background rect, graphic content, and label text elements with hardcoded font sizes.

### After: base template + graphic snippets

**Base template** (string constant in `icon-template.ts`):

```xml
<svg viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg">
  <rect width="144" height="144" fill="{{backgroundColor}}"/>
  {{graphicContent}}
  {{titleContent}}
</svg>
```

**Graphic snippets** (in `packages/icons/`): contain only the artwork, no background rect or label text. The `<desc>` metadata is retained for color defaults and gains a `title` field:

```xml
<svg viewBox="0 0 144 144" xmlns="http://www.w3.org/2000/svg">
  <desc>{"colors":{"backgroundColor":"#2a3444","textColor":"#ffffff"},
    "title":{"text":"TOGGLE\nLAP TIMING"}}</desc>
  <!-- title.text uses visual order: context line first, action word second -->
  <!-- (was subLabel="TOGGLE", mainLabel="LAP TIMING") -->
  <!-- Only graphic content -->
  <rect x="22" y="12" width="100" height="80" rx="6" .../>
</svg>
```

**Rendering pipeline:**

1. **Load graphic** — read SVG snippet, parse `<desc>` for color defaults and default title
2. **Resolve settings** — `resolveIconColors()` + `resolveTitleSettings()` (per-action → global → default)
3. **Generate parts** — `graphicContent` = showGraphics ? colorize(graphic) : "" / `titleContent` = showTitle ? `generateTitleText(...)` : ""
4. **Assemble** — fill base template with backgroundColor, graphicContent, titleContent → `svgToDataUri()`

### assembleIcon()

New function consolidating the rendering pipeline:

```typescript
function assembleIcon(options: {
  graphicSvg: string;
  colors: ResolvedColors;
  title: ResolvedTitleSettings;
}): string
```

Returns a data URI ready for `setKeyImage()`.

## Title Text Generation

### generateTitleText()

New function in `icon-template.ts`:

```typescript
function generateTitleText(options: {
  text: string;
  fontSize: number;
  bold: boolean;
  position: "top" | "middle" | "bottom" | "custom";
  customPosition: number;
  fill: string;
}): string
```

Returns SVG `<text>` elements.

### Positioning math (144x144 canvas)

- **Top**: first line at `y = fontSize + 4`, subsequent lines below with `lineHeight = fontSize * 1.2`
- **Middle**: text block centered around `y = 72`
- **Bottom**: last line at `y = 140`, previous lines stacked above
- **Custom**: text block centered around `y = 72 + customPosition` (range -50 to +50)

All positions handle multi-line text by calculating the total block height and distributing lines accordingly.

## Property Inspector

### Per-action: Title Overrides accordion

New EJS partial `title-overrides.ejs` (mirrors `color-overrides.ejs`):

**Visibility section:**
- Show Title — `sdpi-checkbox`, setting `titleOverrides.showTitle`
- Show Graphics — `sdpi-checkbox`, setting `titleOverrides.showGraphics`

**Text section:**
- Title Text — 3-line `<textarea>`, setting `titleOverrides.titleText`, placeholder shows action default
- Bold — `sdpi-checkbox`, setting `titleOverrides.bold`
- Font Size — `sdpi-range` (5–50), setting `titleOverrides.fontSize`

**Position section:**
- Position — `sdpi-select` (top/middle/bottom/custom), setting `titleOverrides.position`
- Custom Position — `sdpi-range` (-50 to 50, default 0), setting `titleOverrides.customPosition`, only visible when Position = "custom"

**Presets:**
- **Default** — resets all title overrides to action defaults
- **Global** — clears all overrides (use global settings)

### Global Settings: Title Defaults section

Added to `global-settings.ejs` below the existing "Icon Colors" section:

- Show Title — `sdpi-checkbox`, setting `titleShowTitle`, `global`
- Show Graphics — `sdpi-checkbox`, setting `titleShowGraphics`, `global`
- Bold — `sdpi-checkbox`, setting `titleBold`, `global`
- Font Size — `sdpi-range` (5–50), setting `titleFontSize`, `global`
- Position — `sdpi-select` (top/middle/bottom/custom), setting `titlePosition`, `global`
- Custom Position — `sdpi-range` (-50 to 50), setting `titleCustomPosition`, `global`, only visible when Position = "custom"

No Title Text at global level — each action has its own default.

## Action Integration Pattern

### Static-label actions (28 actions)

```typescript
// In generateXxxSvg() or updateDisplay():
const colors = resolveIconColors(graphicSvg, getGlobalColors(), settings.colorOverrides);
const title = resolveTitleSettings(
  graphicSvg,
  getGlobalTitleSettings(),
  settings.titleOverrides,
  "CAMERA\nNEXT",  // code-provided default (overrides <desc> when action changes labels by mode)
);
const svgDataUri = assembleIcon({ graphicSvg, colors, title });
```

### Telemetry Display & Session Info

Title settings apply to the `titleLabel` only. The value display rendering stays unchanged. These actions use `generateTitleText()` for the title and keep their existing value rendering logic.

## Testing

- Unit tests for `resolveTitleSettings()` — all resolution chain paths
- Unit tests for `generateTitleText()` — all positions, multiline, font sizes, bold/normal
- Unit tests for `assembleIcon()` — graphics on/off, title on/off, color integration
- Update existing action tests that reference mainLabel/subLabel
- Vitest icon preview freshness test updated for new graphic snippet format

## Verification

1. `pnpm build` succeeds without TypeScript errors
2. `pnpm test` passes
3. Manual testing on Stream Deck:
   - Verify default icons look identical to before (no visual regression)
   - Change global title font size → all actions update
   - Override per-action title text → only that action changes
   - Toggle Show Graphics off → text-only button on background
   - Toggle Show Title off → icon without text
   - Test all 4 positions with multi-line text
   - Test Custom Position slider
   - Verify mode changes re-render with title settings applied
4. Test on both Elgato and Mirabox plugins

## Affected Packages

- `@iracedeck/deck-core` — TitleOverridesSchema, resolveTitleSettings(), generateTitleText(), assembleIcon(), getGlobalTitleSettings(), GlobalSettingsSchema update
- `@iracedeck/actions` — all 28 static-label actions + telemetry-display + session-info
- `@iracedeck/icons` — all SVG files refactored to graphic snippets
- `@iracedeck/stream-deck-plugin` — PI templates (title-overrides.ejs, global-settings.ejs), manifest
- `@iracedeck/mirabox-plugin` — PI templates, manifest
- `@iracedeck/website` — feature descriptions
- `docs/` — action documentation
- `.claude/rules/` — icons.md, key-icon-types.md, stream-deck-actions.md, pi-templates.md, global-settings.md
- Skills — iracedeck-actions listings
- Tests — new + updated
