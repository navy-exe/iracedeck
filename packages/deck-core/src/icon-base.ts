export const ICON_BASE_TEMPLATE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
  <rect x="0" y="0" width="144" height="144" fill="{{backgroundColor}}"/>
  {{graphicContent}}
  {{titleContent}}
</svg>`;

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

  // Remove <defs> and <filter> elements (activity-state filter is in base now)
  content = content.replace(/<defs>[\s\S]*?<\/defs>/, "");

  return content.trim();
}
