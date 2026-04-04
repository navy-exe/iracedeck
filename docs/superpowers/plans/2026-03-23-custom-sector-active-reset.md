# Custom Sector & Active Reset Sub-Actions — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4 new modes to the `splits-delta-cycle` action: Custom Sector Start, Custom Sector End, Set Active Reset Point, and Reset to Start Point.

**Architecture:** Extend the existing `splits-delta-cycle` action with 4 new mode enum values. Each mode maps to a global key binding (no defaults — users must configure in iRacing first). New icons use the same purple `#412244` background as existing splits icons. No SDK support — keyboard shortcuts only.

**Tech Stack:** TypeScript, Zod, Vitest, SVG (Mustache templates), EJS (PI templates)

**Issue:** #177

---

## File Map

### Files to modify

| File | Change |
|------|--------|
| `packages/actions/src/actions/splits-delta-cycle.ts` | Add 4 mode enum values, 4 global key names, icon imports, SVG generation branches, key-down handler branches |
| `packages/actions/src/actions/splits-delta-cycle.test.ts` | Add tests for new constants and SVG generation |
| `packages/stream-deck-plugin/src/pi/splits-delta-cycle.ejs` | Add 4 dropdown options |
| `packages/stream-deck-plugin/src/pi/data/key-bindings.json` | Add 4 key binding entries to `splitsDelta` |
| `packages/stream-deck-plugin/com.iracedeck.sd.core.sdPlugin/manifest.json` | No change needed (action already registered) |
| `packages/stream-dock-plugin/com.iracedeck.sd.core.sdPlugin/manifest.json` | No change needed (action already registered) |
| `docs/plugins/core/actions/splits-delta-cycle.md` | Add new modes to docs |
| `docs/reference/actions.json` | Add 4 new mode entries |
| `packages/website/src/content/docs/docs/actions/cockpit/splits-delta-cycle.md` | Update mode count badge and modes table |
| `.claude/skills/iracedeck-actions/SKILL.md` | Update control count from 3 to 7 |

### Files to create

| File | Purpose |
|------|---------|
| `packages/icons/splits-delta-cycle/custom-sector-start.svg` | 144x144 icon template — sector start marker |
| `packages/icons/splits-delta-cycle/custom-sector-end.svg` | 144x144 icon template — sector end marker |
| `packages/icons/splits-delta-cycle/active-reset-set.svg` | 144x144 icon template — set reset point |
| `packages/icons/splits-delta-cycle/active-reset-run.svg` | 144x144 icon template — reset to start point |

---

## Task 1: Create icon SVG templates

**Files:**
- Create: `packages/icons/splits-delta-cycle/custom-sector-start.svg`
- Create: `packages/icons/splits-delta-cycle/custom-sector-end.svg`
- Create: `packages/icons/splits-delta-cycle/active-reset-set.svg`
- Create: `packages/icons/splits-delta-cycle/active-reset-run.svg`

All icons use the same purple background `#412244` and 144x144 canvas as existing splits icons. They follow the standard two-line label pattern (`{{subLabel}}` at y=104, `{{mainLabel}}` at y=126).

Icon concepts:
- **custom-sector-start**: Flag/marker pointing right (start of sector) in `{{graphic1Color}}`
- **custom-sector-end**: Flag/marker pointing left (end of sector) in `{{graphic1Color}}`
- **active-reset-set**: Pin/bookmark marker (setting a point) in `{{graphic1Color}}`
- **active-reset-run**: Circular reset arrow (return to point) in `{{graphic1Color}}`

