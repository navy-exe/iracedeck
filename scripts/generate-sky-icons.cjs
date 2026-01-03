const { PNG } = require("pngjs");
const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "fi.lampen.niklas.iracedeck.sdPlugin", "imgs", "actions", "sky");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

// Color definitions
const colors = {
	clear: { bg: [74, 144, 217], sun: [255, 220, 50] }, // Blue sky, yellow sun
	partlyCloudy: { bg: [123, 163, 201], sun: [255, 220, 50], cloud: [240, 240, 245] },
	mostlyCloudy: { bg: [136, 153, 170], cloud: [200, 200, 210] },
	overcast: { bg: [90, 101, 112], cloud: [140, 145, 155] },
	disconnected: { bg: [45, 45, 45], text: [128, 128, 128] },
};

function createPNG(width, height, drawFunc) {
	const png = new PNG({ width, height });
	drawFunc(png);
	return PNG.sync.write(png);
}

function setPixel(png, x, y, r, g, b, a = 255) {
	if (x < 0 || x >= png.width || y < 0 || y >= png.height) return;
	const idx = (png.width * y + x) << 2;
	png.data[idx] = r;
	png.data[idx + 1] = g;
	png.data[idx + 2] = b;
	png.data[idx + 3] = a;
}

function fillRect(png, x, y, w, h, r, g, b, a = 255) {
	for (let py = y; py < y + h; py++) {
		for (let px = x; px < x + w; px++) {
			setPixel(png, px, py, r, g, b, a);
		}
	}
}

function fillCircle(png, cx, cy, radius, r, g, b, a = 255) {
	for (let y = -radius; y <= radius; y++) {
		for (let x = -radius; x <= radius; x++) {
			if (x * x + y * y <= radius * radius) {
				setPixel(png, cx + x, cy + y, r, g, b, a);
			}
		}
	}
}

function fillEllipse(png, cx, cy, rx, ry, r, g, b, a = 255) {
	for (let y = -ry; y <= ry; y++) {
		for (let x = -rx; x <= rx; x++) {
			if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) {
				setPixel(png, cx + x, cy + y, r, g, b, a);
			}
		}
	}
}

function drawCloud(png, cx, cy, scale, color) {
	const [r, g, b] = color;
	// Draw a fluffy cloud shape using overlapping circles
	fillCircle(png, cx - scale * 12, cy + scale * 2, scale * 10, r, g, b);
	fillCircle(png, cx, cy - scale * 4, scale * 14, r, g, b);
	fillCircle(png, cx + scale * 14, cy, scale * 11, r, g, b);
	fillCircle(png, cx + scale * 6, cy + scale * 4, scale * 10, r, g, b);
	fillCircle(png, cx - scale * 6, cy + scale * 6, scale * 8, r, g, b);
}

function drawSun(png, cx, cy, radius, color) {
	const [r, g, b] = color;
	fillCircle(png, cx, cy, radius, r, g, b);

	// Draw rays
	const rayLength = radius * 0.6;
	const rayWidth = 2;
	for (let angle = 0; angle < 360; angle += 45) {
		const rad = (angle * Math.PI) / 180;
		const startDist = radius + 3;
		const endDist = radius + rayLength;
		for (let d = startDist; d < endDist; d++) {
			const x = Math.round(cx + Math.cos(rad) * d);
			const y = Math.round(cy + Math.sin(rad) * d);
			for (let w = -rayWidth / 2; w <= rayWidth / 2; w++) {
				const wx = Math.round(cx + Math.cos(rad) * d + Math.cos(rad + Math.PI / 2) * w);
				const wy = Math.round(cy + Math.sin(rad) * d + Math.sin(rad + Math.PI / 2) * w);
				setPixel(png, wx, wy, r, g, b);
			}
		}
	}
}

