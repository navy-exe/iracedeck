#!/usr/bin/env node

/**
 * Artwork Bounds Generator
 *
 * Parses SVG icon files and computes approximate bounding boxes from their
 * graphical elements. Writes an "artworkBounds" field into each icon's <desc>
 * JSON metadata for use by the assembleIcon() graphic scaling pipeline.
 *
 * Usage:
 *   node scripts/generate-artwork-bounds.mjs           # Write bounds to all icons
 *   node scripts/generate-artwork-bounds.mjs --dry-run  # Show changes without writing
 *   node scripts/generate-artwork-bounds.mjs --force    # Overwrite existing artworkBounds
 */

import fs from "node:fs";
import path from "node:path";

const ICONS_DIR = path.resolve("packages/icons");
const SKIP_DIRS = new Set(["preview", "node_modules", "src", "dist"]);

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

let totalProcessed = 0;
let totalSkipped = 0;
let totalWritten = 0;
let totalErrors = 0;

// ---------------------------------------------------------------------------
// SVG element bounding box extractors
// ---------------------------------------------------------------------------

function num(attrs, name, fallback = 0) {
  const match = attrs.match(new RegExp(`${name}="([^"]+)"`));
  return match ? parseFloat(match[1]) : fallback;
}

function parsePoints(attrs) {
  const match = attrs.match(/points="([^"]+)"/);
  if (!match) return [];
  return match[1]
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .reduce((acc, val, i, arr) => {
      if (i % 2 === 0 && i + 1 < arr.length) {
        acc.push({ x: val, y: arr[i + 1] });
      }
      return acc;
    }, []);
}

/**
 * Simplified path data parser — extracts min/max coordinates from path commands.
 * Uses control points for bezier curves (slightly overestimates bounds, which is fine).
 */
function parsePathBounds(attrs) {
  const dMatch = attrs.match(/d="([^"]+)"/);
  if (!dMatch) return null;
  const d = dMatch[1];

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  let curX = 0,
    curY = 0;
  let found = false;

  const tokens = d.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];

  for (const token of tokens) {
    const cmd = token[0];
    const nums = token
      .slice(1)
      .trim()
      .match(/-?\d+\.?\d*/g);
    const values = nums ? nums.map(Number) : [];

    switch (cmd) {
      case "M":
        for (let i = 0; i + 1 < values.length; i += 2) {
          curX = values[i];
          curY = values[i + 1];
          update(curX, curY);
        }
        break;
      case "m":
        for (let i = 0; i + 1 < values.length; i += 2) {
          curX += values[i];
          curY += values[i + 1];
          update(curX, curY);
        }
        break;
      case "L":
        for (let i = 0; i + 1 < values.length; i += 2) {
          curX = values[i];
          curY = values[i + 1];
          update(curX, curY);
        }
        break;
      case "l":
        for (let i = 0; i + 1 < values.length; i += 2) {
          curX += values[i];
          curY += values[i + 1];
          update(curX, curY);
        }
        break;
      case "H":
        for (const v of values) {
          curX = v;
          update(curX, curY);
        }
        break;
      case "h":
        for (const v of values) {
          curX += v;
          update(curX, curY);
        }
        break;
      case "V":
        for (const v of values) {
          curY = v;
          update(curX, curY);
        }
        break;
      case "v":
        for (const v of values) {
          curY += v;
          update(curX, curY);
        }
        break;
      case "C":
        for (let i = 0; i + 5 < values.length; i += 6) {
          update(values[i], values[i + 1]);
          update(values[i + 2], values[i + 3]);
          curX = values[i + 4];
          curY = values[i + 5];
          update(curX, curY);
        }
        break;
      case "c":
        for (let i = 0; i + 5 < values.length; i += 6) {
          update(curX + values[i], curY + values[i + 1]);
          update(curX + values[i + 2], curY + values[i + 3]);
          curX += values[i + 4];
          curY += values[i + 5];
          update(curX, curY);
        }
        break;
      case "S":
        for (let i = 0; i + 3 < values.length; i += 4) {
          update(values[i], values[i + 1]);
          curX = values[i + 2];
          curY = values[i + 3];
          update(curX, curY);
        }
        break;
      case "s":
        for (let i = 0; i + 3 < values.length; i += 4) {
          update(curX + values[i], curY + values[i + 1]);
          curX += values[i + 2];
          curY += values[i + 3];
          update(curX, curY);
        }
        break;
      case "Q":
        for (let i = 0; i + 3 < values.length; i += 4) {
          update(values[i], values[i + 1]);
          curX = values[i + 2];
          curY = values[i + 3];
          update(curX, curY);
        }
        break;
      case "q":
        for (let i = 0; i + 3 < values.length; i += 4) {
          update(curX + values[i], curY + values[i + 1]);
          curX += values[i + 2];
          curY += values[i + 3];
          update(curX, curY);
        }
        break;
      case "A":
        for (let i = 0; i + 6 < values.length; i += 7) {
          curX = values[i + 5];
          curY = values[i + 6];
          update(curX, curY);
        }
        break;
      case "a":
        for (let i = 0; i + 6 < values.length; i += 7) {
          curX += values[i + 5];
          curY += values[i + 6];
          update(curX, curY);
        }
        break;
      case "T":
        for (let i = 0; i + 1 < values.length; i += 2) {
          curX = values[i];
          curY = values[i + 1];
          update(curX, curY);
        }
        break;
      case "t":
        for (let i = 0; i + 1 < values.length; i += 2) {
          curX += values[i];
          curY += values[i + 1];
          update(curX, curY);
        }
        break;
      // Z/z: close path, no coordinates
    }
  }

  function update(x, y) {
    found = true;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }

  if (!found) return null;
  return { minX, minY, maxX, maxY };
}