- [ ] **Step 1: Create `custom-sector-start.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
  <desc>{"colors":{"backgroundColor":"#412244","textColor":"#ffffff","graphic1Color":"#ffffff"}}</desc>
  <g filter="url(#activity-state)">
    <rect x="0" y="0" width="144" height="144" fill="{{backgroundColor}}"/>

    <!-- Sector start: vertical line with right-pointing flag -->
    <line x1="48" y1="16" x2="48" y2="80" stroke="{{graphic1Color}}" stroke-width="4" stroke-linecap="round"/>
    <polygon points="52,16 100,30 52,44" fill="#2ecc71"/>
    <circle cx="48" cy="80" r="6" fill="{{graphic1Color}}"/>

    <text x="72" y="104" text-anchor="middle" dominant-baseline="central"
          fill="{{textColor}}" font-family="Arial, sans-serif" font-size="16">{{subLabel}}</text>
    <text x="72" y="126" text-anchor="middle" dominant-baseline="central"
          fill="{{textColor}}" font-family="Arial, sans-serif" font-size="20" font-weight="bold">{{mainLabel}}</text>
  </g>
</svg>
```

- [ ] **Step 2: Create `custom-sector-end.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
  <desc>{"colors":{"backgroundColor":"#412244","textColor":"#ffffff","graphic1Color":"#ffffff"}}</desc>
  <g filter="url(#activity-state)">
    <rect x="0" y="0" width="144" height="144" fill="{{backgroundColor}}"/>

    <!-- Sector end: vertical line with left-pointing flag -->
    <line x1="96" y1="16" x2="96" y2="80" stroke="{{graphic1Color}}" stroke-width="4" stroke-linecap="round"/>
    <polygon points="92,16 44,30 92,44" fill="#e74c3c"/>
    <circle cx="96" cy="80" r="6" fill="{{graphic1Color}}"/>

    <text x="72" y="104" text-anchor="middle" dominant-baseline="central"
          fill="{{textColor}}" font-family="Arial, sans-serif" font-size="16">{{subLabel}}</text>
    <text x="72" y="126" text-anchor="middle" dominant-baseline="central"
          fill="{{textColor}}" font-family="Arial, sans-serif" font-size="20" font-weight="bold">{{mainLabel}}</text>
  </g>
</svg>
```

- [ ] **Step 3: Create `active-reset-set.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
  <desc>{"colors":{"backgroundColor":"#412244","textColor":"#ffffff","graphic1Color":"#ffffff"}}</desc>
  <g filter="url(#activity-state)">
    <rect x="0" y="0" width="144" height="144" fill="{{backgroundColor}}"/>

    <!-- Set reset point: location pin -->
    <path d="M72 14 C52 14 40 28 40 44 C40 64 72 82 72 82 C72 82 104 64 104 44 C104 28 92 14 72 14 Z"
          fill="none" stroke="{{graphic1Color}}" stroke-width="4"/>
    <circle cx="72" cy="42" r="12" fill="#f39c12"/>

    <text x="72" y="104" text-anchor="middle" dominant-baseline="central"
          fill="{{textColor}}" font-family="Arial, sans-serif" font-size="16">{{subLabel}}</text>
    <text x="72" y="126" text-anchor="middle" dominant-baseline="central"
          fill="{{textColor}}" font-family="Arial, sans-serif" font-size="20" font-weight="bold">{{mainLabel}}</text>
  </g>
</svg>
```

- [ ] **Step 4: Create `active-reset-run.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
  <desc>{"colors":{"backgroundColor":"#412244","textColor":"#ffffff","graphic1Color":"#ffffff"}}</desc>
  <g filter="url(#activity-state)">
    <rect x="0" y="0" width="144" height="144" fill="{{backgroundColor}}"/>

    <!-- Reset: circular arrow -->
    <path d="M72 20 A32 32 0 1 1 40 52" fill="none" stroke="{{graphic1Color}}" stroke-width="5" stroke-linecap="round"/>
    <polygon points="40,38 28,54 52,54" fill="{{graphic1Color}}"/>
    <circle cx="72" cy="52" r="8" fill="#f39c12"/>

    <text x="72" y="104" text-anchor="middle" dominant-baseline="central"
          fill="{{textColor}}" font-family="Arial, sans-serif" font-size="16">{{subLabel}}</text>
    <text x="72" y="126" text-anchor="middle" dominant-baseline="central"
          fill="{{textColor}}" font-family="Arial, sans-serif" font-size="20" font-weight="bold">{{mainLabel}}</text>
  </g>
</svg>
```

