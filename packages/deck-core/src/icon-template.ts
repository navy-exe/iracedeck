/**
 * Icon Template Utilities
 *
 * Functions for rendering SVG icon templates with placeholder support.
 * Templates use Mustache-style {{placeholder}} syntax.
 *
 * Icons support customizable color slots declared via <desc> JSON metadata.
 * Colors resolve through: per-action override → global default → icon default.
 */

/**
 * Color slots that an icon can declare as customizable.
 * Each slot maps to a Mustache placeholder in the SVG template.
 */
export interface ColorSlots {
  /** Full-canvas background rect fill */
  backgroundColor?: string;
  /** mainLabel + subLabel text fill */
  textColor?: string;
  /** Primary single-color artwork (arrows, outlines) */
  graphic1Color?: string;
  /** Secondary artwork accent element */
  graphic2Color?: string;
}

/**
 * Escapes special XML characters in a string.
 * Use this for text values that will be inserted into SVG.
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Renders a template by replacing {{placeholder}} with values.
 * Values are NOT automatically XML-escaped - use escapeXml() for text content.
 *
 * @param template - The SVG template string with {{placeholder}} markers
 * @param values - Object mapping placeholder names to replacement values
 * @returns The rendered SVG string
 */
export function renderIconTemplate(template: string, values: Record<string, string>): string {
  let result = template;

  for (const [key, value] of Object.entries(values)) {
    // Replace all occurrences of {{key}} with value
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  }

  return result;
}

/**
 * Parses the <desc> element from an SVG template and returns its JSON content.
 * Returns an empty object if the element is missing or its content is not valid JSON.
 *
 * @internal Exported for testing and use by icon-related utilities
 */
