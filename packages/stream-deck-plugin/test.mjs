try {
	const native = await import("@iracedeck/iracing-native");
	console.log("Loaded:", native);
} catch (e) {
	console.error("Failed:", e);
}
