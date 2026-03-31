import { describe, expect, it } from "vitest";

import type { TitleOverrides } from "./common-settings.js";
import { resolveTitleSettings } from "./title-settings.js";
import type { GlobalTitleSettings } from "./title-settings.js";

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
