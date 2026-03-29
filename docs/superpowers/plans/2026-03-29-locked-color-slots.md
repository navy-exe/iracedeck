# Locked Color Slots Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `"locked"` field to icon `<desc>` metadata so specific color slots skip global overrides while still accepting per-action overrides.

**Architecture:** Add `parseIconLocked()` helper alongside existing `parseIconDefaults()` in `icon-template.ts`. Update `resolveIconColors()` to skip global colors for locked slots. Add `"locked"` to icon SVGs that mix colorizable slots with hardcoded semantic colors.

**Tech Stack:** TypeScript, Vitest, SVG

---

### Task 1: Add `parseIconLocked()` and update `resolveIconColors()` — tests

**Files:**
- Modify: `packages/stream-deck-plugin/src/shared/icon-template.test.ts:314-386`

- [ ] **Step 1: Write failing tests for `parseIconLocked()`**

Add a new `describe("parseIconLocked")` block after the existing `parseIconDefaults` tests (after line 312) and import `parseIconLocked`:

```typescript
// Update import at line 1-8 to include parseIconLocked:
import {
  escapeXml,
  generateIconText,
  parseIconDefaults,
  parseIconLocked,
  renderIconTemplate,
  resolveIconColors,
  validateIconTemplate,
} from "@iracedeck/deck-core";
```

Add after line 312 (after `parseIconDefaults` describe block closes):

```typescript
  describe("parseIconLocked", () => {
    it("should return locked slot names as a Set", () => {
      const svg = `<svg><desc>{"colors":{"backgroundColor":"#412244","graphic1Color":"#ffffff"},"locked":["graphic1Color"]}</desc></svg>`;

      const locked = parseIconLocked(svg);

      expect(locked).toEqual(new Set(["graphic1Color"]));
    });

    it("should return empty Set when no locked field", () => {
      const svg = `<svg><desc>{"colors":{"backgroundColor":"#412244"}}</desc></svg>`;

      const locked = parseIconLocked(svg);

      expect(locked).toEqual(new Set());
    });

    it("should return empty Set when locked is empty array", () => {
      const svg = `<svg><desc>{"colors":{"backgroundColor":"#412244"},"locked":[]}</desc></svg>`;

      const locked = parseIconLocked(svg);

      expect(locked).toEqual(new Set());
    });

    it("should return empty Set when no <desc> element", () => {
      const svg = `<svg></svg>`;

      const locked = parseIconLocked(svg);

      expect(locked).toEqual(new Set());
    });

    it("should return empty Set for invalid JSON", () => {
      const svg = `<svg><desc>not json</desc></svg>`;

      const locked = parseIconLocked(svg);

      expect(locked).toEqual(new Set());
    });

    it("should handle multiple locked slots", () => {
      const svg = `<svg><desc>{"colors":{"backgroundColor":"#412244","graphic1Color":"#ffffff","graphic2Color":"#ffd318"},"locked":["graphic1Color","graphic2Color"]}</desc></svg>`;

      const locked = parseIconLocked(svg);

      expect(locked).toEqual(new Set(["graphic1Color", "graphic2Color"]));
    });
  });
```

- [ ] **Step 2: Write failing tests for locked behavior in `resolveIconColors()`**

Add these tests inside the existing `describe("resolveIconColors")` block (after line 384, before the closing `});`):