- [ ] **Step 5: Generate icon previews and color defaults**

Run:
```bash
node scripts/generate-icon-previews.mjs
node scripts/generate-color-defaults.mjs
```

- [ ] **Step 6: Commit**

```bash
git add packages/icons/splits-delta-cycle/
git add packages/icons/preview/
git add packages/stream-deck-plugin/src/pi/data/color-defaults.json
git commit -m "feat(icons): add custom sector and active reset icons for splits-delta-cycle"
```

---

## Task 2: Add global key names and icon generation (TDD)

**Files:**
- Modify: `packages/actions/src/actions/splits-delta-cycle.ts`
- Modify: `packages/actions/src/actions/splits-delta-cycle.test.ts`

### Step-by-step

- [ ] **Step 1: Add test icon mocks for new SVGs**

Add to the top of `splits-delta-cycle.test.ts`, after the existing icon mocks:

```typescript
vi.mock("@iracedeck/icons/splits-delta-cycle/custom-sector-start.svg", () => ({
  default: '<svg xmlns="http://www.w3.org/2000/svg" class="custom-sector-start">{{mainLabel}} {{subLabel}}</svg>',
}));
vi.mock("@iracedeck/icons/splits-delta-cycle/custom-sector-end.svg", () => ({
  default: '<svg xmlns="http://www.w3.org/2000/svg" class="custom-sector-end">{{mainLabel}} {{subLabel}}</svg>',
}));
vi.mock("@iracedeck/icons/splits-delta-cycle/active-reset-set.svg", () => ({
  default: '<svg xmlns="http://www.w3.org/2000/svg" class="active-reset-set">{{mainLabel}} {{subLabel}}</svg>',
}));
vi.mock("@iracedeck/icons/splits-delta-cycle/active-reset-run.svg", () => ({
  default: '<svg xmlns="http://www.w3.org/2000/svg" class="active-reset-run">{{mainLabel}} {{subLabel}}</svg>',
}));
```

- [ ] **Step 2: Write failing tests for new global key names**

Add to the `constants` describe block:

```typescript
it("should have correct global key name for custom sector start", () => {
  expect(GLOBAL_KEY_NAMES.CUSTOM_SECTOR_START).toBe("splitsDeltaCustomSectorStart");
});

it("should have correct global key name for custom sector end", () => {
  expect(GLOBAL_KEY_NAMES.CUSTOM_SECTOR_END).toBe("splitsDeltaCustomSectorEnd");
});

it("should have correct global key name for active reset set", () => {
  expect(GLOBAL_KEY_NAMES.ACTIVE_RESET_SET).toBe("splitsDeltaActiveResetSet");
});

it("should have correct global key name for active reset run", () => {
  expect(GLOBAL_KEY_NAMES.ACTIVE_RESET_RUN).toBe("splitsDeltaActiveResetRun");
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run packages/actions/src/actions/splits-delta-cycle.test.ts`
Expected: 4 FAIL — property does not exist on GLOBAL_KEY_NAMES

- [ ] **Step 4: Add global key names to action source**

In `splits-delta-cycle.ts`, extend the `GLOBAL_KEY_NAMES` object:

```typescript
export const GLOBAL_KEY_NAMES = {
  NEXT: "splitsDeltaNext",
  PREVIOUS: "splitsDeltaPrevious",
  TOGGLE_REF_CAR: "toggleUiDisplayRefCar",
  CUSTOM_SECTOR_START: "splitsDeltaCustomSectorStart",
  CUSTOM_SECTOR_END: "splitsDeltaCustomSectorEnd",
  ACTIVE_RESET_SET: "splitsDeltaActiveResetSet",
  ACTIVE_RESET_RUN: "splitsDeltaActiveResetRun",
} as const;
```

- [ ] **Step 5: Run tests to verify key name tests pass**

