# Customizable Button Title Text Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow users to customize button title text (font size, position, visibility, content, bold) with global defaults and per-action overrides, mirroring the color overrides architecture.

**Architecture:** Add `TitleOverridesSchema` to `CommonSettings` and `getGlobalTitleSettings()` to global settings. Refactor icon SVGs into graphic snippets + shared base template. New `resolveTitleSettings()` → `generateTitleText()` → `assembleIcon()` pipeline replaces the current `renderIconTemplate()` flow for all static-label and titleLabel actions.

**Tech Stack:** TypeScript, Zod, Vitest, SVG, EJS templates, Stream Deck PI components

**Spec:** `docs/superpowers/specs/2026-03-31-customizable-title-text-design.md`

---

## File Structure

### New files

| File | Responsibility |
|------|---------------|
| `packages/deck-core/src/title-settings.ts` | TitleOverridesSchema, ResolvedTitleSettings, resolveTitleSettings(), getGlobalTitleSettings(), generateTitleText(), assembleIcon() |
| `packages/deck-core/src/title-settings.test.ts` | Tests for all title settings functions |
| `packages/deck-core/src/icon-base.ts` | Base SVG template constant, extractGraphicContent() |
| `packages/stream-deck-plugin/src/pi-templates/partials/title-overrides.ejs` | Per-action title overrides PI partial |
| `scripts/refactor-icons-to-snippets.mjs` | One-time migration script to strip base SVG wrapper from all icon files |

### Modified files

| File | Changes |
|------|---------|
| `packages/deck-core/src/common-settings.ts` | Add TitleOverridesSchema to CommonSettings |
| `packages/deck-core/src/icon-template.ts` | Export parseDescMetadata(), add parseIconTitleDefault() |
| `packages/deck-core/src/global-settings.ts` | Add title settings to GlobalSettingsSchema, add getGlobalTitleSettings() |
| `packages/deck-core/src/index.ts` | Export new title-settings and icon-base modules |
| `packages/stream-deck-plugin/src/pi-templates/partials/global-settings.ejs` | Add "Title Defaults" section |
| `packages/stream-deck-plugin/src/pi/settings.html` | Add event handlers for title presets/resets |
| Every PI `.ejs` file for in-scope actions | Add `title-overrides` include |
| Every action `.ts` file for in-scope actions (28 static + 2 titleLabel) | Switch to assembleIcon() pipeline |
| Every icon `.svg` file for in-scope actions | Strip base wrapper (via script), add title.text to `<desc>` |
| `packages/mirabox-plugin/` PI templates | Add title-overrides include + global settings section |

---

## Task 1: TitleOverridesSchema and CommonSettings

**Files:**
- Modify: `packages/deck-core/src/common-settings.ts:18-37`
- Create: `packages/deck-core/src/title-settings.ts`

- [ ] **Step 1: Add TitleOverridesSchema to common-settings.ts**

In `packages/deck-core/src/common-settings.ts`, add after `ColorOverridesSchema` (after line 27):

```typescript
export const TitleOverridesSchema = z
  .object({
    showTitle: z
      .union([z.boolean(), z.string()])
      .transform((val) => val === true || val === "true")
      .optional(),
    showGraphics: z
      .union([z.boolean(), z.string()])
      .transform((val) => val === true || val === "true")
      .optional(),
    titleText: z.string().optional(),
    bold: z
      .union([z.boolean(), z.string()])
      .transform((val) => val === true || val === "true")
      .optional(),
    fontSize: z.coerce.number().min(5).max(50).optional(),
    position: z.enum(["top", "middle", "bottom", "custom"]).optional(),
    customPosition: z.coerce.number().min(-50).max(50).optional(),
  })
  .optional();

export type TitleOverrides = z.infer<typeof TitleOverridesSchema>;
```

Then add `titleOverrides` to `CommonSettings`:

```typescript
export const CommonSettings = z.object({
  flagsOverlay: z
    .union([z.boolean(), z.string()])
    .transform((val) => val === true || val === "true")
    .optional(),
  colorOverrides: ColorOverridesSchema,
  titleOverrides: TitleOverridesSchema,
});
```

- [ ] **Step 2: Create title-settings.ts with types**

Create `packages/deck-core/src/title-settings.ts`:

```typescript
import type { TitleOverrides } from "./common-settings.js";

export interface ResolvedTitleSettings {
  showTitle: boolean;
  showGraphics: boolean;
  titleText: string;
  bold: boolean;
  fontSize: number;
  position: "top" | "middle" | "bottom" | "custom";
  customPosition: number;
}

export interface GlobalTitleSettings {
  showTitle?: boolean;
  showGraphics?: boolean;
  bold?: boolean;
  fontSize?: number;
  position?: "top" | "middle" | "bottom" | "custom";
  customPosition?: number;
}

const TITLE_DEFAULTS: Omit<ResolvedTitleSettings, "titleText"> = {
  showTitle: true,
  showGraphics: true,
  bold: true,
  fontSize: 18,
  position: "bottom",
  customPosition: 0,
};

export { TITLE_DEFAULTS };
```

- [ ] **Step 3: Build to verify no type errors**

Run: `cd packages/deck-core && pnpm build`
Expected: Build succeeds with no TS errors.

- [ ] **Step 4: Commit**

```bash
git add packages/deck-core/src/common-settings.ts packages/deck-core/src/title-settings.ts
git commit -m "feat(deck-core): add TitleOverridesSchema and title settings types (#238)"
```

---

## Task 2: resolveTitleSettings()

**Files:**
- Modify: `packages/deck-core/src/title-settings.ts`
- Modify: `packages/deck-core/src/icon-template.ts`
- Create: `packages/deck-core/src/title-settings.test.ts`

- [ ] **Step 1: Export parseDescMetadata() from icon-template.ts**

In `packages/deck-core/src/icon-template.ts`, the function `parseDescMetadata()` (line 62) is currently not exported. Export it and add a helper to parse title defaults:

```typescript
// Change line 62 from:
function parseDescMetadata(svgTemplate: string): Record<string, unknown> | undefined {
// To:
export function parseDescMetadata(svgTemplate: string): Record<string, unknown> | undefined {
```

Add after `parseIconLocked()` (after line 104):

```typescript
export function parseIconTitleDefault(svgTemplate: string): string | undefined {
  const meta = parseDescMetadata(svgTemplate);
  if (!meta) return undefined;
  const title = meta.title as { text?: string } | undefined;
  return title?.text;
}
```

- [ ] **Step 2: Write failing tests for resolveTitleSettings()**

