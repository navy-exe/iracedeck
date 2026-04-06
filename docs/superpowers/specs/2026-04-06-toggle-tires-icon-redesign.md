# Toggle Tires Icon Redesign

**Issue:** #273
**Date:** 2026-04-06

## Problem

The Tire Service "Toggle Tires" mode uses a dynamically generated icon with a plain gray rectangle as the car body and small colored rectangles as tires. It lacks the visual polish of other iRaceDeck icons.

## Solution

Replace the car body rectangle with a race car silhouette derived from `race-car-3-svgrepo-com.svg`, rotated 90 degrees counter-clockwise so the car points upward. The tire indicator shapes match the source SVG's rounded-rectangle tire shapes, filled with dynamic state-dependent colors. The "Change"/"No Change" text labels are removed in favor of a standard title from `<desc>` metadata.

## Design

### Static car SVG — `packages/icons/tire-service/toggle-tires.svg`

A proper 144x144 graphic snippet following the same conventions as `change-all-tires.svg` and `clear-tires.svg`:

- `<desc>` metadata with colors and title:
  ```json
  {
    "colors": {
      "backgroundColor": "#3a2a2a",
      "textColor": "#ffffff",
      "graphic1Color": "#888888"
    },
    "title": { "text": "TIRES" },
    "border": { "color": "#6a5a5a" }
  }
  ```
- Contains only car body elements from the source SVG: main body path (line 22-29 of source), side panel paths (lines 11-12), left polygon (line 21)
- Tire rects (lines 13-20) and connector bars (lines 30-33) are excluded — tires are rendered dynamically
- `<style>` element removed; all fills use inline `fill="{{graphic1Color}}"` attribute
- All elements wrapped in a `<g transform="...">` that rotates 90 degrees CCW and scales from 512x512 down to fit within the graphic area (approximately y=10 to y=100), centered horizontally
- Car + tires graphic fits above the title text area (title sits at ~y=118-140 by default)

### Dynamic tire elements — `generateToggleTiresIconContent()` in tire-service.ts

The 4 tire rounded-rect path shapes from the source SVG (lines 13-20), hardcoded in the function:

- Each tire's path data is from the source SVG, wrapped in the same `<g transform="...">` as the car body so they share the coordinate space and align perfectly with the wheel positions
- Fill color for each tire comes from the existing `getTireColor()` function:
  - **Black** (`#000000ff`): tire position not configured in settings
  - **Red** (`#FF4444`): configured but currently OFF (will turn ON on press)
  - **Green** (`#44FF44`): configured and currently ON (will turn OFF on press)
- Gray stroke border on each tire for visibility against the car body

### Assembly flow — `default` case in `generateTireServiceSvg()`

Replaces the current `tireServiceTemplate`-based approach with direct `ICON_BASE_TEMPLATE` usage (same pattern as `assembleIcon()` but with injected tire content):

1. Import: `import toggleTiresCarSvg from "@iracedeck/icons/tire-service/toggle-tires.svg"`
2. Resolve colors: `resolveIconColors(toggleTiresCarSvg, getGlobalColors(), settings.colorOverrides)`
3. Resolve title: `resolveTitleSettings(toggleTiresCarSvg, getGlobalTitleSettings(), settings.titleOverrides, "TIRES")`
4. Resolve border: `resolveBorderSettings(toggleTiresCarSvg, getGlobalBorderSettings(), settings.borderOverrides)`
5. Extract car content: `extractGraphicContent(toggleTiresCarSvg)` then colorize with `renderIconTemplate(rawGraphic, colors)`
6. Generate tire elements: `generateToggleTiresIconContent(settings, currentState)` — returns SVG string with 4 colored tire paths
7. Combine: `graphicContent = colorizedCar + "\n" + tireElements`
8. Generate title: `generateTitleText({ text, fontSize, bold, position, customPosition, fill })`
9. Generate border: `generateBorderParts(border)` → defs + rects
10. Fill template: `renderIconTemplate(ICON_BASE_TEMPLATE, { backgroundColor, borderContent, graphicContent, titleContent })`
11. Convert: `svgToDataUri(svg)`

### New imports in tire-service.ts

From `@iracedeck/deck-core`:
- `extractGraphicContent` (from icon-base)
- `generateTitleText` (from title-settings)
- `ICON_BASE_TEMPLATE` (from icon-base)

From icons:
- `toggleTiresCarSvg` from `@iracedeck/icons/tire-service/toggle-tires.svg`

### Removals

- The `anyTireOn`, `titleText`, `titleColor` variables in the toggle-tires case
- The `generateIconText()` call for "Change"/"No Change" text
- The `tireServiceTemplate` usage in the toggle-tires case (still used by change-compound mode)

### Key icon update — `key.svg`

Update the 72x72 static key icon to match the new car silhouette design. Same car shape scaled to half, all 4 tires shown green.

### Test updates — `tire-service.test.ts`

- Add mock for `@iracedeck/icons/tire-service/toggle-tires.svg`
- Add mocks for newly imported deck-core functions: `extractGraphicContent`, `generateTitleText`, `ICON_BASE_TEMPLATE`
- Update toggle-tires `generateTireServiceSvg` tests:
  - Remove assertions for "Change" and "No Change" text (no longer generated)
  - Keep assertions for tire colors (`#FF4444`, `#44FF44`, `#000000ff`)
  - Verify the SVG includes car content and tire elements

## Files

| File | Action |
|------|--------|
| `packages/icons/tire-service/toggle-tires.svg` | **Create** — static car silhouette graphic snippet |
| `packages/actions/src/actions/tire-service.ts` | **Modify** — import car SVG, rewrite toggle-tires assembly, update `generateToggleTiresIconContent()` |
| `packages/actions/src/actions/tire-service.test.ts` | **Modify** — mock new SVG, update assertions |
| `packages/stream-deck-plugin/com.iracedeck.sd.core.sdPlugin/imgs/actions/tire-service/key.svg` | **Modify** — match new design at 72x72 |

## SVG compatibility

All SVG features used (basic shapes, paths, transforms, inline fill attributes) are in the SVG Tiny 1.2 safe set and work on both Elgato (QT6) and Mirabox (QT5) platforms. No filters, masks, clipPath, or `<style>` elements.

## Verification

```bash
pnpm test --filter @iracedeck/actions    # Tests pass
pnpm lint:fix                             # No lint issues
pnpm format:fix                           # Formatting clean
pnpm build                                # Build succeeds (or verify via watch mode)
```

After implementation:
```bash
node scripts/generate-icon-previews.mjs   # Update preview files
node scripts/generate-icon-defaults.mjs   # Update PI defaults for new icon
```

Visual verification: inspect the generated SVG data URI output to confirm car silhouette renders correctly with colored tire indicators at wheel positions and title text "TIRES" at the bottom.
