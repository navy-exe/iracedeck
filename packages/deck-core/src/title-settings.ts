import type { BorderOverrides, TitleOverrides } from "./common-settings.js";
import { getGlobalSettings } from "./global-settings.js";
import { extractGraphicContent, generateBorderSvg, ICON_BASE_TEMPLATE } from "./icon-base.js";
import { escapeXml, parseIconTitleDefaults, renderIconTemplate } from "./icon-template.js";
import { svgToDataUri } from "./overlay-utils.js";

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
  bold?: boolean | "default";
  fontSize?: number | "default";
  position?: "top" | "middle" | "bottom" | "custom" | "default";
  customPosition?: number | "default";
}

const TITLE_DEFAULTS: Omit<ResolvedTitleSettings, "titleText"> = {
  showTitle: true,
  showGraphics: true,
  bold: true,
  fontSize: 9,
  position: "bottom",
  customPosition: 0,
};

export { TITLE_DEFAULTS };

export interface GenerateTitleTextOptions {
  text: string;
  fontSize: number;
  bold: boolean;
  position: "top" | "middle" | "bottom" | "custom";
  customPosition: number;
  fill: string;
}

export function generateTitleText(options: GenerateTitleTextOptions): string {
  const { text, bold, position, customPosition, fill } = options;
  // Double the PI font size for SVG rendering (consistent with telemetry-display and chat)
  const fontSize = options.fontSize * 2;

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
      const startY = fontSize + 8;

      for (let i = 0; i < lineCount; i++) {
        positions.push(startY + i * lineHeight);
      }

      break;
    }
    case "middle": {
      // Dynamic center that adjusts with font size, matching telemetry-display pattern
      const centerY = 88 + (fontSize - 44) / 3;
      const startY = centerY - totalHeight / 2;

      for (let i = 0; i < lineCount; i++) {
        positions.push(startY + i * lineHeight);
      }

      break;
    }
    case "bottom": {
      const endY = 130;
      const startY = endY - totalHeight;

      for (let i = 0; i < lineCount; i++) {
        positions.push(startY + i * lineHeight);
      }

      break;
    }
    case "custom": {
      const centerY = 88 + (fontSize - 44) / 3 + customPosition;
      const startY = centerY - totalHeight / 2;

      for (let i = 0; i < lineCount; i++) {
        positions.push(startY + i * lineHeight);
      }

      break;
    }
  }

  return positions;
}

/**
 * Reads plugin-level global title settings from the global settings store.
 * Keys are flat with a `title` prefix (e.g., `titleFontSize`, `titleBold`).
 */
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

  // Bold: supports "default" to defer to icon defaults
  const boldVal = settings["titleBold"];

  if (boldVal === "default") {
    result.bold = "default";
  } else {
    const bold = bool("titleBold");

    if (bold !== undefined) result.bold = bold;
  }

  // Font size: "default" checkbox means defer to icon defaults
  const fontSizeDefault = bool("titleFontSizeDefault");

  if (fontSizeDefault) {
    result.fontSize = "default";
  } else {
    const fontSize = num("titleFontSize");

    if (fontSize !== undefined) result.fontSize = fontSize;
  }

  // Position: supports "default" to defer to icon defaults
  const position = str("titlePosition") as GlobalTitleSettings["position"];

  if (position !== undefined) result.position = position;

  // Custom position: follows position — "default" when position is "default"
  if (position === "default") {
    result.customPosition = "default";
  } else {
    const customPosition = num("titleCustomPosition");

    if (customPosition !== undefined) result.customPosition = customPosition;
  }

  return result;
}

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
  const iconDefaults = parseIconTitleDefaults(graphicSvg);

  // Resolution: per-action → global (if not "default") → icon <desc> default → TITLE_DEFAULTS
  const resolve = <T>(
    actionVal: T | undefined,
    globalVal: T | "default" | undefined,
    iconDefault: T | undefined,
    fallback: T,
  ): T => {
    if (actionVal !== undefined) return actionVal;

    if (globalVal !== undefined && globalVal !== "default") return globalVal as T;

    if (iconDefault !== undefined) return iconDefault;

    return fallback;
  };

  const titleText =
    (actionOverrides?.titleText && actionOverrides.titleText.length > 0 ? actionOverrides.titleText : undefined) ??
    actionDefaultText ??
    iconDefaults.text ??
    "";

  return {
    showTitle: resolve(actionOverrides?.showTitle, globalTitleSettings.showTitle, undefined, TITLE_DEFAULTS.showTitle),
    showGraphics: resolve(
      actionOverrides?.showGraphics,
      globalTitleSettings.showGraphics,
      undefined,
      TITLE_DEFAULTS.showGraphics,
    ),
    titleText,
    bold: resolve(actionOverrides?.bold, globalTitleSettings.bold, undefined, TITLE_DEFAULTS.bold),
    fontSize: resolve(
      actionOverrides?.fontSize,
      globalTitleSettings.fontSize,
      iconDefaults.fontSize,
      TITLE_DEFAULTS.fontSize,
    ),
    position: resolve(
      actionOverrides?.position,
      globalTitleSettings.position,
      iconDefaults.position,
      TITLE_DEFAULTS.position,
    ),
    customPosition: resolve(
      actionOverrides?.customPosition,
      globalTitleSettings.customPosition,
      iconDefaults.customPosition,
      TITLE_DEFAULTS.customPosition,
    ),
  };
}

/**
 * Resolves border options from per-action overrides and an optional state-driven color.
 *
 * @param overrides - Per-action border overrides from settings
 * @param stateColor - Optional state-driven color (e.g., green for ON, red for OFF) that overrides the user-chosen color
 */
export function resolveBorderOptions(
  overrides?: BorderOverrides,
  stateColor?: string,
): { enabled: boolean; width: number; color: string } {
  const enabled = overrides?.enabled ?? false;
  const width = overrides?.width ?? 14;
  const color = stateColor ?? overrides?.color ?? "#00aaff";

  return { enabled, width, color };
}

/**
 * Assembles a final icon data URI from a graphic SVG, resolved colors, and resolved title settings.
 *
 * Steps:
 * 1. Extracts graphic artwork from the SVG (strips wrapper, background, labels)
 * 2. Colorizes the graphic with renderIconTemplate
 * 3. Generates title text with generateTitleText
 * 4. Generates optional border SVG
 * 5. Fills the base template (background + border + graphic + title)
 * 6. Converts to a data URI
 *
 * @param options.graphicSvg - Source SVG template with <desc> metadata
 * @param options.colors - Resolved color values for all slots
 * @param options.title - Fully resolved title settings
 * @param options.borderOverrides - Per-action border settings (optional)
 * @param options.borderStateColor - State-driven border color for toggle actions (optional)
 * @returns SVG data URI string
 */
export function assembleIcon(options: {
  graphicSvg: string;
  colors: Record<string, string>;
  title: ResolvedTitleSettings;
  borderOverrides?: BorderOverrides;
  borderStateColor?: string;
}): string {
  const { graphicSvg, colors, title } = options;

  const rawGraphic = extractGraphicContent(graphicSvg);
  const graphicContent = title.showGraphics ? renderIconTemplate(rawGraphic, colors) : "";

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

  const border = resolveBorderOptions(options.borderOverrides, options.borderStateColor);
  const borderContent = generateBorderSvg(border);

  const svg = renderIconTemplate(ICON_BASE_TEMPLATE, {
    backgroundColor: colors.backgroundColor ?? "#000000",
    borderContent,
    graphicContent,
    titleContent,
  });

  return svgToDataUri(svg);
}