export function parseDescMetadata(svgTemplate: string): Record<string, unknown> {
  const descMatch = svgTemplate.match(/<desc>(.*?)<\/desc>/s);

  if (!descMatch) {
    return {};
  }

  try {
    return JSON.parse(descMatch[1]) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/**
 * Parses color slot defaults from an SVG template's <desc> metadata.
 * The <desc> element should contain JSON: {"colors":{"backgroundColor":"#412244",...}}
 *
 * @param svgTemplate - SVG template string containing a <desc> element
 * @returns Declared color slots with their default values, or empty object if no metadata
 *
 * @internal Exported for testing
 */
export function parseIconDefaults(svgTemplate: string): ColorSlots {
  const parsed = parseDescMetadata(svgTemplate);

  return (parsed.colors ?? {}) as ColorSlots;
}

export interface IconTitleDefaults {
  text?: string;
  position?: "top" | "middle" | "bottom" | "custom";
  fontSize?: number;
  customPosition?: number;
}

export function parseIconTitleDefaults(svgTemplate: string): IconTitleDefaults {
  const meta = parseDescMetadata(svgTemplate);

  if (!meta) return {};

  const title = meta.title as Record<string, unknown> | undefined;

  if (!title) return {};

  const pos = title.position;
  const validPositions = new Set(["top", "middle", "bottom", "custom"]);

  return {
    text: typeof title.text === "string" ? title.text : undefined,
    position: typeof pos === "string" && validPositions.has(pos) ? (pos as IconTitleDefaults["position"]) : undefined,
    fontSize: typeof title.fontSize === "number" ? title.fontSize : undefined,
    customPosition: typeof title.customPosition === "number" ? title.customPosition : undefined,
  };
}

export interface IconBorderDefaults {
  borderColor?: string;
}

export function parseIconBorderDefaults(svgTemplate: string): IconBorderDefaults {
  const meta = parseDescMetadata(svgTemplate);

  if (!meta) return {};

  const border = meta.border as Record<string, unknown> | undefined;

  if (!border) return {};

  return {
    borderColor: typeof border.color === "string" ? border.color : undefined,
  };
}

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
  const parsed = parseDescMetadata(svgTemplate);

  return new Set(Array.isArray(parsed.locked) ? (parsed.locked as string[]) : []);
}

/**
 * Resolves icon colors by merging per-action overrides, global defaults, and icon defaults.
 * Only returns keys that the icon declares in its <desc> metadata — unsupported slots are omitted.
 *
 * Resolution chain: actionOverrides → globalColors → icon defaults (from <desc>)
 *
 * @param svgTemplate - SVG template string with <desc> color metadata
 * @param globalColors - User's global color preferences
 * @param actionOverrides - Per-action color overrides (optional)
 * @returns Merged color values for all slots declared by this icon
 *
 * @internal Exported for testing
 */
export function resolveIconColors(
  svgTemplate: string,
  globalColors: ColorSlots,
  actionOverrides?: ColorSlots,
): Record<string, string> {
  const parsed = parseDescMetadata(svgTemplate);
  const defaults = (parsed.colors ?? {}) as ColorSlots;
  const locked = new Set(Array.isArray(parsed.locked) ? (parsed.locked as string[]) : []);
  const result: Record<string, string> = {};

  for (const key of Object.keys(defaults) as (keyof ColorSlots)[]) {
    const defaultValue = defaults[key];

    if (defaultValue === undefined) {
      continue;
    }

    // Filter empty strings and #000001 (legacy sentinel from <sdpi-color> era — kept for backward compat)
    const pick = (v: string | undefined) => (v && v.length > 0 && v !== "#000001" ? v : undefined);

    const globalValue = locked.has(key) ? undefined : pick(globalColors[key]);

    result[key] = pick(actionOverrides?.[key]) ?? globalValue ?? defaultValue;
  }

  return result;
}

/**
 * Options for generating icon text elements.
 */
export interface GenerateIconTextOptions {
  /**
   * The text to display. Use "\n" to create multiple lines.
   */
  text: string;
  /**
   * Font size in pixels. Default: 28
   */
  fontSize?: number;
  /**
   * Base Y position for single line or bottom line of multi-line text. Default: 136
   */
  baseY?: number;
  /**
   * Horizontal center position. Default: 72 (for 144x144 icons). Use 36 for 72x72 templates.
   */
  centerX?: number;
  /**
   * Line height multiplier relative to font size. Default: 1
   */
  lineHeightMultiplier?: number;
  /**
   * Fill color for the text. Default: "#ffffff"
   */
  fill?: string;
}

/**
 * Generates SVG text element(s) for icon display.
 * Supports multi-line text by splitting on "\n".
 *
 * For single line: places text at baseY (default 136)
 * For multiple lines: centers the text block vertically around baseY
 * (each additional line shifts the block up by half the line height)
 *
 * @param options - Configuration options for text generation
 * @returns SVG text element(s) string to be used with {{textElement}} placeholder
 *
 * @example
 * // Single line
 * generateIconText({ text: "+5 L" })
 * // Returns: <text class="title" x="72" y="136" ...>+5 L</text>
 *
 * @example
 * // Multi-line
 * generateIconText({ text: "Line 1\nLine 2", fontSize: 24 })
 * // Returns two <text> elements centered around baseY
 */
export function generateIconText(options: GenerateIconTextOptions): string {
  const { text, fontSize = 28, baseY = 136, centerX = 72, lineHeightMultiplier = 1, fill = "#ffffff" } = options;

  const lines = text.split("\n");
  const lineHeight = fontSize * lineHeightMultiplier;

  if (lines.length === 1) {
    return `<text class="title" x="${centerX}" y="${baseY}" text-anchor="middle" dominant-baseline="central" fill="${fill}" font-family="sans-serif" font-size="${fontSize}" font-weight="bold">${escapeXml(text)}</text>`;
  }

  // For multiple lines, center the text block around baseY
  // Total height of text block is (lines.length - 1) * lineHeight
  // We offset up by half of that to center it
  const totalBlockHeight = (lines.length - 1) * lineHeight;
  const startY = baseY - totalBlockHeight / 2;

  const textElements: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const y = startY + i * lineHeight;
    textElements.push(
      `<text class="title" x="${centerX}" y="${y}" text-anchor="middle" dominant-baseline="central" fill="${fill}" font-family="sans-serif" font-size="${fontSize}" font-weight="bold">${escapeXml(lines[i])}</text>`,
    );
  }

  return textElements.join("\n    ");
}

export function validateIconTemplate(svg: string): string[] {
  const errors: string[] = [];

  // Check viewBox — accept 144x144 (standard) or 72x72 (legacy)
  if (!svg.includes('viewBox="0 0 144 144"') && !svg.includes('viewBox="0 0 72 72"')) {
    errors.push('Missing or incorrect viewBox. Expected: viewBox="0 0 144 144"');
  }

  // Check for activity-state filter group
  if (!svg.includes('filter="url(#activity-state)"')) {
    errors.push('Missing activity-state filter group. Expected: <g filter="url(#activity-state)">');
  }

  // Check SVG namespace
  if (!svg.includes('xmlns="http://www.w3.org/2000/svg"')) {
    errors.push('Missing SVG namespace. Expected: xmlns="http://www.w3.org/2000/svg"');
  }

  return errors;
}
