# Toggle Tires Icon Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the plain-rectangle car icon in the Tire Service toggle-tires mode with a race car silhouette derived from `race-car-3-svgrepo-com.svg`, using proper `<desc>` metadata and the `ICON_BASE_TEMPLATE` assembly pattern.

**Architecture:** The static car silhouette lives in `packages/icons/tire-service/toggle-tires.svg` as a standard graphic snippet with `<desc>` metadata. At runtime, `tire-service.ts` extracts and colorizes the car artwork, generates dynamic tire path elements with state-dependent colors, and assembles the final icon using `ICON_BASE_TEMPLATE` — the same pattern as `assembleIcon()` but with injected tire content between colorization and template filling.

**Tech Stack:** SVG, TypeScript, Vitest

**SVG Transform:** `translate(72, 53) rotate(-90) scale(0.176) translate(-256, -256)` — rotates 90° CCW, scales 512→~90px, centers at (72, 53) in the 144x144 canvas. Car nose at top (~y=10), rear at bottom (~y=98), tires at four corners (~x=50/94, ~y=31/81). Title "TIRES" fits below at y≈118-140.

**Tire-to-setting mapping after rotation** (original side-view positions → rotated top-down positions):
- **LF** (left-front) → source tire at x≈336-425, y≈109-158 (was top-right in side view → top-left after CCW rotation)
- **RF** (right-front) → source tire at x≈336-425, y≈354-402 (was bottom-right → top-right)
- **LR** (left-rear) → source tire at x≈62-134, y≈103-160 (was top-left → bottom-left)
- **RR** (right-rear) → source tire at x≈62-134, y≈352-408 (was bottom-left → bottom-right)

---

### Task 1: Create branch and car SVG file

**Files:**
- Create: `packages/icons/tire-service/toggle-tires.svg`

- [ ] **Step 1: Create the feature branch**

```bash
git checkout -b feat/273-toggle-tires-icon-redesign
```

- [ ] **Step 2: Create the car silhouette SVG**

Create `packages/icons/tire-service/toggle-tires.svg` with the car body paths from the source SVG (main body, side panels, left polygon), tires and connectors removed, wrapped in a rotation+scale transform, with `<desc>` metadata:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
  <desc>{"colors":{"backgroundColor":"#3a2a2a","textColor":"#ffffff","graphic1Color":"#888888"},"locked":["graphic1Color"],"title":{"text":"TIRES"},"border":{"color":"#6a5a5a"}}</desc>

  <g transform="translate(72, 53) rotate(-90) scale(0.176) translate(-256, -256)">
    <!-- Right top panel -->
    <path fill="{{graphic1Color}}" d="M448.118,351.402h47.018v-75.629c-11.104,2.554-29.453,6.744-47.008,10.593L448.118,351.402z"/>
    <!-- Right bottom panel -->
    <path fill="{{graphic1Color}}" d="M495.136,160.599h-47.008v65.035c17.555,3.85,35.904,8.03,47.008,10.584V160.599z"/>
    <!-- Left side panel -->
    <polygon fill="{{graphic1Color}}" points="57.147,175.343 0.009,175.343 0,336.647 57.147,336.647"/>
    <!-- Main body -->
    <path fill="{{graphic1Color}}" d="M503.763,245.781c0,0-66.446-15.465-92.844-20.383c-26.399-4.899-91.51-16.42-91.51-16.42s-3.008-11.18-4.606-20.27c-2.771-15.672-16.59-31.335-51.624-31.335c-35.024,0-47.018,0-66.369,0c-50.697,0-42.374,48.852-73.067,48.852c-30.692,0-54.215,0-54.215,0v99.549c0,0,23.523,0,54.215,0c30.693,0,22.37,48.863,73.067,48.863c19.351,0,31.335,0,66.369,0s48.853-15.673,51.624-31.346c1.598-9.08,4.606-20.278,4.606-20.278s65.111-11.511,91.51-16.42c26.398-4.91,92.844-20.373,92.844-20.373c4.814-1.06,8.237-5.307,8.237-10.215C512,251.087,508.576,246.83,503.763,245.781z M295.895,280.275c-22.983,0-28.896-10.867-28.896-24.27c0-13.412,5.912-24.28,28.896-24.28c22.984,0,41.617,10.868,41.617,24.28C337.512,269.408,318.88,280.275,295.895,280.275z"/>
  </g>

