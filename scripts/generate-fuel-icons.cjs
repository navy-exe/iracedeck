const { PNG } = require("pngjs");
const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "..", "fi.lampen.niklas.iracedeck.sdPlugin", "imgs", "actions", "fuel-add");

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

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

function drawRoundedRect(png, x, y, w, h, radius, r, g, b, a = 255) {
	// Fill main rectangles
	fillRect(png, x + radius, y, w - 2 * radius, h, r, g, b, a);
	fillRect(png, x, y + radius, w, h - 2 * radius, r, g, b, a);

	// Fill corners with circles
	for (let cy = 0; cy <= radius; cy++) {
		for (let cx = 0; cx <= radius; cx++) {
			if (cx * cx + cy * cy <= radius * radius) {
				// Top-left
				setPixel(png, x + radius - cx, y + radius - cy, r, g, b, a);
				// Top-right
				setPixel(png, x + w - radius + cx - 1, y + radius - cy, r, g, b, a);
				// Bottom-left
				setPixel(png, x + radius - cx, y + h - radius + cy - 1, r, g, b, a);
				// Bottom-right
				setPixel(png, x + w - radius + cx - 1, y + h - radius + cy - 1, r, g, b, a);
			}
		}
	}
}

function drawFuelPump(png, cx, cy, scale, color) {
	const [r, g, b] = color;

	// Main pump body
	const bodyW = Math.round(24 * scale);
	const bodyH = Math.round(32 * scale);
	const bodyX = Math.round(cx - bodyW / 2 - 4 * scale);
	const bodyY = Math.round(cy - bodyH / 2 + 2 * scale);
	drawRoundedRect(png, bodyX, bodyY, bodyW, bodyH, Math.round(3 * scale), r, g, b);

	// Nozzle handle
	const nozzleStartX = bodyX + bodyW;
	const nozzleStartY = Math.round(cy - 6 * scale);
	fillRect(png, nozzleStartX, nozzleStartY, Math.round(8 * scale), Math.round(4 * scale), r, g, b);

	// Nozzle curve down
	fillRect(
		png,
		Math.round(nozzleStartX + 6 * scale),
		nozzleStartY,
		Math.round(4 * scale),
		Math.round(12 * scale),
		r,
		g,
		b,
	);

	// Nozzle tip
	fillRect(
		png,
		Math.round(nozzleStartX + 4 * scale),
		Math.round(nozzleStartY + 10 * scale),
		Math.round(8 * scale),
		Math.round(4 * scale),
		r,
		g,
		b,
	);
	fillRect(
		png,
		Math.round(nozzleStartX + 5 * scale),
		Math.round(nozzleStartY + 14 * scale),
		Math.round(6 * scale),
		Math.round(6 * scale),
		r,
		g,
		b,
	);

	// Fuel gauge window on pump
	const gaugeW = Math.round(14 * scale);
	const gaugeH = Math.round(10 * scale);
	const gaugeX = bodyX + Math.round((bodyW - gaugeW) / 2);
	const gaugeY = bodyY + Math.round(6 * scale);
	fillRect(png, gaugeX, gaugeY, gaugeW, gaugeH, Math.round(r * 0.5), Math.round(g * 0.5), Math.round(b * 0.5));
}

function drawFuelDrop(png, cx, cy, scale, color) {
	const [r, g, b] = color;

	// Draw a fuel drop shape
	for (let y = -12 * scale; y <= 12 * scale; y++) {
		for (let x = -8 * scale; x <= 8 * scale; x++) {
			// Top part - narrowing to point
			if (y < 0) {
				const maxX = 8 * scale * (1 - Math.pow(-y / (12 * scale), 0.5));
				if (Math.abs(x) <= maxX) {
					setPixel(png, Math.round(cx + x), Math.round(cy + y), r, g, b);
				}
			}
			// Bottom part - circle
			else {
				const radius = 8 * scale;
				const circleY = y;
				if (x * x + circleY * circleY <= radius * radius) {
					setPixel(png, Math.round(cx + x), Math.round(cy + y), r, g, b);
				}
			}
		}
	}
}

// Generate key images
function generateKeyImages() {
	const sizes = [
		{ size: 72, suffix: "" },
		{ size: 144, suffix: "@2x" },
	];

	for (const { size, suffix } of sizes) {
		const scale = size / 72;

		// Active state - green/teal background with fuel pump
		const activePng = createPNG(size, size, (png) => {
			fillRect(png, 0, 0, size, size, 40, 120, 100); // Teal background
			drawFuelPump(png, size / 2, size / 2, scale, [220, 220, 220]);
		});
		fs.writeFileSync(path.join(outputDir, `key-active${suffix}.png`), activePng);

		// Passive/default state - dark background
		const keyPng = createPNG(size, size, (png) => {
			fillRect(png, 0, 0, size, size, 45, 45, 45); // Dark gray background
			drawFuelPump(png, size / 2, size / 2, scale, [100, 100, 100]);
		});
		fs.writeFileSync(path.join(outputDir, `key${suffix}.png`), keyPng);
	}
}

// Generate icon images
function generateIconImages() {
	const sizes = [
		{ size: 20, suffix: "" },
		{ size: 40, suffix: "@2x" },
	];

	for (const { size, suffix } of sizes) {
		const scale = size / 20;

		const iconPng = createPNG(size, size, (png) => {
			// Simple fuel drop for small icon
			drawFuelDrop(png, size / 2, size / 2, scale * 0.7, [220, 180, 50]);
		});
		fs.writeFileSync(path.join(outputDir, `icon${suffix}.png`), iconPng);
	}
}

console.log("Generating fuel icons...");
generateKeyImages();
generateIconImages();
console.log("Done! Icons saved to:", outputDir);
