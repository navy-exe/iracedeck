import type { TitleOverrides } from "./common-settings.js";
import { extractGraphicContent, ICON_BASE_TEMPLATE } from "./icon-base.js";
import { escapeXml, parseIconTitleDefault, renderIconTemplate } from "./icon-template.js";
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

/**
 * Assembles a final icon data URI from a graphic SVG, resolved colors, and resolved title settings.
 *
 * Steps:
 * 1. Extracts graphic artwork from the SVG (strips wrapper, background, labels)
 * 2. Colorizes the graphic with renderIconTemplate
 * 3. Generates title text with generateTitleText
 * 4. Fills the base template (background + graphic + title)
 * 5. Converts to a data URI
 *
 * @param options.graphicSvg - Source SVG template with <desc> metadata
 * @param options.colors - Resolved color values for all slots
 * @param options.title - Fully resolved title settings
 * @returns SVG data URI string
 */
export function assembleIcon(options: {
  graphicSvg: string;
  colors: Record<string, string>;
  title: ResolvedTitleSettings;
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

  const svg = renderIconTemplate(ICON_BASE_TEMPLATE, {
    backgroundColor: colors.backgroundColor ?? "#000000",
    graphicContent,
    titleContent,
  });

  return svgToDataUri(svg);
}