</svg>
```

- [ ] **Step 3: Verify the SVG file is valid**

Open the file in a browser or SVG viewer to confirm the car silhouette renders correctly — rotated with nose pointing up, centered in the 144x144 canvas.

- [ ] **Step 4: Commit**

```bash
git add packages/icons/tire-service/toggle-tires.svg
git commit -m "feat(icons): add toggle-tires car silhouette graphic snippet"
```

---

### Task 2: Update test mocks and assertions for toggle-tires mode

**Files:**
- Modify: `packages/actions/src/actions/tire-service.test.ts`

- [ ] **Step 1: Add SVG mock for the new icon**

Add this mock after the existing icon mocks (after line 44):

```typescript
vi.mock("@iracedeck/icons/tire-service/toggle-tires.svg", () => ({
  default: '<svg><desc>{"colors":{"backgroundColor":"#3a2a2a","textColor":"#ffffff","graphic1Color":"#888888"},"title":{"text":"TIRES"}}</desc><g>toggle-tires-car</g></svg>',
}));
```

- [ ] **Step 2: Add mocks for newly used deck-core exports**

In the `vi.mock("@iracedeck/deck-core", ...)` block, add these entries alongside the existing mocks:

```typescript
  extractGraphicContent: vi.fn((svg: string) => svg.replace(/<\/?svg[^>]*>/g, "").replace(/<desc>[\s\S]*?<\/desc>/, "").trim()),
  generateTitleText: vi.fn((opts: { text: string; fill: string }) =>
    opts.text ? `<text fill="${opts.fill}">${opts.text}</text>` : ""),
  ICON_BASE_TEMPLATE: "<svg>{{backgroundColor}}|{{borderContent}}|{{graphicContent}}|{{titleContent}}</svg>",
```

- [ ] **Step 3: Update renderIconTemplate mock to handle new data keys**

Replace the existing `renderIconTemplate` mock with one that handles both the old pattern (iconContent/textElement for change-compound) and the new pattern (graphicContent/titleContent for toggle-tires):

```typescript
  renderIconTemplate: vi.fn((_template: string, data: Record<string, string>) => {
    const parts = [data.iconContent, data.textElement, data.graphicContent, data.titleContent, data.mainLabel, data.subLabel].filter(Boolean).join("|");
    return `<svg>${parts}</svg>`;
  }),
```

- [ ] **Step 4: Update toggle-tires test assertions**

Replace the toggle-tires tests in the `describe("toggle-tires mode", ...)` block with these updated assertions that no longer check for "Change"/"No Change" text:

```typescript
      it("should generate a valid data URI", () => {
        const result = generateTireServiceSvg(
          { action: "toggle-tires", lf: true, rf: true, lr: true, rr: true },
          noTires,
        );
        expect(result).toContain("data:image/svg+xml");
      });

      it("should show red for configured but inactive tires", () => {
        const result = generateTireServiceSvg(
          { action: "toggle-tires", lf: true, rf: true, lr: true, rr: true },
          noTires,
        );
        const decoded = decodeURIComponent(result);
        expect(decoded).toContain("#FF4444");
      });

      it("should show green for configured and active tires", () => {
        const result = generateTireServiceSvg(
          { action: "toggle-tires", lf: true, rf: true, lr: true, rr: true },
          allTires,
        );
        const decoded = decodeURIComponent(result);
        expect(decoded).toContain("#44FF44");
      });

      it("should show black for unconfigured tires", () => {
        const result = generateTireServiceSvg(
          { action: "toggle-tires", lf: false, rf: false, lr: false, rr: false },
          allTires,
        );
        const decoded = decodeURIComponent(result);
        expect(decoded).toContain("#000000ff");
      });

      it("should include car content in output", () => {
        const result = generateTireServiceSvg(
          { action: "toggle-tires", lf: true, rf: true, lr: true, rr: true },
          noTires,
        );
        const decoded = decodeURIComponent(result);
        expect(decoded).toContain("toggle-tires-car");
      });

      it("should include title text", () => {
        const result = generateTireServiceSvg(
          { action: "toggle-tires", lf: true, rf: true, lr: true, rr: true },
          noTires,
        );
        const decoded = decodeURIComponent(result);
        expect(decoded).toContain("TIRES");
      });