```typescript
    const templateWithLockedSlot = `<svg>
      <desc>{"colors":{"backgroundColor":"#412244","textColor":"#ffffff","graphic1Color":"#ffffff"},"locked":["graphic1Color"]}</desc>
    </svg>`;

    it("should skip global color for locked slot", () => {
      const colors = resolveIconColors(templateWithLockedSlot, {
        backgroundColor: "#111111",
        graphic1Color: "#000000",
      });

      expect(colors.backgroundColor).toBe("#111111"); // not locked, global applies
      expect(colors.graphic1Color).toBe("#ffffff"); // locked, falls back to icon default
    });

    it("should allow per-action override on locked slot", () => {
      const colors = resolveIconColors(
        templateWithLockedSlot,
        { graphic1Color: "#000000" },
        { graphic1Color: "#ff0000" },
      );

      expect(colors.graphic1Color).toBe("#ff0000"); // per-action override still wins
    });

    it("should handle template with no locked field (backward compatible)", () => {
      const colors = resolveIconColors(templateWithAllSlots, {
        graphic1Color: "#aaaaaa",
      });

      expect(colors.graphic1Color).toBe("#aaaaaa"); // no locked = global applies
    });

    it("should handle multiple locked slots", () => {
      const templateMultiLocked = `<svg>
        <desc>{"colors":{"backgroundColor":"#412244","textColor":"#ffffff","graphic1Color":"#ffffff","graphic2Color":"#ffd318"},"locked":["graphic1Color","graphic2Color"]}</desc>
      </svg>`;

      const colors = resolveIconColors(templateMultiLocked, {
        backgroundColor: "#111111",
        textColor: "#eeeeee",
        graphic1Color: "#000000",
        graphic2Color: "#000000",
      });

      expect(colors.backgroundColor).toBe("#111111"); // not locked
      expect(colors.textColor).toBe("#eeeeee"); // not locked
      expect(colors.graphic1Color).toBe("#ffffff"); // locked
      expect(colors.graphic2Color).toBe("#ffd318"); // locked
    });
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test -- --reporter=verbose packages/stream-deck-plugin/src/shared/icon-template.test.ts`
Expected: FAIL — `parseIconLocked` is not exported from `@iracedeck/deck-core`, and locked behavior not implemented.

---

### Task 2: Implement `parseIconLocked()` and update `resolveIconColors()`

**Files:**
- Modify: `packages/deck-core/src/icon-template.ts:67-118`
- Modify: `packages/deck-core/src/index.ts` (add export)

- [ ] **Step 1: Add `parseIconLocked()` after `parseIconDefaults()` (after line 81)**

Insert after line 81 in `icon-template.ts`:

```typescript

/**
 * Parses locked color slots from an SVG template's <desc> metadata.
 * Locked slots skip global color overrides but still accept per-action overrides.
 *
 * @param svgTemplate - SVG template string containing a <desc> element
 * @returns Set of slot names that are locked, or empty Set if none
 *
 * @internal Exported for testing
 */
export function parseIconLocked(svgTemplate: string): Set<string> {
  const descMatch = svgTemplate.match(/<desc>(.*?)<\/desc>/s);

  if (!descMatch) {
    return new Set();
  }

  try {
    const parsed = JSON.parse(descMatch[1]) as { locked?: string[] };

    return new Set(parsed.locked ?? []);
  } catch {
    return new Set();
  }
}
```

- [ ] **Step 2: Update `resolveIconColors()` to use locked slots**

Replace lines 100-118 in `icon-template.ts`:

```typescript
export function resolveIconColors(
  svgTemplate: string,
  globalColors: ColorSlots,
  actionOverrides?: ColorSlots,
): Record<string, string> {
  const defaults = parseIconDefaults(svgTemplate);
  const locked = parseIconLocked(svgTemplate);
  const result: Record<string, string> = {};

  for (const key of Object.keys(defaults) as (keyof ColorSlots)[]) {
    const defaultValue = defaults[key];

    if (defaultValue === undefined) {
      continue;
    }

    // Filter empty strings and #000001 sentinel (means "not set" — used by reset buttons)
    const pick = (v: string | undefined) => (v && v.length > 0 && v !== "#000001" ? v : undefined);
    const globalValue = locked.has(key) ? undefined : pick(globalColors[key]);

    result[key] = pick(actionOverrides?.[key]) ?? globalValue ?? defaultValue;
  }

  return result;
}
```

- [ ] **Step 3: Export `parseIconLocked` from the package index**

In `packages/deck-core/src/index.ts`, add `parseIconLocked` to the existing icon-template re-export (next to `parseIconDefaults`):

```typescript
  parseIconLocked,
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- --reporter=verbose packages/stream-deck-plugin/src/shared/icon-template.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add packages/deck-core/src/icon-template.ts packages/deck-core/src/index.ts packages/stream-deck-plugin/src/shared/icon-template.test.ts
git commit -m "feat(icons): add parseIconLocked() and locked slot guard in resolveIconColors() (#225)"
```

---

### Task 3: Add `"locked"` metadata to icon SVGs

**Files:**
- Modify: 120 SVG files under `packages/icons/` (see list below)

