/**
 * Icon Template Utilities
 *
 * Functions for loading and rendering SVG icon templates with placeholder support.
 * Templates use Mustache-style {{placeholder}} syntax.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { svgToDataUri } from "./overlay-utils.js";

/**
 * Cache for loaded templates to avoid repeated file I/O
 */
const templateCache = new Map<string, string>();

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
 * Loads an SVG template from the file system.
 *
 * @param pluginPath - Base path to the .sdPlugin directory
 * @param actionName - Name of the action (e.g., "do-fuel-add" or "vehicle/display-gear")
 * @returns The raw SVG template string
 */
export function loadIconTemplate(pluginPath: string, actionName: string): string {
  const cacheKey = `${pluginPath}:${actionName}`;

  const cached = templateCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const templatePath = join(pluginPath, "imgs", "actions", actionName, "key-template.svg");
  const template = readFileSync(templatePath, "utf-8");

  templateCache.set(cacheKey, template);

  return template;
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
 * Loads a template, renders it with values, and converts to data URI.
 *
 * @param pluginPath - Base path to the .sdPlugin directory
 * @param actionName - Name of the action (e.g., "do-fuel-add" or "vehicle/display-gear")
 * @param values - Object mapping placeholder names to replacement values
 * @returns Base64-encoded data URI for the rendered SVG
 */
export function renderIcon(pluginPath: string, actionName: string, values: Record<string, string>): string {
  const template = loadIconTemplate(pluginPath, actionName);
  const rendered = renderIconTemplate(template, values);

  return svgToDataUri(rendered);
}

/**
 * Clears the template cache.
 * Useful for testing or when templates may have changed.
 */
export function clearTemplateCache(): void {
  templateCache.clear();
}

/**
 * Validates that an SVG template follows the required format.
 * Returns an array of validation errors (empty if valid).
 *
 * Required format:
 * - viewBox="0 0 72 72"
 * - Contains <g filter="url(#activity-state)">
 * - Text elements at y="65" for bottom positioning
 * - Dynamic text elements have class="title"
 */
export function validateIconTemplate(svg: string): string[] {
  const errors: string[] = [];

  // Check viewBox
  if (!svg.includes('viewBox="0 0 72 72"')) {
    errors.push('Missing or incorrect viewBox. Expected: viewBox="0 0 72 72"');
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
