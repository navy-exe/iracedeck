#!/usr/bin/env node

/**
 * One-off script to convert the toggle-tires car SVG from 512-space + complex
 * transform chain to native 144x144 coordinates.
 *
 * Transform: translate(72, 53) rotate(-90) scale(0.176) translate(-256, -256)
 * Combined matrix: x' = 0.176 * py + 26.944, y' = -0.176 * px + 98.056
 */

// Transform a point from 512-space to 144-space
function transformPoint(px, py) {
  return {
    x: Math.round((0.176 * py + 26.944) * 100) / 100,
    y: Math.round((-0.176 * px + 98.056) * 100) / 100,
  };
}

// Transform the polygon points
const polygonPoints = [
  [57.147, 175.343],
  [0.009, 175.343],
  [0, 336.647],
  [57.147, 336.647],
];

console.log("=== Left side panel (polygon) ===");
const transformedPolygon = polygonPoints.map(([px, py]) => {
  const { x, y } = transformPoint(px, py);
  return `${x},${y}`;
});
console.log(`points="${transformedPolygon.join(" ")}"`);

// Transform key absolute coordinates from the paths
console.log("\n=== Key coordinates ===");

const keyPoints = [
  { label: "Right top panel start", px: 448.118, py: 351.402 },
  { label: "Right top panel h+47", px: 495.136, py: 351.402 },
  { label: "Right bottom panel start", px: 495.136, py: 160.599 },
  { label: "Main body nose", px: 503.763, py: 245.781 },
  { label: "Main body center", px: 256, py: 256 },
  { label: "Main body rear", px: 0, py: 256 },
  { label: "Window center", px: 295.895, py: 280.275 },
  { label: "Canvas center", px: 256, py: 256 },
];

for (const p of keyPoints) {
  const { x, y } = transformPoint(p.px, p.py);
  console.log(`${p.label}: (${p.px}, ${p.py}) → (${x}, ${y})`);
}

// Tire centers in 512-space
console.log("\n=== Tire centers ===");
const tires = [
  { label: "LF", px: 381, py: 114 },
  { label: "RF", px: 381, py: 398 },
  { label: "LR", px: 98, py: 107 },
  { label: "RR", px: 98, py: 405 },
];

for (const t of tires) {
  const { x, y } = transformPoint(t.px, t.py);
  console.log(`${t.label}: (${t.px}, ${t.py}) → (${x}, ${y})`);
}

// Tire rectangle corners (approximate from the path data)
console.log("\n=== Tire rectangles (approx corners) ===");
const tireRects = [
  { label: "LF", x1: 346, y1: 109, x2: 425, y2: 158 },
  { label: "RF", x1: 346, y1: 354, x2: 425, y2: 403 },
  { label: "LR", x1: 52, y1: 103, x2: 145, y2: 160 },
  { label: "RR", x1: 52, y1: 352, x2: 145, y2: 408 },
];

for (const t of tireRects) {
  const tl = transformPoint(t.x1, t.y1);
  const br = transformPoint(t.x2, t.y2);
  const w = Math.abs(br.x - tl.x);
  const h = Math.abs(br.y - tl.y);
  const minX = Math.min(tl.x, br.x);
  const minY = Math.min(tl.y, br.y);
  console.log(`${t.label}: (${minX}, ${minY}) w=${w} h=${h}`);
}

// Full transform matrix for reference
console.log("\n=== SVG matrix transform ===");
console.log('transform="matrix(0, -0.176, 0.176, 0, 26.944, 98.056)"');