// Generate key images (72x72 and 144x144)
function generateKeyImages() {
	const sizes = [
		{ size: 72, suffix: "" },
		{ size: 144, suffix: "@2x" },
	];

	for (const { size, suffix } of sizes) {
		const scale = size / 72;

		// Clear sky - sun
		const clearPng = createPNG(size, size, (png) => {
			const [bgR, bgG, bgB] = colors.clear.bg;
			fillRect(png, 0, 0, size, size, bgR, bgG, bgB);
			drawSun(png, size / 2, size / 2, 18 * scale, colors.clear.sun);
		});
		fs.writeFileSync(path.join(outputDir, `key-clear${suffix}.png`), clearPng);

		// Partly cloudy - sun with small cloud
		const partlyPng = createPNG(size, size, (png) => {
			const [bgR, bgG, bgB] = colors.partlyCloudy.bg;
			fillRect(png, 0, 0, size, size, bgR, bgG, bgB);
			drawSun(png, size * 0.35, size * 0.35, 14 * scale, colors.partlyCloudy.sun);
			drawCloud(png, size * 0.55, size * 0.6, scale * 0.8, colors.partlyCloudy.cloud);
		});
		fs.writeFileSync(path.join(outputDir, `key-partly${suffix}.png`), partlyPng);

		// Mostly cloudy - clouds with hint of sun
		const mostlyPng = createPNG(size, size, (png) => {
			const [bgR, bgG, bgB] = colors.mostlyCloudy.bg;
			fillRect(png, 0, 0, size, size, bgR, bgG, bgB);
			// Faint sun peeking
			fillCircle(png, size * 0.25, size * 0.3, 8 * scale, 180, 180, 140);
			drawCloud(png, size * 0.5, size * 0.55, scale, colors.mostlyCloudy.cloud);
		});
		fs.writeFileSync(path.join(outputDir, `key-mostly${suffix}.png`), mostlyPng);

		// Overcast - dark clouds
		const overcastPng = createPNG(size, size, (png) => {
			const [bgR, bgG, bgB] = colors.overcast.bg;
			fillRect(png, 0, 0, size, size, bgR, bgG, bgB);
			drawCloud(png, size * 0.35, size * 0.4, scale * 0.7, colors.overcast.cloud);
			drawCloud(png, size * 0.6, size * 0.55, scale * 0.85, colors.overcast.cloud);
		});
		fs.writeFileSync(path.join(outputDir, `key-overcast${suffix}.png`), overcastPng);

		// Default key (used when not connected)
		const keyPng = createPNG(size, size, (png) => {
			const [bgR, bgG, bgB] = colors.disconnected.bg;
			fillRect(png, 0, 0, size, size, bgR, bgG, bgB);
			// Draw a simple cloud outline to indicate "sky" action
			drawCloud(png, size * 0.5, size * 0.5, scale * 0.8, [80, 80, 85]);
		});
		fs.writeFileSync(path.join(outputDir, `key${suffix}.png`), keyPng);
	}
}

// Generate icon images (20x20 and 40x40 for action list)
function generateIconImages() {
	const sizes = [
		{ size: 20, suffix: "" },
		{ size: 40, suffix: "@2x" },
	];

	for (const { size, suffix } of sizes) {
		const scale = size / 20;

		const iconPng = createPNG(size, size, (png) => {
			// Transparent background with a small sun/cloud icon
			// Draw a small sun
			fillCircle(png, size * 0.35, size * 0.4, 4 * scale, 255, 220, 50);
			// Draw a small cloud
			fillCircle(png, size * 0.55, size * 0.55, 3 * scale, 220, 220, 230);
			fillCircle(png, size * 0.65, size * 0.5, 3 * scale, 220, 220, 230);
			fillCircle(png, size * 0.6, size * 0.6, 2.5 * scale, 220, 220, 230);
		});
		fs.writeFileSync(path.join(outputDir, `icon${suffix}.png`), iconPng);
	}
}

console.log("Generating sky icons...");
generateKeyImages();
generateIconImages();
console.log("Done! Icons saved to:", outputDir);
