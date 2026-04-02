import { describe, expect, it } from "vitest";

import { generateBorderParts, generateBorderSvg } from "./icon-base.js";

describe("generateBorderSvg", () => {
  it("should return empty string when disabled", () => {
    const result = generateBorderSvg({ enabled: false, width: 14, color: "#00aaff" });
    expect(result).toBe("");
  });

  it("should return defs and border rects when enabled", () => {
    const result = generateBorderSvg({ enabled: true, width: 8, color: "#2ecc71" });
    expect(result).toContain("<defs>");
    expect(result).toContain("ird-border-glow");
    expect(result).toContain('stroke="#2ecc71"');
    expect(result).toContain('stroke-width="8"');
    expect(result).toContain('fill="none"');
    expect(result).toContain('rx="24"');
  });

  it("should include a glow rect with larger stroke width", () => {
    const result = generateBorderSvg({ enabled: true, width: 8, color: "#2ecc71" });
    expect(result).toContain('stroke-width="20"'); // 8 * 2.5 = 20
    expect(result).toContain('opacity="0.4"');
  });

  it("should clamp glow width at 60", () => {
    const result = generateBorderSvg({ enabled: true, width: 40, color: "#ffffff" });
    expect(result).toContain('stroke-width="60"'); // clamped from 100
    expect(result).not.toContain('stroke-width="100"');
  });
});

describe("generateBorderParts", () => {
  it("should return empty parts when disabled", () => {
    const result = generateBorderParts({ enabled: false, width: 14, color: "#00aaff" });
    expect(result.defs).toBe("");
    expect(result.rects).toBe("");
  });

  it("should separate defs and rects", () => {
    const result = generateBorderParts({ enabled: true, width: 8, color: "#2ecc71" });
    expect(result.defs).toContain("<defs>");
    expect(result.defs).toContain("ird-border-glow");
    expect(result.defs).not.toContain('stroke-width="8"');
    expect(result.rects).toContain('stroke="#2ecc71"');
    expect(result.rects).toContain('stroke-width="8"');
    expect(result.rects).not.toContain("<defs>");
  });
});