```

- [ ] **Step 5: Run tests to verify they fail**

Run: `pnpm test --filter @iracedeck/actions -- --run`
Expected: toggle-tires tests FAIL because the implementation hasn't been updated yet. Other tests should still pass.

- [ ] **Step 6: Commit failing tests**

```bash
git add packages/actions/src/actions/tire-service.test.ts
git commit -m "test(actions): update toggle-tires tests for car silhouette redesign"
```

---

### Task 3: Update tire-service.ts — imports and generateToggleTiresIconContent

**Files:**
- Modify: `packages/actions/src/actions/tire-service.ts`

- [ ] **Step 1: Add new imports**

Add `extractGraphicContent`, `generateTitleText`, and `ICON_BASE_TEMPLATE` to the deck-core import block. Add the new icon import. The imports section (lines 1-27) should become:

```typescript
import {
  assembleIcon,
  CommonSettings,
  ConnectionStateAwareAction,
  extractGraphicContent,
  generateBorderParts,
  generateIconText,
  generateTitleText,
  getCommands,
  getGlobalBorderSettings,
  getGlobalColors,
  getGlobalTitleSettings,
  getSDK,
  ICON_BASE_TEMPLATE,
  type IDeckDialDownEvent,
  type IDeckDidReceiveSettingsEvent,
  type IDeckKeyDownEvent,
  type IDeckWillAppearEvent,
  type IDeckWillDisappearEvent,
  renderIconTemplate,
  resolveBorderSettings,
  resolveIconColors,
  resolveTitleSettings,
  svgToDataUri,
} from "@iracedeck/deck-core";
import changeAllTiresIconSvg from "@iracedeck/icons/tire-service/change-all-tires.svg";
import clearTiresIconSvg from "@iracedeck/icons/tire-service/clear-tires.svg";
import toggleTiresCarSvg from "@iracedeck/icons/tire-service/toggle-tires.svg";
import { hasFlag, PitSvFlags, TelemetryData } from "@iracedeck/iracing-sdk";
import z from "zod";

import tireServiceTemplate from "../../icons/tire-service.svg";
```

- [ ] **Step 2: Add the CAR_TRANSFORM constant and rewrite generateToggleTiresIconContent**

Add a constant for the shared transform string (used by both the static car SVG and the dynamic tire elements), then rewrite the function to return only the 4 dynamic tire paths. Replace lines 193-213:

```typescript
/**
 * Shared transform for the 512→144 car coordinate space.
 * Rotates 90° CCW, scales from 512 to ~90px, centers at (72, 53).
 */
const CAR_TRANSFORM = "translate(72, 53) rotate(-90) scale(0.176) translate(-256, -256)";

/**
 * @internal Exported for testing
 *
 * Generates dynamic tire indicator SVG paths for the toggle-tires action.
 * Uses the same coordinate space and transform as the static car silhouette.
 */