Run: `npx vitest run packages/actions/src/actions/splits-delta-cycle.test.ts`
Expected: 4 new tests PASS

- [ ] **Step 6: Write failing tests for new SVG generation**

Add to the `generateSplitsDeltaCycleSvg` describe block:

```typescript
it("should generate custom-sector-start icon", () => {
  const result = generateSplitsDeltaCycleSvg({ mode: "custom-sector-start", direction: "next" });
  expect(result).toContain("data:image/svg+xml");
  expect(decodeURIComponent(result)).toContain("custom-sector-start");
});

it("should include SECTOR and START labels for custom-sector-start mode", () => {
  const result = generateSplitsDeltaCycleSvg({ mode: "custom-sector-start", direction: "next" });
  const decoded = decodeURIComponent(result);
  expect(decoded).toContain("START");
  expect(decoded).toContain("SECTOR");
});

it("should generate custom-sector-end icon", () => {
  const result = generateSplitsDeltaCycleSvg({ mode: "custom-sector-end", direction: "next" });
  expect(result).toContain("data:image/svg+xml");
  expect(decodeURIComponent(result)).toContain("custom-sector-end");
});

it("should include SECTOR and END labels for custom-sector-end mode", () => {
  const result = generateSplitsDeltaCycleSvg({ mode: "custom-sector-end", direction: "next" });
  const decoded = decodeURIComponent(result);
  expect(decoded).toContain("END");
  expect(decoded).toContain("SECTOR");
});

it("should generate active-reset-set icon", () => {
  const result = generateSplitsDeltaCycleSvg({ mode: "active-reset-set", direction: "next" });
  expect(result).toContain("data:image/svg+xml");
  expect(decodeURIComponent(result)).toContain("active-reset-set");
});

it("should include SET and RESET POINT labels for active-reset-set mode", () => {
  const result = generateSplitsDeltaCycleSvg({ mode: "active-reset-set", direction: "next" });
  const decoded = decodeURIComponent(result);
  expect(decoded).toContain("SET");
  expect(decoded).toContain("RESET POINT");
});

it("should generate active-reset-run icon", () => {
  const result = generateSplitsDeltaCycleSvg({ mode: "active-reset-run", direction: "next" });
  expect(result).toContain("data:image/svg+xml");
  expect(decodeURIComponent(result)).toContain("active-reset-run");
});

it("should include RESET and TO START labels for active-reset-run mode", () => {
  const result = generateSplitsDeltaCycleSvg({ mode: "active-reset-run", direction: "next" });
  const decoded = decodeURIComponent(result);
  expect(decoded).toContain("RESET");
  expect(decoded).toContain("TO START");
});

it("should produce different icons for all new modes", () => {
  const sectorStart = generateSplitsDeltaCycleSvg({ mode: "custom-sector-start", direction: "next" });
  const sectorEnd = generateSplitsDeltaCycleSvg({ mode: "custom-sector-end", direction: "next" });
  const resetSet = generateSplitsDeltaCycleSvg({ mode: "active-reset-set", direction: "next" });
  const resetRun = generateSplitsDeltaCycleSvg({ mode: "active-reset-run", direction: "next" });
  const allIcons = [sectorStart, sectorEnd, resetSet, resetRun];
  expect(new Set(allIcons).size).toBe(4);
});
```

- [ ] **Step 7: Run tests to verify they fail**

Run: `npx vitest run packages/actions/src/actions/splits-delta-cycle.test.ts`
Expected: FAIL — mode values not in enum

- [ ] **Step 8: Implement mode enum extension and icon generation**

In `splits-delta-cycle.ts`:

1. Add icon imports after existing ones:
```typescript
import customSectorStartIconSvg from "@iracedeck/icons/splits-delta-cycle/custom-sector-start.svg";
import customSectorEndIconSvg from "@iracedeck/icons/splits-delta-cycle/custom-sector-end.svg";
import activeResetSetIconSvg from "@iracedeck/icons/splits-delta-cycle/active-reset-set.svg";
import activeResetRunIconSvg from "@iracedeck/icons/splits-delta-cycle/active-reset-run.svg";
```