All 120 icons need `"locked":["graphic1Color"]` added to their `<desc>` JSON. The pattern is the same for every file: the `<desc>` currently contains `{"colors":{...}}` and needs to become `{"colors":{...},"locked":["graphic1Color"]}`.

- [ ] **Step 1: Write a script to add locked metadata**

Create a temporary Node.js script to batch-update the SVGs. The script reads each SVG, parses the `<desc>` JSON, adds `"locked":["graphic1Color"]`, and writes it back:

```bash
node -e "
const fs = require('fs');
const files = [
  // ai-spotter-controls
  'packages/icons/ai-spotter-controls/announce-leader.svg',
  // audio-controls
  'packages/icons/audio-controls/master-mute.svg',
  'packages/icons/audio-controls/master-volume-down.svg',
  'packages/icons/audio-controls/master-volume-up.svg',
  'packages/icons/audio-controls/spotter-volume-down.svg',
  'packages/icons/audio-controls/spotter-volume-up.svg',
  'packages/icons/audio-controls/voice-chat-volume-down.svg',
  'packages/icons/audio-controls/voice-chat-volume-up.svg',
  // camera-cycle
  'packages/icons/camera-cycle/camera-next.svg',
  'packages/icons/camera-cycle/camera-previous.svg',
  'packages/icons/camera-cycle/car-next.svg',
  'packages/icons/camera-cycle/car-previous.svg',
  'packages/icons/camera-cycle/driving-next.svg',
  'packages/icons/camera-cycle/driving-previous.svg',
  'packages/icons/camera-cycle/sub-camera-next.svg',
  'packages/icons/camera-cycle/sub-camera-previous.svg',
  // cockpit-misc
  'packages/icons/cockpit-misc/dash-page-1-decrease.svg',
  'packages/icons/cockpit-misc/dash-page-1-increase.svg',
  'packages/icons/cockpit-misc/dash-page-2-decrease.svg',
  'packages/icons/cockpit-misc/dash-page-2-increase.svg',
  'packages/icons/cockpit-misc/ffb-max-force-decrease.svg',
  'packages/icons/cockpit-misc/ffb-max-force-increase.svg',
  'packages/icons/cockpit-misc/toggle-wipers.svg',
  // fuel-service
  'packages/icons/fuel-service/add-fuel.svg',
  'packages/icons/fuel-service/clear-fuel.svg',
  'packages/icons/fuel-service/lap-margin-decrease.svg',
  'packages/icons/fuel-service/lap-margin-increase.svg',
  'packages/icons/fuel-service/reduce-fuel.svg',
  'packages/icons/fuel-service/set-fuel-amount.svg',
  'packages/icons/fuel-service/toggle-autofuel.svg',
  // media-capture
  'packages/icons/media-capture/start-stop-video.svg',
  // pit-quick-actions
  'packages/icons/pit-quick-actions/clear-all-checkboxes.svg',
  // setup-aero
  'packages/icons/setup-aero/front-wing-decrease.svg',
  'packages/icons/setup-aero/front-wing-increase.svg',
  'packages/icons/setup-aero/rear-wing-decrease.svg',
  'packages/icons/setup-aero/rear-wing-increase.svg',
  'packages/icons/setup-aero/rf-brake-attached.svg',
  // setup-brakes
  'packages/icons/setup-brakes/abs-adjust-decrease.svg',
  'packages/icons/setup-brakes/abs-adjust-increase.svg',
  'packages/icons/setup-brakes/abs-toggle.svg',
  'packages/icons/setup-brakes/brake-bias-decrease.svg',
  'packages/icons/setup-brakes/brake-bias-fine-decrease.svg',
  'packages/icons/setup-brakes/brake-bias-fine-increase.svg',
  'packages/icons/setup-brakes/brake-bias-increase.svg',
  'packages/icons/setup-brakes/brake-misc-decrease.svg',
  'packages/icons/setup-brakes/brake-misc-increase.svg',
  'packages/icons/setup-brakes/engine-braking-decrease.svg',
  'packages/icons/setup-brakes/engine-braking-increase.svg',
  // setup-chassis
  'packages/icons/setup-chassis/differential-entry-decrease.svg',
  'packages/icons/setup-chassis/differential-entry-increase.svg',
  'packages/icons/setup-chassis/differential-exit-decrease.svg',
  'packages/icons/setup-chassis/differential-exit-increase.svg',
  'packages/icons/setup-chassis/differential-middle-decrease.svg',
  'packages/icons/setup-chassis/differential-middle-increase.svg',
  'packages/icons/setup-chassis/differential-preload-decrease.svg',
  'packages/icons/setup-chassis/differential-preload-increase.svg',
  'packages/icons/setup-chassis/front-arb-decrease.svg',
  'packages/icons/setup-chassis/front-arb-increase.svg',
  'packages/icons/setup-chassis/left-spring-decrease.svg',
  'packages/icons/setup-chassis/left-spring-increase.svg',
  'packages/icons/setup-chassis/lf-shock-decrease.svg',
  'packages/icons/setup-chassis/lf-shock-increase.svg',
  'packages/icons/setup-chassis/lr-shock-decrease.svg',
  'packages/icons/setup-chassis/lr-shock-increase.svg',
  'packages/icons/setup-chassis/power-steering-decrease.svg',
  'packages/icons/setup-chassis/power-steering-increase.svg',
  'packages/icons/setup-chassis/rear-arb-decrease.svg',
  'packages/icons/setup-chassis/rear-arb-increase.svg',
  'packages/icons/setup-chassis/rf-shock-decrease.svg',
  'packages/icons/setup-chassis/rf-shock-increase.svg',
  'packages/icons/setup-chassis/right-spring-decrease.svg',
  'packages/icons/setup-chassis/right-spring-increase.svg',
  'packages/icons/setup-chassis/rr-shock-decrease.svg',
  'packages/icons/setup-chassis/rr-shock-increase.svg',
  // setup-engine
  'packages/icons/setup-engine/boost-level-decrease.svg',
  'packages/icons/setup-engine/boost-level-increase.svg',
  'packages/icons/setup-engine/engine-power-decrease.svg',
  'packages/icons/setup-engine/engine-power-increase.svg',
  'packages/icons/setup-engine/launch-rpm-decrease.svg',
  'packages/icons/setup-engine/launch-rpm-increase.svg',
  'packages/icons/setup-engine/throttle-shaping-decrease.svg',
  'packages/icons/setup-engine/throttle-shaping-increase.svg',
  // setup-fuel
  'packages/icons/setup-fuel/disable-fuel-cut.svg',
  'packages/icons/setup-fuel/fuel-cut-position-decrease.svg',
  'packages/icons/setup-fuel/fuel-cut-position-increase.svg',
  'packages/icons/setup-fuel/fuel-mixture-decrease.svg',
  'packages/icons/setup-fuel/fuel-mixture-increase.svg',
  // setup-hybrid
  'packages/icons/setup-hybrid/hys-boost.svg',
  'packages/icons/setup-hybrid/hys-regen.svg',
  'packages/icons/setup-hybrid/mguk-deploy-mode-decrease.svg',
  'packages/icons/setup-hybrid/mguk-deploy-mode-increase.svg',
  'packages/icons/setup-hybrid/mguk-fixed-deploy-decrease.svg',
  'packages/icons/setup-hybrid/mguk-fixed-deploy-increase.svg',
  'packages/icons/setup-hybrid/mguk-regen-gain-decrease.svg',
  'packages/icons/setup-hybrid/mguk-regen-gain-increase.svg',
  // setup-traction
  'packages/icons/setup-traction/tc-slot-1-decrease.svg',
  'packages/icons/setup-traction/tc-slot-1-increase.svg',
  'packages/icons/setup-traction/tc-slot-2-decrease.svg',
  'packages/icons/setup-traction/tc-slot-2-increase.svg',
  'packages/icons/setup-traction/tc-slot-3-decrease.svg',
  'packages/icons/setup-traction/tc-slot-3-increase.svg',
  'packages/icons/setup-traction/tc-slot-4-decrease.svg',
  'packages/icons/setup-traction/tc-slot-4-increase.svg',
  'packages/icons/setup-traction/tc-toggle.svg',
  // splits-delta-cycle
  'packages/icons/splits-delta-cycle/active-reset-run.svg',
  'packages/icons/splits-delta-cycle/active-reset-set.svg',
  'packages/icons/splits-delta-cycle/custom-sector-end.svg',
  'packages/icons/splits-delta-cycle/custom-sector-start.svg',
  'packages/icons/splits-delta-cycle/next.svg',
  'packages/icons/splits-delta-cycle/previous.svg',
  // telemetry-control
  'packages/icons/telemetry-control/mark-event.svg',
  'packages/icons/telemetry-control/restart-recording.svg',
  'packages/icons/telemetry-control/start-recording.svg',
  'packages/icons/telemetry-control/toggle-logging.svg',
  // tire-service
  'packages/icons/tire-service/change-all-tires.svg',
  'packages/icons/tire-service/clear-tires.svg',
  // toggle-ui-elements
  'packages/icons/toggle-ui-elements/display-ref-car.svg',
  'packages/icons/toggle-ui-elements/fps-network-display.svg',
  'packages/icons/toggle-ui-elements/speed-gear-pedals.svg',
  'packages/icons/toggle-ui-elements/weather-radar.svg',
];

let updated = 0;
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const descMatch = content.match(/<desc>(.*?)<\/desc>/s);
  if (!descMatch) { console.log('SKIP (no desc):', file); continue; }
  try {
    const meta = JSON.parse(descMatch[1]);
    if (meta.locked) { console.log('SKIP (already locked):', file); continue; }
    meta.locked = ['graphic1Color'];
    const newDesc = '<desc>' + JSON.stringify(meta) + '</desc>';
    const newContent = content.replace(/<desc>.*?<\/desc>/s, newDesc);
    fs.writeFileSync(file, newContent, 'utf8');
    updated++;
  } catch (e) { console.log('ERROR:', file, e.message); }
}
console.log('Updated', updated, 'files');
"
```

