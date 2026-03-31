import { describe, expect, it } from "vitest";

import type { TitleOverrides } from "./common-settings.js";
import { assembleIcon, generateTitleText, resolveTitleSettings } from "./title-settings.js";
import type { GlobalTitleSettings } from "./title-settings.js";

const GRAPHIC_WITH_TITLE = `<svg><desc>{"colors":{},"title":{"text":"TOGGLE\\nLAP TIMING"}}</desc></svg>`;
const GRAPHIC_NO_TITLE = `<svg><desc>{"colors":{}}</desc></svg>`;

const MOCK_GRAPHIC = `<svg><desc>{"colors":{"backgroundColor":"#2a3444","textColor":"#ffffff"},"title":{"text":"TOGGLE\\nLAP TIMING"}}</desc><rect x="22" y="12" width="100" height="80" fill="{{graphic1Color}}"/></svg>`;

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
    expect(result.bold).toBe(false);
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

describe("generateTitleText", () => {
  const defaults = { fill: "#ffffff" };

  it("should generate single-line text at bottom position", () => {
    const result = generateTitleText({
      text: "NEXT",
      fontSize: 20,
      bold: true,
      position: "bottom",
      customPosition: 0,
      ...defaults,
    });
    expect(result).toContain("NEXT");
    expect(result).toContain('font-size="20"');
    expect(result).toContain('font-weight="bold"');
    expect(result).toContain('y="140"');
  });

  it("should generate single-line text at top position", () => {
    const result = generateTitleText({
      text: "NEXT",
      fontSize: 20,
      bold: true,
      position: "top",
      customPosition: 0,
      ...defaults,
    });
    expect(result).toContain('y="24"');
  });

  it("should generate single-line text at middle position", () => {
    const result = generateTitleText({
      text: "NEXT",
      fontSize: 20,
      bold: true,
      position: "middle",
      customPosition: 0,
      ...defaults,
    });
    expect(result).toContain('y="72"');
  });

  it("should generate multiline text at bottom position", () => {
    const result = generateTitleText({
      text: "CAMERA\nNEXT",
      fontSize: 18,
      bold: true,
      position: "bottom",
      customPosition: 0,
      ...defaults,
    });
    expect(result).toContain("CAMERA");
    expect(result).toContain("NEXT");
    const lines = result.match(/y="(\d+\.?\d*)"/g);
    expect(lines).toHaveLength(2);
  });

  it("should generate multiline text at top position", () => {
    const result = generateTitleText({
      text: "CAMERA\nNEXT",
      fontSize: 18,
      bold: true,
      position: "top",
      customPosition: 0,
      ...defaults,
    });
    const lines = result.match(/y="(\d+\.?\d*)"/g);
    expect(lines).toHaveLength(2);
    const y1 = parseFloat(lines![0].match(/(\d+\.?\d*)/)![1]);
    const y2 = parseFloat(lines![1].match(/(\d+\.?\d*)/)![1]);
    expect(y1).toBeLessThan(y2);
    expect(y1).toBe(18 + 4);
  });

  it("should use custom position as offset from middle", () => {
    const result = generateTitleText({
      text: "NEXT",
      fontSize: 20,
      bold: true,
      position: "custom",
      customPosition: -30,
      ...defaults,
    });
    expect(result).toContain('y="42"');
  });

  it("should render normal weight when bold is false", () => {
    const result = generateTitleText({
      text: "NEXT",
      fontSize: 20,
      bold: false,
      position: "bottom",
      customPosition: 0,
      ...defaults,
    });
    expect(result).toContain('font-weight="normal"');
  });

  it("should return empty string for empty text", () => {
    const result = generateTitleText({
      text: "",
      fontSize: 20,
      bold: true,
      position: "bottom",
      customPosition: 0,
      ...defaults,
    });
    expect(result).toBe("");
  });

  it("should escape XML entities in text", () => {
    const result = generateTitleText({
      text: "A&B",
      fontSize: 20,
      bold: true,
      position: "bottom",
      customPosition: 0,
      ...defaults,
    });
    expect(result).toContain("A&amp;B");
  });

  it("should handle three lines at middle position", () => {
    const result = generateTitleText({
      text: "LINE1\nLINE2\nLINE3",
      fontSize: 16,
      bold: true,
      position: "middle",
      customPosition: 0,
      ...defaults,
    });
    const lines = result.match(/y="(\d+\.?\d*)"/g);
    expect(lines).toHaveLength(3);
    const ys = lines!.map((l) => parseFloat(l.match(/(\d+\.?\d*)/)![1]));
    const avg = ys.reduce((a, b) => a + b, 0) / ys.length;
    expect(Math.abs(avg - 72)).toBeLessThan(2);
  });
});

function decodeDataUri(dataUri: string): string {
  const base64Match = dataUri.match(/^data:image\/svg\+xml;base64,(.+)$/);

  if (base64Match) {
    return Buffer.from(base64Match[1], "base64").toString("utf-8");
  }

  // URL-encoded fallback
  const plainMatch = dataUri.match(/^data:image\/svg\+xml,(.+)$/);

  if (plainMatch) {
    return decodeURIComponent(plainMatch[1]);
  }

  return dataUri;
}

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
    const svg = decodeDataUri(result);
    expect(result).toContain("data:image/svg+xml");
    expect(svg).toContain("TOGGLE");
    expect(svg).toContain("LAP TIMING");
    expect(svg).toContain("#2a3444");
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
    const svg = decodeDataUri(result);
    expect(svg).toContain("TOGGLE");
    expect(svg).not.toContain('width="100"');
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
    const svg = decodeDataUri(result);
    expect(svg).not.toContain("TOGGLE");
    expect(svg).toContain('width="100"');
  });
});
