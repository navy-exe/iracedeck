// Import for local use within this file
import { dataUriToSvg, isDataUri, isRawSvg, svgToDataUri } from "@iracedeck/icon-composer";

/**
 * SVG Overlay Utilities
 *
 * Functions for applying visual overlays to SVG images,
 * used to indicate inactive/disconnected state on Stream Deck buttons.
 *
 * SVG utility functions (svgToDataUri, etc.) are re-exported from @iracedeck/icon-composer.
 */

// Re-export SVG utilities from icon-composer for backward compatibility
export { dataUriToSvg, isDataUri, isRawSvg, svgToDataUri } from "@iracedeck/icon-composer";

/**
 * Converts a hex color to grayscale.
 * Uses luminance formula: 0.299*R + 0.587*G + 0.114*B
 *
 * @param hex - Hex color string (#RGB, #RRGGBB, or without #)
 * @returns Grayscale hex color (#RRGGBB format)
 */
export function hexToGrayscale(hex: string): string {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Validate hex characters
  if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
    return hex;
  }

  let r: number, g: number, b: number;

  if (cleanHex.length === 3) {
    // Short form: #RGB -> #RRGGBB
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.slice(0, 2), 16);
    g = parseInt(cleanHex.slice(2, 4), 16);
    b = parseInt(cleanHex.slice(4, 6), 16);
  } else {
    // Invalid format, return as-is
    return hex;
  }

  // Calculate luminance (perceived brightness)
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);

  // Convert back to hex
  const grayHex = gray.toString(16).padStart(2, "0");

  return `#${grayHex}${grayHex}${grayHex}`;
}

/**
 * Configuration for overlay utilities.
 * @internal Exported for testing - allows tests to enable the overlay
 */
export const overlayConfig = {
  /** Set to true to enable inactive overlay. Currently disabled. */
  inactiveOverlayEnabled: false,
};

export function applyInactiveOverlay(svg: string): string {
  if (!overlayConfig.inactiveOverlayEnabled) {
    return svg;
  }

  const wasDataUri = isDataUri(svg);

  // Convert to raw SVG for manipulation
  let rawSvg: string;

  if (wasDataUri) {
    rawSvg = dataUriToSvg(svg);
  } else if (isRawSvg(svg)) {
    rawSvg = svg;
  } else {
    // Not a valid SVG format, return as-is
    return svg;
  }

  const filters = `<defs>
    <filter id="activity-state">
      <feColorMatrix type="saturate" values="0" />
      <feColorMatrix type="matrix"
        values="0.5 0 0 0 0
                0 0.5 0 0 0
                0 0 0.5 0 0
                0 0 0 1 0" />
    </filter>
  </defs>`;

  let modifiedSvg = rawSvg.replace(/<svg(.*?)>/, `<svg$1>\n${filters}\n`);

  // Check if this SVG has data-no-na="true" which means it wants to keep its original text
  const hasNoNa = modifiedSvg.match(/<svg[^>]*data-no-na="true"[^>]*>/);

  if (!hasNoNa) {
    // Remove all text elements with class="title" (CSS display:none not supported by Stream Deck renderer)
    // Only do this when we're replacing with N/A text
    modifiedSvg = modifiedSvg.replace(/<text[^>]*class="title"[^>]*>.*?<\/text>/g, "");

    const naText = `<text x="72" y="130" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="50" font-weight="bold">N/A</text>`;

    // Add N/A text before closing </g>
    modifiedSvg = modifiedSvg.replace(/<\/g>\s*<\/svg>/, `${naText}\n</g>\n</svg>`);
  }

  // Return in same format as input
  return wasDataUri ? svgToDataUri(modifiedSvg) : modifiedSvg;
}
