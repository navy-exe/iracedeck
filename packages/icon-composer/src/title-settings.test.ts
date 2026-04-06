import { describe, expect, it } from "vitest";

import { parseIconArtworkBounds } from "./icon-template.js";
import {
  assembleIcon,
  BORDER_DEFAULTS,
  computeGraphicArea,
  GRAPHIC_DEFAULTS,
  resolveGraphicSettings,
  resolveTitleSettings,
  TITLE_DEFAULTS,
} from "./title-settings.js";

// ---------------------------------------------------------------------------
// parseIconArtworkBounds
// ---------------------------------------------------------------------------

describe("parseIconArtworkBounds", () => {
  it("should parse valid artworkBounds from desc", () => {
    const svg = `<svg><desc>{"colors":{},"artworkBounds":{"x":36,"y":24,"width":88,"height":48}}</desc></svg>`;
    const result = parseIconArtworkBounds(svg);
    expect(result).toEqual({ x: 36, y: 24, width: 88, height: 48 });
  });

  it("should return undefined when artworkBounds is missing", () => {
    const svg = `<svg><desc>{"colors":{}}</desc></svg>`;
    expect(parseIconArtworkBounds(svg)).toBeUndefined();
  });

  it("should return undefined when desc is missing", () => {
    const svg = `<svg><rect/></svg>`;
    expect(parseIconArtworkBounds(svg)).toBeUndefined();
  });

  it("should return undefined when fields are not numbers", () => {
    const svg = `<svg><desc>{"artworkBounds":{"x":"bad","y":24,"width":88,"height":48}}</desc></svg>`;
    expect(parseIconArtworkBounds(svg)).toBeUndefined();
  });

  it("should return undefined when width is zero", () => {
    const svg = `<svg><desc>{"artworkBounds":{"x":0,"y":0,"width":0,"height":48}}</desc></svg>`;
    expect(parseIconArtworkBounds(svg)).toBeUndefined();
  });

  it("should return undefined when height is negative", () => {
    const svg = `<svg><desc>{"artworkBounds":{"x":0,"y":0,"width":48,"height":-10}}</desc></svg>`;
    expect(parseIconArtworkBounds(svg)).toBeUndefined();
  });

  it("should accept bounds at origin", () => {
    const svg = `<svg><desc>{"artworkBounds":{"x":0,"y":0,"width":100,"height":100}}</desc></svg>`;
    const result = parseIconArtworkBounds(svg);
    expect(result).toEqual({ x: 0, y: 0, width: 100, height: 100 });
  });
});

// ---------------------------------------------------------------------------
// computeGraphicArea
// ---------------------------------------------------------------------------

describe("computeGraphicArea", () => {
  const baseTitle = {
    showTitle: true,
    showGraphics: true,
    titleText: "CAMERA\nNEXT",
    bold: true,
    fontSize: 9,
    position: "bottom" as const,
    customPosition: 0,
  };

  it("should return full canvas when title is hidden", () => {
    const area = computeGraphicArea({ ...baseTitle, showTitle: false });
    expect(area).toEqual({ x: 8, y: 8, width: 128, height: 128 });
  });

  it("should return full canvas when title text is empty", () => {
    const area = computeGraphicArea({ ...baseTitle, titleText: "" });
    expect(area).toEqual({ x: 8, y: 8, width: 128, height: 128 });
  });

  it("should reduce height when title is at bottom (default case)", () => {
    const area = computeGraphicArea(baseTitle);
    // With fontSize 9 (doubled to 18), 2 lines at bottom:
    // lineHeight = 18 * 1.2 = 21.6, endY = 130, first line y = 108.4
    // titleTop = 108.4 - 9 = 99.4
    // height = 99.4 - 8 - 8 = 83.4
    expect(area.x).toBe(8);
    expect(area.y).toBe(8);
    expect(area.width).toBe(128);
    expect(area.height).toBeGreaterThan(75);
    expect(area.height).toBeLessThan(100);
  });

  it("should shift graphic down when title is at top", () => {
    const area = computeGraphicArea({ ...baseTitle, position: "top" });
    // Title at top: startY = 18 + 8 = 26, second line y = 26 + 21.6 = 47.6
    // titleBottom = 47.6 + 9 = 56.6
    // topY = 56.6 + 8 = 64.6, height = 144 - 8 - 64.6 = 71.4
    expect(area.y).toBeGreaterThan(50);
    expect(area.height).toBeGreaterThan(60);
    expect(area.height).toBeLessThan(90);
  });

  it("should return full canvas when title is at middle", () => {
    const area = computeGraphicArea({ ...baseTitle, position: "middle" });
    expect(area).toEqual({ x: 8, y: 8, width: 128, height: 128 });
  });

  it("should return full canvas when title is at custom position", () => {
    const area = computeGraphicArea({ ...baseTitle, position: "custom", customPosition: -20 });
    expect(area).toEqual({ x: 8, y: 8, width: 128, height: 128 });
  });

  it("should handle single-line title at bottom", () => {
    const area = computeGraphicArea({ ...baseTitle, titleText: "NEXT" });
    // Single line takes less space, so height should be larger
    const twoLineArea = computeGraphicArea(baseTitle);
    expect(area.height).toBeGreaterThan(twoLineArea.height);
  });

  it("should handle large font size", () => {
    const area = computeGraphicArea({ ...baseTitle, fontSize: 30 });
    // Larger font → title takes more space → less room for graphic
    const defaultArea = computeGraphicArea(baseTitle);
    expect(area.height).toBeLessThan(defaultArea.height);
  });
});