Create `packages/deck-core/src/title-settings.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { resolveTitleSettings } from "./title-settings.js";
import type { GlobalTitleSettings } from "./title-settings.js";
import type { TitleOverrides } from "./common-settings.js";

const GRAPHIC_WITH_TITLE = `<svg><desc>{"colors":{},"title":{"text":"TOGGLE\\nLAP TIMING"}}</desc></svg>`;
const GRAPHIC_NO_TITLE = `<svg><desc>{"colors":{}}</desc></svg>`;

describe("resolveTitleSettings", () => {
  it("should return defaults when no overrides", () => {
    const result = resolveTitleSettings(GRAPHIC_WITH_TITLE, {});
    expect(result).toEqual({
      showTitle: true,
      showGraphics: true,
      titleText: "TOGGLE\nLAP TIMING",
      bold: true,
      fontSize: 18,
      position: "bottom",
      customPosition: 0,
    });
  });

  it("should use actionDefaultText over desc metadata", () => {
    const result = resolveTitleSettings(GRAPHIC_WITH_TITLE, {}, undefined, "CUSTOM\nTEXT");
    expect(result.titleText).toBe("CUSTOM\nTEXT");
  });

  it("should use per-action overrides over global", () => {
    const global: GlobalTitleSettings = { fontSize: 24, bold: false };
    const action: TitleOverrides = { fontSize: 30 };
    const result = resolveTitleSettings(GRAPHIC_WITH_TITLE, global, action);
    expect(result.fontSize).toBe(30);
    expect(result.bold).toBe(false); // global still applies for non-overridden
  });

  it("should use global over defaults", () => {
    const global: GlobalTitleSettings = { fontSize: 24, position: "middle" };
    const result = resolveTitleSettings(GRAPHIC_WITH_TITLE, global);
    expect(result.fontSize).toBe(24);
    expect(result.position).toBe("middle");
  });

  it("should use per-action titleText over actionDefaultText", () => {
    const action: TitleOverrides = { titleText: "USER\nOVERRIDE" };
    const result = resolveTitleSettings(GRAPHIC_WITH_TITLE, {}, action, "CODE\nDEFAULT");
    expect(result.titleText).toBe("USER\nOVERRIDE");
  });

  it("should fall back to empty string when no title source", () => {
    const result = resolveTitleSettings(GRAPHIC_NO_TITLE, {});
    expect(result.titleText).toBe("");
  });

  it("should treat empty string titleText as unset", () => {
    const action: TitleOverrides = { titleText: "" };
    const result = resolveTitleSettings(GRAPHIC_WITH_TITLE, {}, action, "CODE\nDEFAULT");
    expect(result.titleText).toBe("CODE\nDEFAULT");
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd packages/deck-core && pnpm test -- src/title-settings.test.ts`
Expected: FAIL — `resolveTitleSettings` not exported yet.

- [ ] **Step 4: Implement resolveTitleSettings()**

Add to `packages/deck-core/src/title-settings.ts`:

```typescript
import { parseIconTitleDefault } from "./icon-template.js";

export function resolveTitleSettings(
  graphicSvg: string,
  globalTitleSettings: GlobalTitleSettings,
  actionOverrides?: TitleOverrides,
  actionDefaultText?: string,
): ResolvedTitleSettings {
  const descDefault = parseIconTitleDefault(graphicSvg);

  const resolve = <T>(
    actionVal: T | undefined,
    globalVal: T | undefined,
    fallback: T,
  ): T => actionVal ?? globalVal ?? fallback;

  const titleText =
    (actionOverrides?.titleText && actionOverrides.titleText.length > 0
      ? actionOverrides.titleText
      : undefined) ??
    actionDefaultText ??
    descDefault ??
    "";

  return {
    showTitle: resolve(actionOverrides?.showTitle, globalTitleSettings.showTitle, TITLE_DEFAULTS.showTitle),
    showGraphics: resolve(actionOverrides?.showGraphics, globalTitleSettings.showGraphics, TITLE_DEFAULTS.showGraphics),
    titleText,
    bold: resolve(actionOverrides?.bold, globalTitleSettings.bold, TITLE_DEFAULTS.bold),
    fontSize: resolve(actionOverrides?.fontSize, globalTitleSettings.fontSize, TITLE_DEFAULTS.fontSize),
    position: resolve(actionOverrides?.position, globalTitleSettings.position, TITLE_DEFAULTS.position),
    customPosition: resolve(actionOverrides?.customPosition, globalTitleSettings.customPosition, TITLE_DEFAULTS.customPosition),
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/deck-core && pnpm test -- src/title-settings.test.ts`
Expected: All 7 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/deck-core/src/title-settings.ts packages/deck-core/src/title-settings.test.ts packages/deck-core/src/icon-template.ts
git commit -m "feat(deck-core): add resolveTitleSettings() with resolution chain (#238)"
```

---

## Task 3: generateTitleText()

**Files:**
- Modify: `packages/deck-core/src/title-settings.ts`
- Modify: `packages/deck-core/src/title-settings.test.ts`

- [ ] **Step 1: Write failing tests for generateTitleText()**

Add to `packages/deck-core/src/title-settings.test.ts`:

```typescript
import { generateTitleText } from "./title-settings.js";