function rectBounds(attrs) {
  const x = num(attrs, "x");
  const y = num(attrs, "y");
  const w = num(attrs, "width");
  const h = num(attrs, "height");
  if (w === 0 && h === 0) return null;
  return { minX: x, minY: y, maxX: x + w, maxY: y + h };
}

function circleBounds(attrs) {
  const cx = num(attrs, "cx");
  const cy = num(attrs, "cy");
  const r = num(attrs, "r");
  if (r === 0) return null;
  return { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r };
}

function ellipseBounds(attrs) {
  const cx = num(attrs, "cx");
  const cy = num(attrs, "cy");
  const rx = num(attrs, "rx");
  const ry = num(attrs, "ry");
  if (rx === 0 && ry === 0) return null;
  return { minX: cx - rx, minY: cy - ry, maxX: cx + rx, maxY: cy + ry };
}

function lineBounds(attrs) {
  const x1 = num(attrs, "x1");
  const y1 = num(attrs, "y1");
  const x2 = num(attrs, "x2");
  const y2 = num(attrs, "y2");
  return {
    minX: Math.min(x1, x2),
    minY: Math.min(y1, y2),
    maxX: Math.max(x1, x2),
    maxY: Math.max(y1, y2),
  };
}

function polyBounds(attrs) {
  const points = parsePoints(attrs);
  if (points.length === 0) return null;
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

function textBounds(attrs) {
  const x = num(attrs, "x");
  const y = num(attrs, "y");
  const fontSize = num(attrs, "font-size", 16);
  return {
    minX: x - fontSize * 1.5,
    minY: y - fontSize / 2,
    maxX: x + fontSize * 1.5,
    maxY: y + fontSize / 2,
  };
}

// ---------------------------------------------------------------------------
// Transform parsing
// ---------------------------------------------------------------------------

function parseTransform(attrs) {
  const match = attrs.match(/transform="([^"]+)"/);
  if (!match) return null;
  const t = match[1];

  let tx = 0,
    ty = 0,
    sx = 1,
    sy = 1;

  const translateMatch = t.match(/translate\(\s*(-?\d+\.?\d*)\s*,?\s*(-?\d+\.?\d*)?\s*\)/);
  if (translateMatch) {
    tx = parseFloat(translateMatch[1]);
    ty = parseFloat(translateMatch[2] || "0");
  }

  const scaleMatch = t.match(/scale\(\s*(-?\d+\.?\d*)\s*(?:,\s*(-?\d+\.?\d*))?\s*\)/);
  if (scaleMatch) {
    sx = parseFloat(scaleMatch[1]);
    sy = scaleMatch[2] ? parseFloat(scaleMatch[2]) : sx;
  }

  return { tx, ty, sx, sy };
}