- [ ] **Step 2: Verify a few files were updated correctly**

Spot-check 3 files:

```bash
grep -o '<desc>.*</desc>' packages/icons/audio-controls/master-volume-up.svg
grep -o '<desc>.*</desc>' packages/icons/setup-chassis/front-arb-decrease.svg
grep -o '<desc>.*</desc>' packages/icons/splits-delta-cycle/next.svg
```

Expected: each shows `"locked":["graphic1Color"]` in the JSON.

- [ ] **Step 3: Regenerate preview files**

```bash
node scripts/generate-icon-previews.mjs
```

- [ ] **Step 4: Run the preview freshness test**

```bash
pnpm test -- --reporter=verbose packages/icons
```

Expected: PASS (previews match updated templates)

- [ ] **Step 5: Commit**

```bash
git add packages/icons/
git commit -m "feat(icons): add locked graphic1Color metadata to 120 icons with semantic colors (#225)"
```

---

### Task 4: Update documentation

**Files:**
- Modify: `.claude/rules/icons.md:71-78`

- [ ] **Step 1: Update the Resolution chain section in icons.md**

Replace lines 71-78 in `.claude/rules/icons.md` (the "Resolution chain" section):

```markdown
### Resolution chain

Colors resolve at render time via `resolveIconColors()`:

1. **Per-action override** — user sets in Color Overrides PI section
2. **Global default** — user sets in Global Settings PI section (skipped for locked slots)
3. **Icon `<desc>` default** — fallback from SVG metadata

### Locked slots

Icons can declare slots as `"locked"` in their `<desc>` metadata to protect them from global color overrides:

```json
{"colors":{"backgroundColor":"#3a4a5a","graphic1Color":"#ffffff"},"locked":["graphic1Color"]}
```

- Locked slots skip the global default step — they use the icon default unless the user sets a per-action override
- Use `"locked"` when an icon mixes a colorizable slot (e.g., white outlines via `{{graphic1Color}}`) with hardcoded semantic colors (green arrows, red indicators) that would visually clash under global presets
- Omitting `"locked"` or using `[]` means all slots are globally overridable (backward compatible)
```

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/icons.md
git commit -m "docs(icons): document locked color slots in icons.md (#225)"
```

---

### Task 5: Build and final verification

- [ ] **Step 1: Build the project**

```bash
pnpm install && pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: ALL PASS

- [ ] **Step 3: Run lint and format**

```bash
pnpm lint:fix && pnpm format:fix
```

Expected: No errors. If there are auto-fixed changes, stage and amend the relevant commit.