2. Add a map for new mode icons (after `DIRECTION_ICONS`):
```typescript
const MODE_ICONS: Record<string, { svg: string; mainLabel: string; subLabel: string }> = {
  "custom-sector-start": { svg: customSectorStartIconSvg, mainLabel: "START", subLabel: "SECTOR" },
  "custom-sector-end": { svg: customSectorEndIconSvg, mainLabel: "END", subLabel: "SECTOR" },
  "active-reset-set": { svg: activeResetSetIconSvg, mainLabel: "SET", subLabel: "RESET POINT" },
  "active-reset-run": { svg: activeResetRunIconSvg, mainLabel: "RESET", subLabel: "TO START" },
};
```

3. Extend the mode enum:
```typescript
const SplitsDeltaCycleSettings = CommonSettings.extend({
  mode: z
    .enum([
      "cycle",
      "toggle-ref-car",
      "custom-sector-start",
      "custom-sector-end",
      "active-reset-set",
      "active-reset-run",
    ])
    .default("cycle"),
  direction: z.enum(["next", "previous"]).default("next"),
});
```

4. Add a branch in `generateSplitsDeltaCycleSvg` for the new modes, before the cycle fallback:
```typescript
const modeIcon = MODE_ICONS[mode];
if (modeIcon) {
  const colors = resolveIconColors(modeIcon.svg, getGlobalColors(), settings.colorOverrides);
  const svg = renderIconTemplate(modeIcon.svg, {
    mainLabel: modeIcon.mainLabel,
    subLabel: modeIcon.subLabel,
    ...colors,
  });
  return svgToDataUri(svg);
}
```

- [ ] **Step 9: Run tests to verify all pass**

Run: `npx vitest run packages/actions/src/actions/splits-delta-cycle.test.ts`
Expected: All tests PASS

- [ ] **Step 10: Commit**

```bash
git add packages/actions/src/actions/splits-delta-cycle.ts packages/actions/src/actions/splits-delta-cycle.test.ts
git commit -m "feat(actions): add custom sector and active reset modes to splits-delta-cycle"
```

---

## Task 3: Add key-down and dial-down handler support for new modes

**Files:**
- Modify: `packages/actions/src/actions/splits-delta-cycle.ts`

The new modes are simple one-shot key sends (like `toggle-ref-car`). Each mode maps to its global key name. Both `onKeyDown` (button press) and `onDialDown` (encoder press) need to support them.

Note: `onDialRotate` correctly ignores non-cycle modes via the existing `if (settings.mode !== "cycle") return;` guard — no change needed there since the new modes are one-shot actions, not directional.

- [ ] **Step 1: Add a mode-to-key-name mapping**

Add after `GLOBAL_KEY_NAMES`:

```typescript
const MODE_KEY_MAP: Record<string, string> = {
  "custom-sector-start": GLOBAL_KEY_NAMES.CUSTOM_SECTOR_START,
  "custom-sector-end": GLOBAL_KEY_NAMES.CUSTOM_SECTOR_END,
  "active-reset-set": GLOBAL_KEY_NAMES.ACTIVE_RESET_SET,
  "active-reset-run": GLOBAL_KEY_NAMES.ACTIVE_RESET_RUN,
  "toggle-ref-car": GLOBAL_KEY_NAMES.TOGGLE_REF_CAR,
};
```

- [ ] **Step 2: Simplify `onKeyDown` to use the mapping**

Replace the `settingKey` resolution in `onKeyDown`:

```typescript
const settingKey =
  MODE_KEY_MAP[settings.mode] ??
  (settings.direction === "next" ? GLOBAL_KEY_NAMES.NEXT : GLOBAL_KEY_NAMES.PREVIOUS);
```

This is a direct refactor — `toggle-ref-car` is now in the map, and `cycle` falls through to the direction-based lookup. The 4 new modes each map to their key name.