describe("generateTitleText", () => {
  const defaults = { fill: "#ffffff" };

  it("should generate single-line text at bottom position", () => {
    const result = generateTitleText({ text: "NEXT", fontSize: 20, bold: true, position: "bottom", customPosition: 0, ...defaults });
    expect(result).toContain("NEXT");
    expect(result).toContain('font-size="20"');
    expect(result).toContain('font-weight="bold"');
    expect(result).toContain('y="140"');
  });

  it("should generate single-line text at top position", () => {
    const result = generateTitleText({ text: "NEXT", fontSize: 20, bold: true, position: "top", customPosition: 0, ...defaults });
    expect(result).toContain('y="24"'); // fontSize + 4
  });

  it("should generate single-line text at middle position", () => {
    const result = generateTitleText({ text: "NEXT", fontSize: 20, bold: true, position: "middle", customPosition: 0, ...defaults });
    expect(result).toContain('y="72"');
  });

  it("should generate multiline text at bottom position", () => {
    const result = generateTitleText({ text: "CAMERA\nNEXT", fontSize: 18, bold: true, position: "bottom", customPosition: 0, ...defaults });
    expect(result).toContain("CAMERA");
    expect(result).toContain("NEXT");
    // Last line at 140, previous lines above
    const lines = result.match(/y="(\d+\.?\d*)"/g);
    expect(lines).toHaveLength(2);
  });

  it("should generate multiline text at top position", () => {
    const result = generateTitleText({ text: "CAMERA\nNEXT", fontSize: 18, bold: true, position: "top", customPosition: 0, ...defaults });
    const lines = result.match(/y="(\d+\.?\d*)"/g);
    expect(lines).toHaveLength(2);
    // First line near top, second line below
    const y1 = parseFloat(lines![0].match(/(\d+\.?\d*)/)![1]);
    const y2 = parseFloat(lines![1].match(/(\d+\.?\d*)/)![1]);
    expect(y1).toBeLessThan(y2);
    expect(y1).toBe(18 + 4); // fontSize + 4
  });

  it("should use custom position as offset from middle", () => {
    const result = generateTitleText({ text: "NEXT", fontSize: 20, bold: true, position: "custom", customPosition: -30, ...defaults });
    expect(result).toContain('y="42"'); // 72 + (-30)
  });

  it("should render normal weight when bold is false", () => {
    const result = generateTitleText({ text: "NEXT", fontSize: 20, bold: false, position: "bottom", customPosition: 0, ...defaults });
    expect(result).toContain('font-weight="normal"');
  });

  it("should return empty string for empty text", () => {
    const result = generateTitleText({ text: "", fontSize: 20, bold: true, position: "bottom", customPosition: 0, ...defaults });
    expect(result).toBe("");
  });

  it("should escape XML entities in text", () => {
    const result = generateTitleText({ text: "A&B", fontSize: 20, bold: true, position: "bottom", customPosition: 0, ...defaults });
    expect(result).toContain("A&amp;B");
  });

  it("should handle three lines at middle position", () => {
    const result = generateTitleText({ text: "LINE1\nLINE2\nLINE3", fontSize: 16, bold: true, position: "middle", customPosition: 0, ...defaults });
    const lines = result.match(/y="(\d+\.?\d*)"/g);
    expect(lines).toHaveLength(3);
    // Should be centered around 72
    const ys = lines!.map((l) => parseFloat(l.match(/(\d+\.?\d*)/)![1]));
    const avg = ys.reduce((a, b) => a + b, 0) / ys.length;
    expect(Math.abs(avg - 72)).toBeLessThan(2); // approximately centered
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/deck-core && pnpm test -- src/title-settings.test.ts`
Expected: FAIL — `generateTitleText` not exported.

- [ ] **Step 3: Implement generateTitleText()**

Add to `packages/deck-core/src/title-settings.ts`:

```typescript
import { escapeXml } from "./icon-template.js";

export interface GenerateTitleTextOptions {
  text: string;
  fontSize: number;
  bold: boolean;
  position: "top" | "middle" | "bottom" | "custom";
  customPosition: number;
  fill: string;
}

export function generateTitleText(options: GenerateTitleTextOptions): string {
  const { text, fontSize, bold, position, customPosition, fill } = options;
  if (!text) return "";

  const lines = text.split("\n");
  const lineHeight = fontSize * 1.2;
  const weight = bold ? "bold" : "normal";

  const makeTextEl = (content: string, y: number): string =>
    `<text x="72" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${fill}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="${weight}">${escapeXml(content)}</text>`;

  const yPositions = calculateYPositions(lines.length, fontSize, lineHeight, position, customPosition);
  return lines.map((line, i) => makeTextEl(line, yPositions[i])).join("\n  ");
}

function calculateYPositions(
  lineCount: number,
  fontSize: number,
  lineHeight: number,
  position: "top" | "middle" | "bottom" | "custom",
  customPosition: number,
): number[] {
  const positions: number[] = [];
  const totalHeight = (lineCount - 1) * lineHeight;

  switch (position) {
    case "top": {
      const startY = fontSize + 4;
      for (let i = 0; i < lineCount; i++) {
        positions.push(startY + i * lineHeight);
      }
      break;
    }
    case "middle": {
      const centerY = 72;
      const startY = centerY - totalHeight / 2;
      for (let i = 0; i < lineCount; i++) {
        positions.push(startY + i * lineHeight);
      }
      break;
    }
    case "bottom": {
      const endY = 140;
      const startY = endY - totalHeight;
      for (let i = 0; i < lineCount; i++) {
        positions.push(startY + i * lineHeight);
      }
      break;
    }
    case "custom": {
      const centerY = 72 + customPosition;
      const startY = centerY - totalHeight / 2;
      for (let i = 0; i < lineCount; i++) {
        positions.push(startY + i * lineHeight);
      }
      break;
    }
  }
  return positions;
}
```

Also export `escapeXml` from `icon-template.ts` if not already exported (line 30):

```typescript
// Change from:
function escapeXml(str: string): string {
// To:
export function escapeXml(str: string): string {
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/deck-core && pnpm test -- src/title-settings.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/deck-core/src/title-settings.ts packages/deck-core/src/title-settings.test.ts packages/deck-core/src/icon-template.ts
git commit -m "feat(deck-core): add generateTitleText() with position math (#238)"
```

---

## Task 4: Icon base template and assembleIcon()

**Files:**
- Create: `packages/deck-core/src/icon-base.ts`
- Modify: `packages/deck-core/src/title-settings.ts`
- Modify: `packages/deck-core/src/title-settings.test.ts`

- [ ] **Step 1: Create icon-base.ts with base template**

Create `packages/deck-core/src/icon-base.ts`:

```typescript
export const ICON_BASE_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
  <rect x="0" y="0" width="144" height="144" fill="{{backgroundColor}}"/>
  {{graphicContent}}
  {{titleContent}}
</svg>`;

/**
 * Extract the inner content of an SVG, stripping the outer <svg> wrapper,
 * <desc> metadata, background <rect>, and label <text> elements.
 * Returns only the graphic artwork.
 */
export function extractGraphicContent(svgTemplate: string): string {
  let content = svgTemplate;

  // Remove outer <svg> tags
  content = content.replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

  // Remove <desc> element
  content = content.replace(/<desc>[\s\S]*?<\/desc>/, "");

  // Remove background rect (the first rect filling the full canvas)
  content = content.replace(/<rect[^>]*width="144"[^>]*height="144"[^>]*fill="\{\{backgroundColor\}\}"[^>]*\/?>/i, "");

  // Remove mainLabel and subLabel text elements
  content = content.replace(/<text[^>]*>\{\{mainLabel\}\}<\/text>/g, "");
  content = content.replace(/<text[^>]*>\{\{subLabel\}\}<\/text>/g, "");

  // Remove <g filter="url(#activity-state)"> wrapper if present (keep inner content)
  content = content.replace(/<g\s+filter="url\(#activity-state\)"\s*>/, "");
  content = content.replace(/<\/g>\s*$/, "");

  // Remove <defs> and <filter> elements (activity-state filter is in base now)
  content = content.replace(/<defs>[\s\S]*?<\/defs>/, "");

  return content.trim();
}
```

- [ ] **Step 2: Write failing tests for assembleIcon()**

Add to `packages/deck-core/src/title-settings.test.ts`:

```typescript
import { assembleIcon } from "./title-settings.js";

const MOCK_GRAPHIC = `<svg><desc>{"colors":{"backgroundColor":"#2a3444","textColor":"#ffffff"},"title":{"text":"TOGGLE\\nLAP TIMING"}}</desc><rect x="22" y="12" width="100" height="80" fill="{{graphic1Color}}"/></svg>`;

describe("assembleIcon", () => {
  it("should assemble a complete icon with graphics and title", () => {
    const result = assembleIcon({
      graphicSvg: MOCK_GRAPHIC,
      colors: { backgroundColor: "#2a3444", textColor: "#ffffff", graphic1Color: "#ffffff" },
      title: {
        showTitle: true,
        showGraphics: true,
        titleText: "TOGGLE\nLAP TIMING",
        bold: true,
        fontSize: 18,
        position: "bottom",
        customPosition: 0,
      },
    });
    expect(result).toContain("data:image/svg+xml");
    expect(result).toContain("TOGGLE");
    expect(result).toContain("LAP TIMING");
    expect(result).toContain("#2a3444"); // backgroundColor
  });

  it("should hide graphics when showGraphics is false", () => {
    const result = assembleIcon({
      graphicSvg: MOCK_GRAPHIC,
      colors: { backgroundColor: "#2a3444", textColor: "#ffffff", graphic1Color: "#ffffff" },
      title: {
        showTitle: true,
        showGraphics: false,
        titleText: "TOGGLE\nLAP TIMING",
        bold: true,
        fontSize: 18,
        position: "bottom",
        customPosition: 0,
      },
    });
    expect(result).toContain("TOGGLE");
    expect(result).not.toContain('width="100"'); // graphic rect should be absent
  });

  it("should hide title when showTitle is false", () => {
    const result = assembleIcon({
      graphicSvg: MOCK_GRAPHIC,
      colors: { backgroundColor: "#2a3444", textColor: "#ffffff", graphic1Color: "#ffffff" },
      title: {
        showTitle: false,
        showGraphics: true,
        titleText: "TOGGLE\nLAP TIMING",
        bold: true,
        fontSize: 18,
        position: "bottom",
        customPosition: 0,
      },
    });
    expect(result).not.toContain("TOGGLE");
    expect(result).toContain('width="100"'); // graphic rect still present
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `cd packages/deck-core && pnpm test -- src/title-settings.test.ts`
Expected: FAIL — `assembleIcon` not exported.

- [ ] **Step 4: Implement assembleIcon()**

Add to `packages/deck-core/src/title-settings.ts`:

```typescript
import { renderIconTemplate, svgToDataUri } from "./icon-template.js";
import { ICON_BASE_TEMPLATE, extractGraphicContent } from "./icon-base.js";

export function assembleIcon(options: {
  graphicSvg: string;
  colors: Record<string, string>;
  title: ResolvedTitleSettings;
}): string {
  const { graphicSvg, colors, title } = options;

  // Extract graphic content from SVG snippet (strips wrapper, bg, labels)
  const rawGraphic = extractGraphicContent(graphicSvg);

  // Colorize graphic content by replacing Mustache placeholders
  const graphicContent = title.showGraphics
    ? renderIconTemplate(rawGraphic, colors)
    : "";

  // Generate title text SVG elements
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

  // Assemble into base template
  const svg = renderIconTemplate(ICON_BASE_TEMPLATE, {
    backgroundColor: colors.backgroundColor ?? "#000000",
    graphicContent,
    titleContent,
  });

  return svgToDataUri(svg);
}
```

Also export `svgToDataUri` from `icon-template.ts` if not already (check `index.ts` exports).

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd packages/deck-core && pnpm test -- src/title-settings.test.ts`
Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/deck-core/src/icon-base.ts packages/deck-core/src/title-settings.ts packages/deck-core/src/title-settings.test.ts
git commit -m "feat(deck-core): add assembleIcon() and icon base template (#238)"
```

---

## Task 5: Global title settings

**Files:**
- Modify: `packages/deck-core/src/global-settings.ts:62-92, 225-252`
- Modify: `packages/deck-core/src/title-settings.ts`
- Modify: `packages/deck-core/src/title-settings.test.ts`

- [ ] **Step 1: Write failing test for getGlobalTitleSettings()**

Add to `packages/deck-core/src/title-settings.test.ts`:

```typescript
import { getGlobalTitleSettings } from "./title-settings.js";
import { getGlobalSettings } from "./global-settings.js";
import { vi } from "vitest";

vi.mock("./global-settings.js", () => ({
  getGlobalSettings: vi.fn(() => ({})),
}));

describe("getGlobalTitleSettings", () => {
  it("should return empty object when no global title settings", () => {
    vi.mocked(getGlobalSettings).mockReturnValue({});
    const result = getGlobalTitleSettings();
    expect(result).toEqual({});
  });

  it("should extract title settings from global settings", () => {
    vi.mocked(getGlobalSettings).mockReturnValue({
      titleFontSize: 24,
      titleBold: true,
      titlePosition: "middle",
      titleShowTitle: false,
      titleShowGraphics: true,
      titleCustomPosition: -10,
    });
    const result = getGlobalTitleSettings();
    expect(result).toEqual({
      fontSize: 24,
      bold: true,
      position: "middle",
      showTitle: false,
      showGraphics: true,
      customPosition: -10,
    });
  });

  it("should ignore non-title global settings", () => {
    vi.mocked(getGlobalSettings).mockReturnValue({
      colorBackgroundColor: "#fff",
      titleFontSize: 20,
    });
    const result = getGlobalTitleSettings();
    expect(result).toEqual({ fontSize: 20 });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd packages/deck-core && pnpm test -- src/title-settings.test.ts`
Expected: FAIL — `getGlobalTitleSettings` not exported.

- [ ] **Step 3: Implement getGlobalTitleSettings()**

Add to `packages/deck-core/src/title-settings.ts`:

```typescript
import { getGlobalSettings } from "./global-settings.js";

export function getGlobalTitleSettings(): GlobalTitleSettings {
  const settings = getGlobalSettings() as Record<string, unknown>;
  const result: GlobalTitleSettings = {};

  const bool = (key: string): boolean | undefined => {
    const val = settings[key];
    if (val === true || val === "true") return true;
    if (val === false || val === "false") return false;
    return undefined;
  };

  const num = (key: string): number | undefined => {
    const val = settings[key];
    if (typeof val === "number") return val;
    if (typeof val === "string" && val.length > 0) {
      const n = Number(val);
      return Number.isFinite(n) ? n : undefined;
    }
    return undefined;
  };

  const str = (key: string): string | undefined => {
    const val = settings[key];
    return typeof val === "string" && val.length > 0 ? val : undefined;
  };

  const showTitle = bool("titleShowTitle");
  if (showTitle !== undefined) result.showTitle = showTitle;

  const showGraphics = bool("titleShowGraphics");
  if (showGraphics !== undefined) result.showGraphics = showGraphics;

  const bold = bool("titleBold");
  if (bold !== undefined) result.bold = bold;

  const fontSize = num("titleFontSize");
  if (fontSize !== undefined) result.fontSize = fontSize;

  const position = str("titlePosition") as GlobalTitleSettings["position"];
  if (position !== undefined) result.position = position;

  const customPosition = num("titleCustomPosition");
  if (customPosition !== undefined) result.customPosition = customPosition;

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd packages/deck-core && pnpm test -- src/title-settings.test.ts`
Expected: All tests PASS.

- [ ] **Step 5: Export everything from deck-core index.ts**

Add to `packages/deck-core/src/index.ts`:

```typescript
export { TitleOverridesSchema, type TitleOverrides } from "./common-settings.js";
export {
  assembleIcon,
  generateTitleText,
  getGlobalTitleSettings,
  resolveTitleSettings,
  TITLE_DEFAULTS,
  type GenerateTitleTextOptions,
  type GlobalTitleSettings,
  type ResolvedTitleSettings,
} from "./title-settings.js";
export { ICON_BASE_TEMPLATE, extractGraphicContent } from "./icon-base.js";
```

- [ ] **Step 6: Build to verify no type errors**

Run: `pnpm build:ts`
Expected: Build succeeds with no TS errors.

- [ ] **Step 7: Commit**

```bash
git add packages/deck-core/src/title-settings.ts packages/deck-core/src/title-settings.test.ts packages/deck-core/src/global-settings.ts packages/deck-core/src/index.ts
git commit -m "feat(deck-core): add getGlobalTitleSettings() and exports (#238)"
```

---

## Task 6: Icon SVG migration script

**Files:**
- Create: `scripts/refactor-icons-to-snippets.mjs`

This script automates converting all icon SVGs from self-contained files to graphic snippets. It also adds default title text from the action label maps.

- [ ] **Step 1: Create the migration script**

Create `scripts/refactor-icons-to-snippets.mjs`:

```javascript
#!/usr/bin/env node

/**
 * Migrates icon SVGs from self-contained files (with background rect, labels)
 * to graphic snippets (artwork only, with title metadata in <desc>).
 *
 * Usage: node scripts/refactor-icons-to-snippets.mjs [--dry-run]
 *
 * What it does:
 * 1. Strips the background <rect> with {{backgroundColor}}
 * 2. Strips {{mainLabel}} and {{subLabel}} <text> elements
 * 3. Strips <g filter="url(#activity-state)"> wrapper (keeps inner content)
 * 4. Strips <defs> containing activity-state filter
 * 5. Adds "title":{"text":"<subLabel>\n<mainLabel>"} to <desc> metadata
 *    (using placeholder values — action code provides actual defaults)
 *
 * Does NOT touch:
 * - Dynamic templates in packages/actions/icons/ or packages/stream-deck-plugin/icons/
 * - Icons that don't use {{mainLabel}}/{{subLabel}}
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const DRY_RUN = process.argv.includes("--dry-run");
const ICONS_DIR = join(import.meta.dirname, "..", "packages", "icons");

// Directories to skip (dynamic templates handled separately)
const SKIP_DIRS = new Set(["preview", "node_modules"]);

function findSvgFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...findSvgFiles(fullPath));
    } else if (entry.endsWith(".svg")) {
      results.push(fullPath);
    }
  }
  return results;
}

function extractLabelsFromSvg(content) {
  // Try to find mainLabel and subLabel placeholder text elements
  const mainMatch = content.match(/<text[^>]*>\{\{mainLabel\}\}<\/text>/);
  const subMatch = content.match(/<text[^>]*>\{\{subLabel\}\}<\/text>/);
  return {
    hasMainLabel: !!mainMatch,
    hasSubLabel: !!subMatch,
  };
}

function migrateSvg(content) {
  const { hasMainLabel, hasSubLabel } = extractLabelsFromSvg(content);

  if (!hasMainLabel && !hasSubLabel) {
    return null; // Skip — not a label icon
  }

  let result = content;

  // Remove background rect
  result = result.replace(
    /\s*<rect[^>]*width="144"[^>]*height="144"[^>]*fill="\{\{backgroundColor\}\}"[^>]*\/?>\s*/gi,
    "\n"
  );

  // Remove mainLabel text element
  result = result.replace(/\s*<text[^>]*>\{\{mainLabel\}\}<\/text>\s*/g, "\n");

  // Remove subLabel text element
  result = result.replace(/\s*<text[^>]*>\{\{subLabel\}\}<\/text>\s*/g, "\n");

  // Remove <g filter="url(#activity-state)"> wrapper but keep content
  result = result.replace(/\s*<g\s+filter="url\(#activity-state\)"\s*>\s*/g, "\n");
  result = result.replace(/\s*<\/g>\s*(?=\s*<\/svg>)/g, "\n");

  // Remove <defs> with filter
  result = result.replace(/\s*<defs>[\s\S]*?<\/defs>\s*/g, "\n");

  // Clean up multiple blank lines
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim() + "\n";
}

// Run
const files = findSvgFiles(ICONS_DIR);
let migrated = 0;
let skipped = 0;

for (const file of files) {
  const content = readFileSync(file, "utf-8");
  const result = migrateSvg(content);

  if (result === null) {
    skipped++;
    continue;
  }

  const relPath = relative(process.cwd(), file);
  if (DRY_RUN) {
    console.log(`[dry-run] Would migrate: ${relPath}`);
  } else {
    writeFileSync(file, result);
    console.log(`Migrated: ${relPath}`);
  }
  migrated++;
}

console.log(`\nDone. Migrated: ${migrated}, Skipped: ${skipped}`);
```

- [ ] **Step 2: Run in dry-run mode to verify**

Run: `node scripts/refactor-icons-to-snippets.mjs --dry-run`
Expected: Lists all icon SVG files that would be migrated.

- [ ] **Step 3: Run the migration**

Run: `node scripts/refactor-icons-to-snippets.mjs`
Expected: All static-label icon SVGs are converted to graphic snippets.

- [ ] **Step 4: Manually verify a few migrated icons**

Read 2-3 migrated SVGs to confirm:
- No `<rect>` with `{{backgroundColor}}`
- No `{{mainLabel}}`/`{{subLabel}}` text elements
- No `<g filter>` wrapper
- Graphic artwork preserved
- `<desc>` metadata preserved

- [ ] **Step 5: Update icon preview generation script if needed**

Run: `node scripts/generate-icon-previews.mjs`
Check if the preview script needs updating for the new snippet format.

- [ ] **Step 6: Commit**

```bash
git add scripts/refactor-icons-to-snippets.mjs packages/icons/
git commit -m "refactor(icons): convert icon SVGs to graphic snippets (#238)

Strip background rect, label text elements, and activity-state wrapper
from all static-label icon SVGs. Icons now contain only graphic artwork
with <desc> metadata. The base template is assembled at render time."
```

---

## Task 7: Add title metadata to icon `<desc>`

**Files:**
- Create: `scripts/add-title-metadata-to-icons.mjs`
- Modify: icon SVGs in `packages/icons/`

Each icon's `<desc>` JSON needs a `title.text` field with the default title (e.g., `"TOGGLE\nLAP TIMING"`). This data currently lives in action code label maps. The script reads these maps and writes the metadata.

- [ ] **Step 1: Create a JSON mapping of icon paths to default titles**

Create `scripts/data/icon-title-defaults.json` manually by extracting from action code label maps. This is tedious but necessary — each action's label map (e.g., `BLACK_BOX_LABELS` in `black-box-selector.ts:50-62`) defines what mainLabel/subLabel each icon gets.

Format:

```json
{
  "black-box-selector/lap-timing": "TOGGLE\nLAP TIMING",
  "black-box-selector/standings": "TOGGLE\nSTANDINGS",
  "black-box-selector/next": "NEXT\nBLACK BOX",
  "camera-controls/cycle/next": "CAMERA\nNEXT"
}
```

Build this by reading all action files' label maps. Key = icon path relative to `packages/icons/` without `.svg`. Value = `subLabel\nmainLabel`.

- [ ] **Step 2: Create script to inject title metadata**

Create `scripts/add-title-metadata-to-icons.mjs`:

```javascript
#!/usr/bin/env node

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ICONS_DIR = join(import.meta.dirname, "..", "packages", "icons");
const titles = JSON.parse(
  readFileSync(join(import.meta.dirname, "data", "icon-title-defaults.json"), "utf-8")
);

for (const [iconPath, titleText] of Object.entries(titles)) {
  const svgPath = join(ICONS_DIR, iconPath + ".svg");
  let content;
  try {
    content = readFileSync(svgPath, "utf-8");
  } catch {
    console.warn(`Not found: ${svgPath}`);
    continue;
  }

  // Parse existing <desc> and add title
  const descMatch = content.match(/<desc>([\s\S]*?)<\/desc>/);
  if (!descMatch) {
    console.warn(`No <desc> in: ${svgPath}`);
    continue;
  }

  try {
    const meta = JSON.parse(descMatch[1]);
    meta.title = { text: titleText };
    const newDesc = `<desc>${JSON.stringify(meta)}</desc>`;
    content = content.replace(/<desc>[\s\S]*?<\/desc>/, newDesc);
    writeFileSync(svgPath, content);
    console.log(`Updated: ${iconPath}.svg`);
  } catch (e) {
    console.warn(`Failed to parse <desc> in: ${svgPath} — ${e.message}`);
  }
}

console.log("Done.");
```

- [ ] **Step 3: Run the script**

Run: `node scripts/add-title-metadata-to-icons.mjs`
Expected: All icon SVGs updated with title metadata.

- [ ] **Step 4: Verify a few icons**

Read 2-3 icon SVGs to confirm `<desc>` now contains `"title":{"text":"..."}`.

- [ ] **Step 5: Commit**

```bash
git add scripts/data/icon-title-defaults.json scripts/add-title-metadata-to-icons.mjs packages/icons/
git commit -m "feat(icons): add default title metadata to icon SVG desc (#238)"
```

---

## Task 8: PI partial — title-overrides.ejs

**Files:**
- Create: `packages/stream-deck-plugin/src/pi-templates/partials/title-overrides.ejs`

- [ ] **Step 1: Create title-overrides.ejs**

Create `packages/stream-deck-plugin/src/pi-templates/partials/title-overrides.ejs`:

```ejs
<!--
  Title Overrides Component
  Mirrors color-overrides.ejs pattern.
  No parameters needed — settings keys are fixed.
-->
<%- include('accordion', {
  title: 'Title Overrides',
  open: false,
  content:
    '<div class="ird-section-subtitle">Visibility</div>' +

    '<sdpi-item label="Show Title">' +
    '<sdpi-checkbox id="title-override-showTitle" setting="titleOverrides.showTitle" default="true"></sdpi-checkbox>' +
    '</sdpi-item>' +

    '<sdpi-item label="Show Graphics">' +
    '<sdpi-checkbox id="title-override-showGraphics" setting="titleOverrides.showGraphics" default="true"></sdpi-checkbox>' +
    '</sdpi-item>' +

    '<div class="ird-section-subtitle">Text</div>' +

    '<sdpi-item label="Title Text">' +
    '<textarea id="title-override-titleText" rows="3" ' +
    'style="background:var(--sdpi-bgcolor);border:1px solid var(--sdpi-bordercolor);color:var(--sdpi-color);' +
    'padding:4px 8px;width:100%;border-radius:3px;font-size:12px;font-family:monospace;resize:vertical;box-sizing:border-box;" ' +
    'data-setting="titleOverrides.titleText"></textarea>' +
    '</sdpi-item>' +

    '<sdpi-item label="Bold">' +
    '<sdpi-checkbox id="title-override-bold" setting="titleOverrides.bold" default="true"></sdpi-checkbox>' +
    '</sdpi-item>' +

    '<sdpi-item label="Font Size">' +
    '<sdpi-range id="title-override-fontSize" setting="titleOverrides.fontSize" ' +
    'min="5" max="50" default="18" showlabel></sdpi-range>' +
    '</sdpi-item>' +

    '<div class="ird-section-subtitle">Position</div>' +

    '<sdpi-item label="Position">' +
    '<sdpi-select id="title-override-position" setting="titleOverrides.position" default="bottom">' +
    '<option value="top">Top</option>' +
    '<option value="middle">Middle</option>' +
    '<option value="bottom">Bottom</option>' +
    '<option value="custom">Custom</option>' +
    '</sdpi-select>' +
    '</sdpi-item>' +

    '<sdpi-item id="title-custom-position-item" class="hidden" label="Custom Position">' +
    '<sdpi-range id="title-override-customPosition" setting="titleOverrides.customPosition" ' +
    'min="-50" max="50" default="0" showlabel></sdpi-range>' +
    '</sdpi-item>' +

    '<div style="display:flex;gap:4px;margin-top:8px;">' +
    '<button class="ird-title-preset" data-preset="default" ' +
    'style="background:var(--sdpi-bgcolor);color:var(--sdpi-color);border:1px solid var(--sdpi-bordercolor);' +
    'padding:3px 8px;border-radius:3px;font-size:11px;cursor:pointer;">Default</button>' +
    '<button class="ird-title-preset" data-preset="global" ' +
    'style="background:var(--sdpi-bgcolor);color:var(--sdpi-color);border:1px solid var(--sdpi-bordercolor);' +
    'padding:3px 8px;border-radius:3px;font-size:11px;cursor:pointer;">Global</button>' +
    '</div>'
}) %>
```

- [ ] **Step 2: Commit**

```bash
git add packages/stream-deck-plugin/src/pi-templates/partials/title-overrides.ejs
git commit -m "feat(stream-deck-plugin): add title-overrides PI partial (#238)"
```

---

## Task 9: Global settings PI — Title Defaults section

**Files:**
- Modify: `packages/stream-deck-plugin/src/pi-templates/partials/global-settings.ejs:47-70`

- [ ] **Step 1: Add Title Defaults section to global-settings.ejs**

In `packages/stream-deck-plugin/src/pi-templates/partials/global-settings.ejs`, add a "Title Defaults" section after the "Icon Colors" section (before the "iRacing" section). The new section should use `global` attribute on all controls and the flat key names (`titleShowTitle`, `titleBold`, etc.).

Insert after the Icon Colors section closing (approximately line 46):

```ejs
    <div class="ird-section-subtitle">Title Defaults</div>

    <sdpi-item label="Show Title">
      <sdpi-checkbox setting="titleShowTitle" global default="true"></sdpi-checkbox>
    </sdpi-item>

    <sdpi-item label="Show Graphics">
      <sdpi-checkbox setting="titleShowGraphics" global default="true"></sdpi-checkbox>
    </sdpi-item>

    <sdpi-item label="Bold">
      <sdpi-checkbox setting="titleBold" global default="true"></sdpi-checkbox>
    </sdpi-item>

    <sdpi-item label="Font Size">
      <sdpi-range setting="titleFontSize" global min="5" max="50" default="18" showlabel></sdpi-range>
    </sdpi-item>

    <sdpi-item label="Position">
      <sdpi-select id="global-title-position" setting="titlePosition" global default="bottom">
        <option value="top">Top</option>
        <option value="middle">Middle</option>
        <option value="bottom">Bottom</option>
        <option value="custom">Custom</option>
      </sdpi-select>
    </sdpi-item>

    <sdpi-item id="global-title-custom-position-item" class="hidden" label="Custom Position">
      <sdpi-range setting="titleCustomPosition" global min="-50" max="50" default="0" showlabel></sdpi-range>
    </sdpi-item>
```

- [ ] **Step 2: Add JavaScript for custom position visibility toggle**

In the settings HTML or PI template, add JavaScript to show/hide the Custom Position field based on the Position dropdown value (both for per-action and global). Follow the existing pattern from `sdpi-select` conditional visibility documented in `.claude/rules/stream-deck-actions.md`.

- [ ] **Step 3: Commit**

```bash
git add packages/stream-deck-plugin/src/pi-templates/partials/global-settings.ejs
git commit -m "feat(stream-deck-plugin): add Title Defaults section to global settings PI (#238)"
```

---

## Task 10: PI event handlers for title presets

**Files:**
- Modify: `packages/stream-deck-plugin/com.iracedeck.sd.core.sdPlugin/ui/settings.html`

- [ ] **Step 1: Add event handlers for title preset buttons and custom position toggle**

In `settings.html`, add event delegation handlers (following the pattern from color presets at lines 124-177):

```javascript
// Title preset buttons
document.addEventListener('click', function(ev) {
  var btn = ev.target.closest('.ird-title-preset');
  if (!btn) return;
  var preset = btn.getAttribute('data-preset');

  var fields = [
    { id: 'title-override-showTitle', sentinel: '' },
    { id: 'title-override-showGraphics', sentinel: '' },
    { id: 'title-override-titleText', sentinel: '' },
    { id: 'title-override-bold', sentinel: '' },
    { id: 'title-override-fontSize', sentinel: '' },
    { id: 'title-override-position', sentinel: '' },
    { id: 'title-override-customPosition', sentinel: '' },
  ];

  if (preset === 'global') {
    // Clear all overrides — fall through to global
    fields.forEach(function(f) {
      var el = document.getElementById(f.id);
      if (el) {
        el.value = f.sentinel;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
  // "default" preset resets to action defaults (handled by clearing settings)
  if (preset === 'default') {
    fields.forEach(function(f) {
      var el = document.getElementById(f.id);
      if (el) {
        el.value = '';
        el.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  }
});

// Custom Position visibility toggle (per-action)
function updateTitleCustomPositionVisibility() {
  var select = document.getElementById('title-override-position');
  var item = document.getElementById('title-custom-position-item');
  if (select && item) {
    if (select.value === 'custom') {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  }
}

// Custom Position visibility toggle (global)
function updateGlobalTitleCustomPositionVisibility() {
  var select = document.getElementById('global-title-position');
  var item = document.getElementById('global-title-custom-position-item');
  if (select && item) {
    if (select.value === 'custom') {
      item.classList.remove('hidden');
    } else {
      item.classList.add('hidden');
    }
  }
}
```

Add initialization calls and event listeners following the existing conditional visibility pattern.

- [ ] **Step 2: Commit**

```bash
git add packages/stream-deck-plugin/com.iracedeck.sd.core.sdPlugin/ui/settings.html
git commit -m "feat(stream-deck-plugin): add title preset and position toggle handlers (#238)"
```

---

## Task 11: Update first action — black-box-selector (reference implementation)

**Files:**
- Modify: `packages/actions/src/actions/black-box-selector.ts:50-62, 117-142, 187-195`
- Modify: `packages/stream-deck-plugin/src/pi/black-box-selector.ejs`

This is the reference implementation. All subsequent actions follow this pattern.

- [ ] **Step 1: Update generateBlackBoxSelectorSvg() to use assembleIcon()**

In `packages/actions/src/actions/black-box-selector.ts`, change the generate function:

```typescript
import {
  assembleIcon,
  getGlobalTitleSettings,
  resolveIconColors,
  resolveTitleSettings,
  getGlobalColors,
} from "@iracedeck/deck-core";

// Keep BLACK_BOX_LABELS but change values to combined titleText format
const BLACK_BOX_TITLE_TEXT: Record<string, string> = {
  "lap-timing": "TOGGLE\nLAP TIMING",
  "standings": "TOGGLE\nSTANDINGS",
  "relative": "TOGGLE\nRELATIVE",
  // ... all entries with subLabel\nmainLabel format
};

export function generateBlackBoxSelectorSvg(settings: BlackBoxSelectorSettings): string {
  const { mode, blackBox } = settings;

  let iconSvg: string;
  let defaultTitle: string;

  if (mode === "next") {
    iconSvg = CYCLE_ICONS.next;
    defaultTitle = "BLACK BOX\nNEXT";
  } else if (mode === "previous") {
    iconSvg = CYCLE_ICONS.previous;
    defaultTitle = "BLACK BOX\nPREVIOUS";
  } else {
    iconSvg = DIRECT_ICONS[blackBox] || DIRECT_ICONS["lap-timing"];
    defaultTitle = BLACK_BOX_TITLE_TEXT[blackBox] || "TOGGLE\nBLACK BOX";
  }

  const colors = resolveIconColors(iconSvg, getGlobalColors(), settings.colorOverrides);
  const title = resolveTitleSettings(iconSvg, getGlobalTitleSettings(), settings.titleOverrides, defaultTitle);

  return assembleIcon({ graphicSvg: iconSvg, colors, title });
}
```

- [ ] **Step 2: Add title-overrides include to PI template**

In `packages/stream-deck-plugin/src/pi/black-box-selector.ejs`, add the title-overrides include between common-settings and color-overrides:

```ejs
<%- include('common-settings') %>

<%- include('title-overrides') %>

<%- include('color-overrides', {
  slots: ['backgroundColor', 'textColor'],
  defaults: require('./data/color-defaults.json')['black-box-selector']
}) %>
```

- [ ] **Step 3: Build and verify**

Run: `pnpm build:ts`
Expected: Build succeeds with no TS errors.

- [ ] **Step 4: Commit**

```bash
git add packages/actions/src/actions/black-box-selector.ts packages/stream-deck-plugin/src/pi/black-box-selector.ejs
git commit -m "feat(actions): update black-box-selector to use title settings (#238)

Reference implementation for the assembleIcon() pipeline."
```

---

## Task 12: Update remaining static-label actions

**Files:**
- Modify: all 27 remaining static-label action `.ts` files
- Modify: all corresponding PI `.ejs` files

Each action follows the same pattern as Task 11:

1. Replace `renderIconTemplate()` + label passing with `assembleIcon()` call
2. Convert label maps from `{ mainLabel, subLabel }` to `titleText` strings (subLabel\nmainLabel order)
3. Add `title-overrides` include to PI template

- [ ] **Step 1: Update each action file**

For each action, apply the pattern:
- Import `assembleIcon`, `getGlobalTitleSettings`, `resolveTitleSettings` from `@iracedeck/deck-core`
- Convert label map values to `"subLabel\nmainLabel"` strings
- Replace the `renderIconTemplate()` + `svgToDataUri()` call with `assembleIcon()`
- Pass `settings.titleOverrides` to `resolveTitleSettings()`

Actions to update (group by similarity):

**Setup actions** (7 — all identical pattern): `setup-aero`, `setup-brakes`, `setup-chassis`, `setup-engine`, `setup-fuel`, `setup-hybrid`, `setup-traction`

**Simple static actions** (11): `audio-controls`, `ai-spotter-controls`, `camera-editor-adjustments`, `camera-editor-controls`, `cockpit-misc`, `look-direction`, `media-capture`, `replay-control`, `replay-navigation`, `replay-speed`, `replay-transport`

**Actions with mode-dependent labels** (5): `camera-controls`, `splits-delta-cycle`, `toggle-ui-elements`, `view-adjustment`, `telemetry-control`

**Complex actions with mixed static/dynamic modes** (4 — static modes only): `car-control`, `chat`, `fuel-service`, `pit-quick-actions`
Note: Only update the static-label rendering paths. Dynamic modes (out of scope) keep existing rendering.

**Race admin** (1 + helpers): `race-admin` (may reference `race-admin-commands`, `race-admin-modes`)

- [ ] **Step 2: Add title-overrides include to each PI template**

For each action's `.ejs` file, add `<%- include('title-overrides') %>` between `common-settings` and `color-overrides` includes.

- [ ] **Step 3: Build and run tests**

Run: `pnpm build:ts && pnpm test`
Expected: Build succeeds, all tests pass.

- [ ] **Step 4: Commit in logical groups**

```bash
# Setup actions
git add packages/actions/src/actions/setup-*.ts packages/stream-deck-plugin/src/pi/setup-*.ejs
git commit -m "feat(actions): update setup actions to use title settings (#238)"

# Simple static actions
git add packages/actions/src/actions/{audio-controls,ai-spotter-controls,camera-editor-adjustments,camera-editor-controls,cockpit-misc,look-direction,media-capture,replay-control,replay-navigation,replay-speed,replay-transport}.ts
git add packages/stream-deck-plugin/src/pi/{audio-controls,ai-spotter-controls,camera-editor-adjustments,camera-editor-controls,cockpit-misc,look-direction,media-capture,replay-control,replay-navigation,replay-speed,replay-transport}.ejs
git commit -m "feat(actions): update simple static actions to use title settings (#238)"

# Mode-dependent actions
git add packages/actions/src/actions/{camera-controls,splits-delta-cycle,toggle-ui-elements,view-adjustment,telemetry-control}.ts
git add packages/stream-deck-plugin/src/pi/{camera-controls,splits-delta-cycle,toggle-ui-elements,view-adjustment,telemetry-control}.ejs
git commit -m "feat(actions): update mode-dependent actions to use title settings (#238)"

# Complex mixed actions (static modes only)
git add packages/actions/src/actions/{car-control,chat,fuel-service,pit-quick-actions}.ts
git add packages/stream-deck-plugin/src/pi/{car-control,chat,fuel-service,pit-quick-actions}.ejs
git commit -m "feat(actions): update mixed actions static modes to use title settings (#238)"

# Race admin
git add packages/actions/src/actions/race-admin*.ts packages/stream-deck-plugin/src/pi/race-admin*.ejs
git commit -m "feat(actions): update race-admin to use title settings (#238)"
```

---

## Task 13: Update telemetry-display and session-info

**Files:**
- Modify: `packages/actions/src/actions/telemetry-display.ts:55-69`
- Modify: `packages/actions/src/actions/session-info.ts:111-152`
- Modify: corresponding PI templates

These actions have a title label + dynamic value display. Title settings apply to the title only.

- [ ] **Step 1: Update telemetry-display**

In `generateTelemetryDisplaySvg()`, replace the hardcoded `{{titleLabel}}` rendering with `generateTitleText()`:

```typescript
import { generateTitleText, getGlobalTitleSettings, resolveTitleSettings } from "@iracedeck/deck-core";

export function generateTelemetryDisplaySvg(title: string, value: string, settings: TelemetryDisplaySettings): string {
  const colors = resolveIconColors(telemetryDisplayTemplate, getGlobalColors(), settings.colorOverrides);
  const textColor = colors.textColor;

  // Title via new title settings system
  const titleSettings = resolveTitleSettings(
    telemetryDisplayTemplate,
    getGlobalTitleSettings(),
    settings.titleOverrides,
    title,
  );

  const titleContent = titleSettings.showTitle
    ? generateTitleText({
        text: titleSettings.titleText,
        fontSize: titleSettings.fontSize,
        bold: titleSettings.bold,
        position: titleSettings.position,
        customPosition: titleSettings.customPosition,
        fill: textColor,
      })
    : "";

  // Value rendering stays unchanged
  const valueContent = generateValueContent(value, settings.fontSize * 2, textColor);

  // Use modified template that has {{titleContent}} instead of hardcoded title text
  const svg = renderIconTemplate(telemetryDisplayTemplate, {
    ...colors,
    titleContent,
    valueContent,
  });

  return svgToDataUri(svg);
}
```

Also update the telemetry-display SVG template (`packages/stream-deck-plugin/icons/telemetry-display.svg` and `packages/actions/icons/telemetry-display.svg`) to replace the hardcoded `<text>` title element with `{{titleContent}}`.

- [ ] **Step 2: Update session-info similarly**

Apply the same pattern: replace hardcoded titleLabel rendering with `generateTitleText()` using resolved title settings. Keep the dynamic value rendering unchanged.

- [ ] **Step 3: Add title-overrides to PI templates**

Add `<%- include('title-overrides') %>` to `telemetry-display.ejs` and `session-info.ejs`.

- [ ] **Step 4: Build and verify**

Run: `pnpm build:ts && pnpm test`
Expected: Build succeeds, all tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/actions/src/actions/telemetry-display.ts packages/actions/src/actions/session-info.ts
git add packages/stream-deck-plugin/icons/telemetry-display.svg packages/stream-deck-plugin/icons/session-info.svg
git add packages/actions/icons/telemetry-display.svg packages/actions/icons/session-info.svg
git add packages/stream-deck-plugin/src/pi/telemetry-display.ejs packages/stream-deck-plugin/src/pi/session-info.ejs
git commit -m "feat(actions): update telemetry-display and session-info title rendering (#238)"
```

---

## Task 14: Mirabox plugin PI templates

**Files:**
- Modify: Mirabox plugin PI templates and global settings

- [ ] **Step 1: Read mirabox plugin CLAUDE.md for differences**

Read `packages/mirabox-plugin/CLAUDE.md` to understand any differences in PI template structure.

- [ ] **Step 2: Add title-overrides partial and global settings section**

Copy the `title-overrides.ejs` partial to the mirabox plugin's partials directory (or verify it can share the same partial). Add the Title Defaults section to the mirabox global settings template.

Add `<%- include('title-overrides') %>` to all mirabox action PI templates.

- [ ] **Step 3: Build and verify**

Run: `pnpm build:ts`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add packages/mirabox-plugin/
git commit -m "feat(mirabox-plugin): add title settings PI templates (#238)"
```

---

## Task 15: Update existing tests

**Files:**
- Modify: `packages/actions/src/actions/splits-delta-cycle.test.ts`
- Modify: any other action test files that reference mainLabel/subLabel

- [ ] **Step 1: Update mock setup in action tests**

Update the `vi.mock("@iracedeck/deck-core")` block to include the new exports:

```typescript
// Add to the mock:
assembleIcon: vi.fn(({ title }) => `data:image/svg+xml,${encodeURIComponent(`<svg>${title.titleText}</svg>`)}`),
resolveTitleSettings: vi.fn((_svg, _global, _action, defaultText) => ({
  showTitle: true,
  showGraphics: true,
  titleText: defaultText ?? "",
  bold: true,
  fontSize: 18,
  position: "bottom",
  customPosition: 0,
})),
getGlobalTitleSettings: vi.fn(() => ({})),
TITLE_DEFAULTS: { showTitle: true, showGraphics: true, bold: true, fontSize: 18, position: "bottom", customPosition: 0 },
extractGraphicContent: vi.fn((svg) => svg),
ICON_BASE_TEMPLATE: "<svg>{{backgroundColor}}{{graphicContent}}{{titleContent}}</svg>",
```

- [ ] **Step 2: Update test assertions**

Tests that previously checked for `mainLabel`/`subLabel` in output should now check for the consolidated title text format.

- [ ] **Step 3: Run all tests**

Run: `pnpm test`
Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add packages/actions/src/actions/*.test.ts
git commit -m "test(actions): update tests for title settings and assembleIcon (#238)"
```

---

## Task 16: Update icon preview generation

**Files:**
- Modify: `scripts/generate-icon-previews.mjs`

- [ ] **Step 1: Update preview script for new icon format**

The preview generation script needs to handle the new graphic snippet format — it must wrap snippets in the base template and generate title text for previews.

Read the current script, understand how it works, and update it to:
1. Use the base template to wrap graphic content
2. Generate default title text from `<desc>` metadata
3. Resolve default colors as before

- [ ] **Step 2: Run the script and verify previews**

Run: `node scripts/generate-icon-previews.mjs`
Expected: Previews generated successfully, matching the new format.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate-icon-previews.mjs packages/icons/preview/
git commit -m "fix(icons): update preview generation for graphic snippet format (#238)"
```

---

## Task 17: Update documentation and rules

**Files:**
- Modify: `.claude/rules/icons.md`
- Modify: `.claude/rules/key-icon-types.md`
- Modify: `.claude/rules/stream-deck-actions.md`
- Modify: `.claude/rules/pi-templates.md`
- Modify: `.claude/rules/global-settings.md`

- [ ] **Step 1: Update icons.md**

Add section about the base template + graphic snippet architecture. Update the SVG structure documentation to reflect that icons no longer contain background rects or label text.

- [ ] **Step 2: Update key-icon-types.md**

Replace the mainLabel/subLabel two-label system documentation with the new unified titleText system. Document the default text format (subLabel\nmainLabel order).

- [ ] **Step 3: Update stream-deck-actions.md**

Add documentation for:
- `TitleOverridesSchema` in CommonSettings
- The `assembleIcon()` pattern replacing `renderIconTemplate()` + `svgToDataUri()`
- How actions pass `settings.titleOverrides` and `actionDefaultText`

- [ ] **Step 4: Update pi-templates.md**

Document the new `title-overrides.ejs` partial, its usage, and the Title Defaults section in global settings.

- [ ] **Step 5: Update global-settings.md**

Add the title settings keys (`titleShowTitle`, `titleBold`, etc.) and `getGlobalTitleSettings()` function.

- [ ] **Step 6: Commit**

```bash
git add .claude/rules/
git commit -m "docs: update rules for title settings and icon snippet architecture (#238)"
```

---

## Task 18: Final build, test, and verification

- [ ] **Step 1: Full build**

Run: `pnpm install && pnpm build`
Expected: Build succeeds with no TypeScript errors. Check full output for `TS[0-9]+:` patterns.

- [ ] **Step 2: Run all tests**

Run: `pnpm test`
Expected: All tests pass.

- [ ] **Step 3: Run linting and formatting**

Run: `pnpm lint:fix && pnpm format:fix`
Expected: No errors.

- [ ] **Step 4: Verify icon previews are fresh**

Run: `pnpm test` (the Vitest freshness test should verify previews match templates).

- [ ] **Step 5: Commit any lint/format fixes**

```bash
git add -A
git commit -m "chore: lint and format fixes (#238)"
```
