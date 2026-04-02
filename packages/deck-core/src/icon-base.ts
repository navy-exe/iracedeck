export const ICON_BASE_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
  <rect x="0" y="0" width="144" height="144" rx="24" fill="{{backgroundColor}}"/>
  {{borderContent}}
  {{graphicContent}}
  {{titleContent}}
</svg>`;

/**
 * Generates an SVG border rect element.
 * The stroke is centered on the 144x144 canvas boundary (edge-to-edge),
 * so the outer half is clipped by the viewBox.
 */
/**
 * Generates border SVG elements: a defs block (for the glow filter) and rect elements.
 * Callers must place `defs` as a direct child of `<svg>` and `rects` at the desired layer.
 * For convenience, `toString()` returns defs + rects concatenated (safe when used in ICON_BASE_TEMPLATE
 * where {{borderContent}} is a direct child of `<svg>`).
 */
export function generateBorderSvg(options: { enabled: boolean; width: number; color: string }): string {
  if (!options.enabled) return "";

  const glowWidth = Math.min(options.width * 2.5, 60);
  const glowStdDev = 6;
  const glowOpacity = 0.4;

  const defs = `<defs><filter id="ird-border-glow"><feGaussianBlur stdDeviation="${glowStdDev}"/></filter></defs>`;
  const rects =
    `<rect x="0" y="0" width="144" height="144" rx="24" fill="none" stroke="${options.color}" stroke-width="${glowWidth}" opacity="${glowOpacity}" filter="url(#ird-border-glow)"/>` +
    `<rect x="0" y="0" width="144" height="144" rx="24" fill="none" stroke="${options.color}" stroke-width="${options.width}"/>`;

  return defs + rects;
}

/**
 * Generates border SVG with defs and rects separated for dynamic templates
 * where {{borderContent}} is inside a `<g>` element and `<defs>` must be placed
 * as a direct child of `<svg>`.
 */
export function generateBorderParts(options: { enabled: boolean; width: number; color: string }): {
  defs: string;
  rects: string;
} {
  if (!options.enabled) return { defs: "", rects: "" };

  const glowWidth = Math.min(options.width * 2.5, 60);
  const glowStdDev = 6;
  const glowOpacity = 0.4;

  return {
    defs: `<defs><filter id="ird-border-glow"><feGaussianBlur stdDeviation="${glowStdDev}"/></filter></defs>`,
    rects:
      `<rect x="0" y="0" width="144" height="144" rx="24" fill="none" stroke="${options.color}" stroke-width="${glowWidth}" opacity="${glowOpacity}" filter="url(#ird-border-glow)"/>` +
      `<rect x="0" y="0" width="144" height="144" rx="24" fill="none" stroke="${options.color}" stroke-width="${options.width}"/>`,
  };
}

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
  // Only strip the closing </g> if the opening <g filter> was found and removed
  const hadActivityState = /<g\s+filter="url\(#activity-state\)"\s*>/.test(content);

  if (hadActivityState) {
    content = content.replace(/<g\s+filter="url\(#activity-state\)"\s*>/, "");
    content = content.replace(/<\/g>\s*$/, "");
  }

  // Remove <defs> and <filter> elements — activity-state filter is applied at render time by the overlay system
  content = content.replace(/<defs>[\s\S]*?<\/defs>/, "");

  return content.trim();
}
