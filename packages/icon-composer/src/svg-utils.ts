/**
 * SVG Utility Functions
 *
 * Pure utility functions for SVG data URI conversion and format detection.
 */

/**
 * Checks if a string is a base64 data URI
 */
export function isDataUri(value: string): boolean {
  return value.startsWith("data:");
}

/**
 * Checks if a string is raw SVG (starts with <svg or <?xml)
 */
export function isRawSvg(value: string): boolean {
  const trimmed = value.trim();

  return trimmed.startsWith("<svg") || trimmed.startsWith("<?xml");
}

/**
 * Converts raw SVG string to base64 data URI
 */
export function svgToDataUri(rawSvg: string): string {
  return `data:image/svg+xml;base64,${Buffer.from(rawSvg).toString("base64")}`;
}

/**
 * Converts base64 SVG data URI to raw SVG string
 */
export function dataUriToSvg(dataUri: string): string {
  // Handle both base64 and plain text data URIs
  const base64Match = dataUri.match(/^data:image\/svg\+xml;base64,(.+)$/);

  if (base64Match) {
    return Buffer.from(base64Match[1], "base64").toString("utf-8");
  }

  // Plain text data URI (rarely used but supported)
  const plainMatch = dataUri.match(/^data:image\/svg\+xml,(.+)$/);

  if (plainMatch) {
    return decodeURIComponent(plainMatch[1]);
  }

  throw new Error("Invalid SVG data URI format");
}