- [ ] **Step 3: Update `onDialDown` to support new modes**

Replace the current `onDialDown` handler which only supports `toggle-ref-car`:

```typescript
override async onDialDown(ev: IDeckDialDownEvent<SplitsDeltaCycleSettings>): Promise<void> {
  this.logger.info("Dial down received");

  const parsed = SplitsDeltaCycleSettings.safeParse(ev.payload.settings);
  const settings = parsed.success ? parsed.data : SplitsDeltaCycleSettings.parse({});

  const settingKey = MODE_KEY_MAP[settings.mode];
  if (!settingKey) return;

  const globalSettings = getGlobalSettings() as Record<string, unknown>;
  const binding = parseKeyBinding(globalSettings[settingKey]);

  if (!binding?.key) {
    this.logger.warn(`No key binding configured for ${settingKey}`);
    return;
  }

  await this.sendKeyBinding(binding);
}
```

This generalizes dial press for all one-shot modes (toggle-ref-car + 4 new modes). Cycle mode has no entry in `MODE_KEY_MAP`, so it returns early (encoder press has no meaning for cycle mode — rotation is used instead).

- [ ] **Step 4: Run all tests**

Run: `npx vitest run packages/actions/src/actions/splits-delta-cycle.test.ts`
Expected: All PASS (no behavior change for existing modes)

- [ ] **Step 5: Commit**

```bash
git add packages/actions/src/actions/splits-delta-cycle.ts
git commit -m "refactor(actions): simplify splits-delta-cycle key mapping with MODE_KEY_MAP"
```

---

## Task 4: Update key bindings and PI template

**Files:**
- Modify: `packages/stream-deck-plugin/src/pi/data/key-bindings.json`
- Modify: `packages/stream-deck-plugin/src/pi/splits-delta-cycle.ejs`

- [ ] **Step 1: Add key binding entries**

In `key-bindings.json`, add 4 entries to the `splitsDelta` array (after the existing 3):

```json
{ "id": "customSectorStart", "label": "Custom Sector Start", "default": "", "setting": "splitsDeltaCustomSectorStart" },
{ "id": "customSectorEnd", "label": "Custom Sector End", "default": "", "setting": "splitsDeltaCustomSectorEnd" },
{ "id": "activeResetSet", "label": "Set Active Reset Point", "default": "", "setting": "splitsDeltaActiveResetSet" },
{ "id": "activeResetRun", "label": "Reset to Start Point", "default": "", "setting": "splitsDeltaActiveResetRun" }
```

Note: `default` is empty string — iRacing has no default bindings for these.

- [ ] **Step 2: Add mode dropdown options**

In `splits-delta-cycle.ejs`, add 4 new `<option>` elements to the mode `<sdpi-select>`:

```html
<sdpi-select id="mode-select" setting="mode" default="cycle">
  <option value="cycle">Cycle Splits Delta</option>
  <option value="toggle-ref-car">Toggle Reference Car</option>
  <option value="custom-sector-start">Custom Sector Start</option>
  <option value="custom-sector-end">Custom Sector End</option>
  <option value="active-reset-set">Set Active Reset Point</option>
  <option value="active-reset-run">Reset to Start Point</option>
</sdpi-select>
```

- [ ] **Step 3: Build and verify**

Run:
```bash
pnpm build
```

Check for TypeScript errors in the output.

- [ ] **Step 4: Commit**

```bash
git add packages/stream-deck-plugin/src/pi/data/key-bindings.json packages/stream-deck-plugin/src/pi/splits-delta-cycle.ejs
git commit -m "feat(stream-deck-plugin): add custom sector and active reset to PI"
```

---

## Task 5: Update documentation and references

**Files:**
- Modify: `docs/plugins/core/actions/splits-delta-cycle.md`
- Modify: `docs/reference/actions.json`
- Modify: `packages/website/src/content/docs/docs/actions/cockpit/splits-delta-cycle.md`
- Modify: `.claude/skills/iracedeck-actions/SKILL.md`

