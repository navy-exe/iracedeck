import type { TitleOverrides } from "./common-settings.js";
import { parseIconTitleDefault } from "./icon-template.js";

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

// Ensure the TitleOverrides import is used (type-only import for future use)
export type { TitleOverrides };

/**
 * Resolves title settings by merging per-action overrides, global settings, and defaults.
 *
 * Resolution chain for non-text fields: actionOverrides → globalTitleSettings → TITLE_DEFAULTS
 * Resolution chain for titleText: actionOverrides.titleText → actionDefaultText → desc metadata → ""
 *
 * @param graphicSvg - SVG template string with optional <desc> title metadata
 * @param globalTitleSettings - Plugin-level global title settings
 * @param actionOverrides - Per-action title overrides from action settings (optional)
 * @param actionDefaultText - Default title text provided by action code (optional)
 * @returns Fully resolved title settings with all fields populated
 */
export function resolveTitleSettings(
  graphicSvg: string,
  globalTitleSettings: GlobalTitleSettings,
  actionOverrides?: TitleOverrides,
  actionDefaultText?: string,
): ResolvedTitleSettings {
  const descDefault = parseIconTitleDefault(graphicSvg);

  const resolve = <T>(actionVal: T | undefined, globalVal: T | undefined, fallback: T): T =>
    actionVal ?? globalVal ?? fallback;

  const titleText =
    (actionOverrides?.titleText && actionOverrides.titleText.length > 0 ? actionOverrides.titleText : undefined) ??
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
    customPosition: resolve(
      actionOverrides?.customPosition,
      globalTitleSettings.customPosition,
      TITLE_DEFAULTS.customPosition,
    ),
  };
}