function applyTransform(bounds, transform) {
  if (!transform || !bounds) return bounds;
  const { tx, ty, sx, sy } = transform;

  const x1 = bounds.minX * sx + tx;
  const y1 = bounds.minY * sy + ty;
  const x2 = bounds.maxX * sx + tx;
  const y2 = bounds.maxY * sy + ty;

  return {
    minX: Math.min(x1, x2),
    minY: Math.min(y1, y2),
    maxX: Math.max(x1, x2),
    maxY: Math.max(y1, y2),
  };
}

// ---------------------------------------------------------------------------
// Main SVG bounds computation
// ---------------------------------------------------------------------------

function unionBounds(a, b) {
  if (!a) return b;
  if (!b) return a;
  return {
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  };
}

function computeSvgBounds(svgContent) {
  // Strip <svg> wrapper, <desc>, and background rect (same as extractGraphicContent)
  let content = svgContent;
  content = content.replace(/<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  content = content.replace(/<desc>[\s\S]*?<\/desc>/, "");
  content = content.replace(/<rect[^>]*width="144"[^>]*height="144"[^>]*fill="\{\{backgroundColor\}\}"[^>]*\/?>/i, "");
  content = content.replace(/<text[^>]*>\{\{mainLabel\}\}<\/text>/g, "");
  content = content.replace(/<text[^>]*>\{\{subLabel\}\}<\/text>/g, "");

  // Remove activity-state filter wrapper but keep content
  const hadActivityState = /<g\s+filter="url\(#activity-state\)"\s*>/.test(content);
  if (hadActivityState) {
    content = content.replace(/<g\s+filter="url\(#activity-state\)"\s*>/, "");
    content = content.replace(/<\/g>\s*$/, "");
  }
  content = content.replace(/<defs>[\s\S]*?<\/defs>/, "");

  let overall = null;

  // Handle <g transform="..."> groups
  const gTransformRegex = /<g\s+transform="([^"]+)"[^>]*>([\s\S]*?)<\/g>/g;
  let gMatch;
  const processedRanges = [];

  while ((gMatch = gTransformRegex.exec(content)) !== null) {
    const gAttrs = gMatch[0].substring(0, gMatch[0].indexOf(">"));
    const innerContent = gMatch[2];
    const transform = parseTransform(gAttrs);

    const innerBounds = computeElementBounds(innerContent);
    const transformed = applyTransform(innerBounds, transform);
    overall = unionBounds(overall, transformed);

    processedRanges.push({ start: gMatch.index, end: gMatch.index + gMatch[0].length });
  }

  // Process elements outside of transform groups
  let outsideContent = content;
  for (const range of processedRanges.sort((a, b) => b.start - a.start)) {
    outsideContent = outsideContent.substring(0, range.start) + outsideContent.substring(range.end);
  }

  const outsideBounds = computeElementBounds(outsideContent);
  overall = unionBounds(overall, outsideBounds);

  return overall;
}

