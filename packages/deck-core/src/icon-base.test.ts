import { describe, expect, it } from "vitest";

import { generateBorderParts } from "./icon-base.js";
import type { ResolvedBorderSettings } from "./title-settings.js";

const DEFAULTS: ResolvedBorderSettings = {
  enabled: false,
  borderWidth: 14,
  borderColor: "#00aaff",
  glowEnabled: true,
  glowWidth: 36,
};

describe("generateBorderParts", () => {
  it("should return empty parts when disabled", () => {
    const result = generateBorderParts(DEFAULTS);
    expect(result.defs).toBe("");
    expect(result.rects).toBe("");
  });

  it("should return border rect without glow when glow is disabled", () => {
    const result = generateBorderParts({ ...DEFAULTS, enabled: true, glowEnabled: false });
    expect(result.defs).toBe("");
    expect(result.rects).toContain('stroke="#00aaff"');
    expect(result.rects).toContain('stroke-width="14"');
    expect(result.rects).toContain('rx="24"');
    expect(result.rects).not.toContain("ird-border-glow");
  });

  it("should return defs and rects with glow when glow is enabled", () => {
    const result = generateBorderParts({ ...DEFAULTS, enabled: true });
    expect(result.defs).toContain("<defs>");
    expect(result.defs).toContain("ird-border-glow");
    expect(result.rects).toContain('stroke-width="36"'); // glow width
    expect(result.rects).toContain('opacity="0.4"');
    expect(result.rects).toContain('stroke-width="14"'); // border width
  });

  it("should clamp glow width at 60", () => {
    const result = generateBorderParts({ ...DEFAULTS, enabled: true, glowWidth: 80 });
    expect(result.rects).toContain('stroke-width="60"');
    expect(result.rects).not.toContain('stroke-width="80"');
  });

  it("should use specified border color", () => {
    const result = generateBorderParts({ ...DEFAULTS, enabled: true, borderColor: "#e74c3c" });
    expect(result.rects).toContain('stroke="#e74c3c"');
  });

  it("should use specified border width", () => {
    const result = generateBorderParts({ ...DEFAULTS, enabled: true, borderWidth: 8, glowEnabled: false });
    expect(result.rects).toContain('stroke-width="8"');
  });
});