export function generateToggleTiresIconContent(
  settings: TireServiceSettings,
  currentState: { lf: boolean; rf: boolean; lr: boolean; rr: boolean },
): string {
  const lfColor = getTireColor(settings.lf ?? false, currentState.lf);
  const rfColor = getTireColor(settings.rf ?? false, currentState.rf);
  const lrColor = getTireColor(settings.lr ?? false, currentState.lr);
  const rrColor = getTireColor(settings.rr ?? false, currentState.rr);

  return `<g transform="${CAR_TRANSFORM}">
    <path fill="${lfColor}" stroke="${GRAY}" stroke-width="8" d="M346.451,158.291h68.507c5.779,0,10.451-4.682,10.451-10.452V119.88c0-5.77-4.672-10.442-10.451-10.442h-68.507c-5.77,0-10.452,4.672-10.452,10.442v27.959C335.999,153.609,340.681,158.291,346.451,158.291z"/>
    <path fill="${rfColor}" stroke="${GRAY}" stroke-width="8" d="M414.958,353.711h-68.507c-5.77,0-10.452,4.672-10.452,10.442v27.959c0,5.77,4.682,10.461,10.452,10.461h68.507c5.779,0,10.451-4.692,10.451-10.461v-27.959C425.409,358.383,420.737,353.711,414.958,353.711z"/>
    <path fill="${lrColor}" stroke="${GRAY}" stroke-width="8" d="M62.217,159.681h72.206c5.77,0,10.452-4.692,10.452-10.461v-35.328c0-5.779-4.682-10.451-10.452-10.451H62.217c-5.769,0-10.442,4.672-10.442,10.451v35.328C51.775,154.99,56.448,159.681,62.217,159.681z"/>
    <path fill="${rrColor}" stroke="${GRAY}" stroke-width="8" d="M134.422,352.329H62.217c-5.769,0-10.451,4.682-10.451,10.461v35.317c0,5.77,4.682,10.451,10.451,10.451h72.206c5.77,0,10.452-4.682,10.452-10.451v-35.317C144.874,357.011,140.192,352.329,134.422,352.329z"/>
  </g>`;
}
```

Note: `stroke-width="8"` is used because the stroke is in the 512-unit coordinate space (8 × 0.176 scale ≈ 1.4px rendered — visible but not heavy). The function is now exported with `@internal` for testing.

- [ ] **Step 3: Run tests to verify progress**

Run: `pnpm test --filter @iracedeck/actions -- --run`
Expected: Tests still fail (the toggle-tires `default` case in `generateTireServiceSvg` hasn't been updated yet).

- [ ] **Step 4: Commit**

```bash
git add packages/actions/src/actions/tire-service.ts
git commit -m "feat(actions): add car SVG import and rewrite tire indicator generation"
```

---

### Task 4: Rewrite the toggle-tires assembly in generateTireServiceSvg

**Files:**
- Modify: `packages/actions/src/actions/tire-service.ts`

- [ ] **Step 1: Replace the default case in generateTireServiceSvg**

Replace the entire `default` case (lines 292-318) with the new assembly flow using `ICON_BASE_TEMPLATE`:

```typescript
    default: {
      const tireElements = generateToggleTiresIconContent(settings, currentState);

      const colors = resolveIconColors(toggleTiresCarSvg, getGlobalColors(), settings.colorOverrides);
      const title = resolveTitleSettings(
        toggleTiresCarSvg,
        getGlobalTitleSettings(),
        settings.titleOverrides,
        "TIRES",
      );
      const border = resolveBorderSettings(toggleTiresCarSvg, getGlobalBorderSettings(), settings.borderOverrides);

      const rawCarGraphic = extractGraphicContent(toggleTiresCarSvg);
      const colorizedCar = title.showGraphics ? renderIconTemplate(rawCarGraphic, colors) : "";
      const graphicContent = colorizedCar + "\n" + tireElements;

      const titleContent = title.showTitle
        ? generateTitleText({
            text: title.titleText,
            fontSize: title.fontSize,
            bold: title.bold,
            position: title.position,
            customPosition: title.customPosition,
            fill: colors.textColor ?? "#ffffff",
          })
        : "";

      const borderSvg = generateBorderParts(border);
      const borderContent = borderSvg.defs + borderSvg.rects;

      const svg = renderIconTemplate(ICON_BASE_TEMPLATE, {
        backgroundColor: colors.backgroundColor ?? "#000000",
        borderContent,
        graphicContent,
        titleContent,
      });

      return svgToDataUri(svg);
    }
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm test --filter @iracedeck/actions -- --run`
Expected: ALL tests pass, including the updated toggle-tires tests.

- [ ] **Step 3: Commit**

```bash
git add packages/actions/src/actions/tire-service.ts
git commit -m "feat(actions): rewrite toggle-tires assembly with ICON_BASE_TEMPLATE"
```

---

### Task 5: Update key.svg

**Files:**
- Modify: `packages/stream-deck-plugin/com.iracedeck.sd.core.sdPlugin/imgs/actions/tire-service/key.svg`

- [ ] **Step 1: Replace key.svg with new car silhouette design**

Replace the entire file content with a 72x72 version of the car silhouette. The transform is halved: `translate(36, 22) rotate(-90) scale(0.088) translate(-256, -256)`. All 4 tires shown in green (#44FF44) to represent the "all tires changing" state:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72">
  <rect x="0" y="0" width="72" height="72" rx="8" fill="#3a2a2a"/>
  <g transform="translate(36, 22) rotate(-90) scale(0.088) translate(-256, -256)">
    <!-- Car body -->
    <path fill="#888888" d="M448.118,351.402h47.018v-75.629c-11.104,2.554-29.453,6.744-47.008,10.593L448.118,351.402z"/>
    <path fill="#888888" d="M495.136,160.599h-47.008v65.035c17.555,3.85,35.904,8.03,47.008,10.584V160.599z"/>
    <polygon fill="#888888" points="57.147,175.343 0.009,175.343 0,336.647 57.147,336.647"/>
    <path fill="#888888" d="M503.763,245.781c0,0-66.446-15.465-92.844-20.383c-26.399-4.899-91.51-16.42-91.51-16.42s-3.008-11.18-4.606-20.27c-2.771-15.672-16.59-31.335-51.624-31.335c-35.024,0-47.018,0-66.369,0c-50.697,0-42.374,48.852-73.067,48.852c-30.692,0-54.215,0-54.215,0v99.549c0,0,23.523,0,54.215,0c30.693,0,22.37,48.863,73.067,48.863c19.351,0,31.335,0,66.369,0s48.853-15.673,51.624-31.346c1.598-9.08,4.606-20.278,4.606-20.278s65.111-11.511,91.51-16.42c26.398-4.91,92.844-20.373,92.844-20.373c4.814-1.06,8.237-5.307,8.237-10.215C512,251.087,508.576,246.83,503.763,245.781z M295.895,280.275c-22.983,0-28.896-10.867-28.896-24.27c0-13.412,5.912-24.28,28.896-24.28c22.984,0,41.617,10.868,41.617,24.28C337.512,269.408,318.88,280.275,295.895,280.275z"/>
    <!-- Tires (all green = changing) -->
    <path fill="#44FF44" stroke="#888888" stroke-width="8" d="M346.451,158.291h68.507c5.779,0,10.451-4.682,10.451-10.452V119.88c0-5.77-4.672-10.442-10.451-10.442h-68.507c-5.77,0-10.452,4.672-10.452,10.442v27.959C335.999,153.609,340.681,158.291,346.451,158.291z"/>
    <path fill="#44FF44" stroke="#888888" stroke-width="8" d="M414.958,353.711h-68.507c-5.77,0-10.452,4.672-10.452,10.442v27.959c0,5.77,4.682,10.461,10.452,10.461h68.507c5.779,0,10.451-4.692,10.451-10.461v-27.959C425.409,358.383,420.737,353.711,414.958,353.711z"/>
    <path fill="#44FF44" stroke="#888888" stroke-width="8" d="M62.217,159.681h72.206c5.77,0,10.452-4.692,10.452-10.461v-35.328c0-5.779-4.682-10.451-10.452-10.451H62.217c-5.769,0-10.442,4.672-10.442,10.451v35.328C51.775,154.99,56.448,159.681,62.217,159.681z"/>
    <path fill="#44FF44" stroke="#888888" stroke-width="8" d="M134.422,352.329H62.217c-5.769,0-10.451,4.682-10.451,10.461v35.317c0,5.77,4.682,10.451,10.451,10.451h72.206c5.77,0,10.452-4.682,10.452-10.451v-35.317C144.874,357.011,140.192,352.329,134.422,352.329z"/>
  </g>
  <!-- Title text -->
  <text x="36" y="55" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">Tires</text>
  <text x="36" y="66" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" fill="#ffffff">Change</text>
</svg>
```