- [ ] **Step 1: Update action documentation**

In `docs/plugins/core/actions/splits-delta-cycle.md`, add the new modes to the Mode Options section and keyboard simulation table:

**Mode Options** (add after Toggle Reference Car):
```markdown
- **Custom Sector Start** - Marks the start point for a custom sector
- **Custom Sector End** - Marks the end point for a custom sector
- **Set Active Reset Point** - Saves the current car state as a reset snapshot (solo practice only)
- **Reset to Start Point** - Teleports the car back to the saved active reset snapshot (solo practice only)
```

**Keyboard Simulation** (add rows):
```markdown
| Custom Sector Start | *(none)* | Mark Start Point |
| Custom Sector End | *(none)* | Mark End Point |
| Set Active Reset Point | *(none)* | Set Start Point |
| Reset to Start Point | *(none)* | Reset to Start Point |
```

**Icon States** (add rows):
```markdown
| Custom Sector Start | Flag marker (green, pointing right) |
| Custom Sector End | Flag marker (red, pointing left) |
| Set Active Reset Point | Location pin with yellow center |
| Reset to Start Point | Circular reset arrow with yellow center |
```

- [ ] **Step 2: Update actions.json**

In `docs/reference/actions.json`, add 4 new mode entries to the `splits-delta-cycle` modes array:

```json
{
  "value": "custom-sector-start",
  "label": "Custom Sector Start",
  "description": "Marks the start point for a custom sector"
},
{
  "value": "custom-sector-end",
  "label": "Custom Sector End",
  "description": "Marks the end point for a custom sector"
},
{
  "value": "active-reset-set",
  "label": "Set Active Reset Point",
  "description": "Saves the current car state as a reset snapshot (solo practice only)"
},
{
  "value": "active-reset-run",
  "label": "Reset to Start Point",
  "description": "Teleports the car back to the saved active reset snapshot (solo practice only)"
}
```

- [ ] **Step 3: Update website documentation**

In `packages/website/src/content/docs/docs/actions/cockpit/splits-delta-cycle.md`:

1. Update the badge from `"2 modes"` to `"6 modes"`
2. Add new rows to the Modes table:
```markdown
| Custom Sector Start | Marks the start point for a custom sector. |
| Custom Sector End | Marks the end point for a custom sector. |
| Set Active Reset Point | Saves the current car state as a reset snapshot (solo practice only). |
| Reset to Start Point | Teleports the car back to the saved active reset snapshot (solo practice only). |
```
3. Add a note about Active Reset limitations:
```markdown
- Active Reset only works in solo practice sessions. The car's full state (position, speed, temperatures) is captured when setting the point.
```

- [ ] **Step 4: Update iracedeck-actions skill**

In `.claude/skills/iracedeck-actions/SKILL.md`, update the Cockpit & Interface table row:

From:
```markdown
| Splits & Reference | 3 | cycle (next/previous), toggle-ref-car |
```
To:
```markdown
| Splits & Reference | 7 | cycle (next/previous), toggle-ref-car, custom-sector-start, custom-sector-end, active-reset-set, active-reset-run |
```

- [ ] **Step 5: Commit**

```bash
git add docs/plugins/core/actions/splits-delta-cycle.md docs/reference/actions.json packages/website/src/content/docs/docs/actions/cockpit/splits-delta-cycle.md .claude/skills/iracedeck-actions/SKILL.md
git commit -m "docs: add custom sector and active reset modes to splits-delta-cycle documentation"
```

---

## Task 6: Final verification

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected: All pass.

- [ ] **Step 2: Full build**

```bash
pnpm build
```

Expected: No TypeScript errors. Check output for `TS[0-9]+:` patterns.

- [ ] **Step 3: Lint and format**

```bash
pnpm lint:fix
pnpm format:fix
```

- [ ] **Step 4: Commit any lint/format fixes**

Only if lint/format made changes:
```bash
git add -A
git commit -m "style: fix lint and formatting"
```