// ---------------------------------------------------------------------------
// resolveGraphicSettings
// ---------------------------------------------------------------------------

describe("resolveGraphicSettings", () => {
  it("should return defaults when no overrides", () => {
    const result = resolveGraphicSettings({});
    expect(result).toEqual(GRAPHIC_DEFAULTS);
    expect(result.scale).toBe(100);
  });

  it("should use global scale", () => {
    const result = resolveGraphicSettings({ scale: 80 });
    expect(result.scale).toBe(80);
  });

  it("should ignore global 'default' value", () => {
    const result = resolveGraphicSettings({ scale: "default" });
    expect(result.scale).toBe(100);
  });

  it("should use 100% when scaleMode is 'default' (ignoring global)", () => {
    const result = resolveGraphicSettings({ scale: 80 }, { scaleMode: "default" });
    expect(result.scale).toBe(100);
  });

  it("should use action scale when scaleMode is 'override'", () => {
    const result = resolveGraphicSettings({ scale: 80 }, { scaleMode: "override", scale: 120 });
    expect(result.scale).toBe(120);
  });

  it("should fall back to 100 when scaleMode is 'override' but no scale set", () => {
    const result = resolveGraphicSettings({ scale: 80 }, { scaleMode: "override" });
    expect(result.scale).toBe(100);
  });

  it("should inherit from global when scaleMode is undefined", () => {
    const result = resolveGraphicSettings({ scale: 75 }, {});
    expect(result.scale).toBe(75);
  });

  it("should inherit from global when no action overrides", () => {
    const result = resolveGraphicSettings({ scale: 60 }, undefined);
    expect(result.scale).toBe(60);
  });
});

// ---------------------------------------------------------------------------
// assembleIcon with graphic scaling
// ---------------------------------------------------------------------------

function decodeDataUri(dataUri: string): string {
  const base64Match = dataUri.match(/^data:image\/svg\+xml;base64,(.+)$/);

  if (base64Match) {
    return Buffer.from(base64Match[1], "base64").toString("utf-8");
  }

  return dataUri;
}

const MOCK_GRAPHIC_NO_BOUNDS = `<svg><desc>{"colors":{"backgroundColor":"#2a3444","textColor":"#ffffff"},"title":{"text":"TEST"}}</desc><rect x="22" y="12" width="100" height="80" fill="{{graphic1Color}}"/></svg>`;

const MOCK_GRAPHIC_WITH_BOUNDS = `<svg><desc>{"colors":{"backgroundColor":"#2a3444","textColor":"#ffffff"},"title":{"text":"TEST"},"artworkBounds":{"x":22,"y":12,"width":100,"height":80}}</desc><rect x="22" y="12" width="100" height="80" fill="{{graphic1Color}}"/></svg>`;

const DEFAULT_TITLE = {
  showTitle: true,
  showGraphics: true,
  titleText: "TEST",
  bold: true,
  fontSize: 9,
  position: "bottom" as const,
  customPosition: 0,
};

const COLORS = { backgroundColor: "#2a3444", textColor: "#ffffff", graphic1Color: "#ffffff" };