- [ ] **Step 2: Verify the key icon renders correctly**

Open the file in a browser to confirm the car silhouette with green tires and title text is visible at 72x72.

- [ ] **Step 3: Commit**

```bash
git add packages/stream-deck-plugin/com.iracedeck.sd.core.sdPlugin/imgs/actions/tire-service/key.svg
git commit -m "feat(icons): update tire-service key icon to match car silhouette redesign"
```

---

### Task 6: Run icon generation scripts and verify build

**Files:**
- Generated: `packages/icons/preview/tire-service/toggle-tires.svg` (auto-generated)
- Generated: `packages/stream-deck-plugin/src/pi/data/icon-defaults.json` (auto-generated)

- [ ] **Step 1: Generate icon previews**

Run: `node scripts/generate-icon-previews.mjs`
Expected: New preview file created for `tire-service/toggle-tires.svg`.

- [ ] **Step 2: Generate icon defaults**

Run: `node scripts/generate-icon-defaults.mjs`
Expected: `icon-defaults.json` updated with the new icon's default colors.

- [ ] **Step 3: Run lint and format**

Run: `pnpm lint:fix && pnpm format:fix`
Expected: No errors. Auto-fixes applied if any.

- [ ] **Step 4: Run full test suite**

Run: `pnpm test -- --run`
Expected: All tests pass.

- [ ] **Step 5: Run build**

Run: `pnpm build`
Expected: Build succeeds with no errors. If the user has `pnpm watch:stream-deck` running, skip this step and verify via watch mode output instead.

- [ ] **Step 6: Commit generated files**

```bash
git add packages/icons/preview/ packages/stream-deck-plugin/src/pi/data/icon-defaults.json
git commit -m "chore: regenerate icon previews and defaults for toggle-tires"
```

---

### Task 7: Visual verification

- [ ] **Step 1: Check the generated SVG output**

Add a temporary `console.log` or inspect the test output to decode and examine the SVG data URI produced by `generateTireServiceSvg()` for the toggle-tires mode. Verify:
- Car silhouette paths are present
- 4 tire paths with correct color fills
- Title text "TIRES" at the bottom
- No "Change"/"No Change" text

If using watch mode with Stream Deck connected, verify the icon appears correctly on the device.

- [ ] **Step 2: Remove any temporary debug code if added**

Ensure no `console.log` or debug statements remain.