function computeElementBounds(content) {
  let overall = null;
  let match;

  // rect
  const rectRegex = /<rect\b([^>]*)\/?>/g;
  while ((match = rectRegex.exec(content)) !== null) {
    overall = unionBounds(overall, rectBounds(match[1]));
  }

  // circle
  const circleRegex = /<circle\b([^>]*)\/?>/g;
  while ((match = circleRegex.exec(content)) !== null) {
    overall = unionBounds(overall, circleBounds(match[1]));
  }

  // ellipse
  const ellipseRegex = /<ellipse\b([^>]*)\/?>/g;
  while ((match = ellipseRegex.exec(content)) !== null) {
    overall = unionBounds(overall, ellipseBounds(match[1]));
  }

  // line
  const lineRegex = /<line\b([^>]*)\/?>/g;
  while ((match = lineRegex.exec(content)) !== null) {
    overall = unionBounds(overall, lineBounds(match[1]));
  }

  // polyline and polygon
  const polyRegex = /<poly(?:line|gon)\b([^>]*)\/?>/g;
  while ((match = polyRegex.exec(content)) !== null) {
    overall = unionBounds(overall, polyBounds(match[1]));
  }

  // path
  const pathRegex = /<path\b([^>]*)\/?>/g;
  while ((match = pathRegex.exec(content)) !== null) {
    overall = unionBounds(overall, parsePathBounds(match[1]));
  }

  // text
  const textRegex = /<text\b([^>]*)>/g;
  while ((match = textRegex.exec(content)) !== null) {
    overall = unionBounds(overall, textBounds(match[1]));
  }

  return overall;
}

// ---------------------------------------------------------------------------
// File processing
// ---------------------------------------------------------------------------

function parseDescFull(svg) {
  const descMatch = svg.match(/<desc>(.*?)<\/desc>/s);
  if (!descMatch) return null;
  try {
    return JSON.parse(descMatch[1]);
  } catch {
    return null;
  }
}

function processIcon(filePath) {
  const svg = fs.readFileSync(filePath, "utf-8");
  const relPath = path.relative(ICONS_DIR, filePath);
  const meta = parseDescFull(svg);

  if (!meta) {
    totalSkipped++;
    return;
  }

  // Skip if artworkBounds already exists and --force not set
  if (meta.artworkBounds && !force) {
    totalSkipped++;
    return;
  }

  totalProcessed++;

  const bounds = computeSvgBounds(svg);

  if (!bounds || !isFinite(bounds.minX) || !isFinite(bounds.minY)) {
    console.warn(`  Warning: ${relPath}: could not compute bounds`);
    totalErrors++;
    return;
  }

  // Add 4px padding to account for stroke widths the parser may underestimate
  const PAD = 4;
  const artworkBounds = {
    x: Math.max(0, Math.floor(bounds.minX - PAD)),
    y: Math.max(0, Math.floor(bounds.minY - PAD)),
    width: Math.ceil(bounds.maxX - bounds.minX + 2 * PAD),
    height: Math.ceil(bounds.maxY - bounds.minY + 2 * PAD),
  };

  // Clamp to canvas
  artworkBounds.width = Math.min(artworkBounds.width, 144 - artworkBounds.x);
  artworkBounds.height = Math.min(artworkBounds.height, 144 - artworkBounds.y);

  if (dryRun) {
    console.log(`  ${relPath}: ${JSON.stringify(artworkBounds)}`);
    totalWritten++;
    return;
  }

  // Update the <desc> JSON
  meta.artworkBounds = artworkBounds;
  const newDesc = `<desc>${JSON.stringify(meta)}</desc>`;
  const updatedSvg = svg.replace(/<desc>.*?<\/desc>/s, newDesc);

  fs.writeFileSync(filePath, updatedSvg, "utf-8");
  totalWritten++;
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.name.endsWith(".svg")) {
      processIcon(fullPath);
    }
  }
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

console.log(`${dryRun ? "[DRY RUN] " : ""}Generating artworkBounds for icons in ${ICONS_DIR}`);
if (force) console.log("  --force: overwriting existing artworkBounds");

walkDir(ICONS_DIR);

console.log();
console.log(`Processed: ${totalProcessed}`);
console.log(`Written:   ${totalWritten}`);
console.log(`Skipped:   ${totalSkipped}`);
if (totalErrors > 0) console.log(`Errors:    ${totalErrors}`);