describe("assembleIcon with graphic scaling", () => {
  it("should NOT apply transform when graphic param is omitted", () => {
    const result = assembleIcon({
      graphicSvg: MOCK_GRAPHIC_WITH_BOUNDS,
      colors: COLORS,
      title: DEFAULT_TITLE,
      border: BORDER_DEFAULTS,
    });
    const svg = decodeDataUri(result);
    expect(svg).not.toContain("<g transform=");
  });

  it("should NOT apply transform when artworkBounds is missing", () => {
    const result = assembleIcon({
      graphicSvg: MOCK_GRAPHIC_NO_BOUNDS,
      colors: COLORS,
      title: DEFAULT_TITLE,
      border: BORDER_DEFAULTS,
      graphic: { scale: 100 },
    });
    const svg = decodeDataUri(result);
    expect(svg).not.toContain("<g transform=");
  });

  it("should apply transform when graphic param AND artworkBounds present", () => {
    const result = assembleIcon({
      graphicSvg: MOCK_GRAPHIC_WITH_BOUNDS,
      colors: COLORS,
      title: DEFAULT_TITLE,
      border: BORDER_DEFAULTS,
      graphic: { scale: 100 },
    });
    const svg = decodeDataUri(result);
    expect(svg).toContain("<g transform=");
    expect(svg).toContain("translate(");
    expect(svg).toContain("scale(");
  });

  it("should scale up when title is hidden", () => {
    // Use tall/narrow artwork where height becomes the constraining dimension
    const tallGraphic = `<svg><desc>{"colors":{"backgroundColor":"#2a3444","textColor":"#ffffff"},"title":{"text":"LINE1\\nLINE2"},"artworkBounds":{"x":40,"y":10,"width":64,"height":120}}</desc><rect x="40" y="10" width="64" height="120" fill="{{graphic1Color}}"/></svg>`;
    const titleWithTwoLines = { ...DEFAULT_TITLE, titleText: "LINE1\nLINE2", fontSize: 12 };
    const noTitle = { ...titleWithTwoLines, showTitle: false };

    const withTitle = assembleIcon({
      graphicSvg: tallGraphic,
      colors: COLORS,
      title: titleWithTwoLines,
      border: BORDER_DEFAULTS,
      graphic: { scale: 100 },
    });

    const withoutTitle = assembleIcon({
      graphicSvg: tallGraphic,
      colors: COLORS,
      title: noTitle,
      border: BORDER_DEFAULTS,
      graphic: { scale: 100 },
    });

    // Extract scale values from both
    const withTitleScale = parseFloat(decodeDataUri(withTitle).match(/scale\(([^)]+)\)/)?.[1] ?? "0");
    const withoutTitleScale = parseFloat(decodeDataUri(withoutTitle).match(/scale\(([^)]+)\)/)?.[1] ?? "0");

    // Without title, more space → larger scale
    expect(withoutTitleScale).toBeGreaterThan(withTitleScale);
  });

  it("should still contain graphic content inside the transform group", () => {
    const result = assembleIcon({
      graphicSvg: MOCK_GRAPHIC_WITH_BOUNDS,
      colors: COLORS,
      title: DEFAULT_TITLE,
      border: BORDER_DEFAULTS,
      graphic: { scale: 100 },
    });
    const svg = decodeDataUri(result);
    // The rect should be inside the transform group
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain("</g>");
  });

  it("should not apply transform when showGraphics is false", () => {
    const result = assembleIcon({
      graphicSvg: MOCK_GRAPHIC_WITH_BOUNDS,
      colors: COLORS,
      title: { ...DEFAULT_TITLE, showGraphics: false },
      border: BORDER_DEFAULTS,
      graphic: { scale: 100 },
    });
    const svg = decodeDataUri(result);
    expect(svg).not.toContain("<g transform=");
  });
});

// ---------------------------------------------------------------------------
// resolveTitleSettings (basic — existing tests in deck-core cover more)
// ---------------------------------------------------------------------------

describe("resolveTitleSettings", () => {
  const GRAPHIC = `<svg><desc>{"colors":{},"title":{"text":"TOGGLE\\nLAP TIMING"}}</desc></svg>`;

  it("should return defaults when no overrides", () => {
    const result = resolveTitleSettings(GRAPHIC, {});
    expect(result.showTitle).toBe(TITLE_DEFAULTS.showTitle);
    expect(result.position).toBe(TITLE_DEFAULTS.position);
    expect(result.titleText).toBe("TOGGLE\nLAP TIMING");
  });

  it("should use global settings over defaults", () => {
    const result = resolveTitleSettings(GRAPHIC, { fontSize: 20, position: "top" });
    expect(result.fontSize).toBe(20);
    expect(result.position).toBe("top");
  });

  it("should use action overrides over global", () => {
    const result = resolveTitleSettings(GRAPHIC, { fontSize: 20 }, { fontSize: 30 });
    expect(result.fontSize).toBe(30);
  });
});
