#!/usr/bin/env node
/**
 * Removes the Mirabox plugin entry created by link-mirabox.mjs, or a real
 * plugin directory installed by the host app from a packaged build.
 * Tolerates the not-linked state (exits 0 with an info message).
 */
import { existsSync, lstatSync, readFileSync, rmSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LINK_NAME = "com.iracedeck.sd.core.sdPlugin";

function loadEnvLocal() {
  const envPath = join(ROOT, ".env.local");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvLocal();

// Default to the standard HotSpot StreamDock install path on Windows when
// MIRABOX_PLUGINS_DIR is not explicitly set. Other host apps (e.g. VSD Craft)
// install elsewhere — set MIRABOX_PLUGINS_DIR in .env.local to override.
const dest =
  process.env.MIRABOX_PLUGINS_DIR ??
  (process.platform === "win32" && process.env.APPDATA
    ? join(process.env.APPDATA, "HotSpot", "StreamDock", "plugins")
    : undefined);
if (!dest) {
  console.log("MIRABOX_PLUGINS_DIR not set — nothing to unlink.");
  process.exit(0);
}

const link = join(dest, LINK_NAME);

// lstat (not exists) so we also detect dangling symlinks/junctions whose
// target has been deleted — `existsSync` follows the link and would hide
// a stale entry that still occupies the filename.
const stat = lstatSync(link, { throwIfNoEntry: false });
if (!stat) {
  console.log(`No link at ${link} — nothing to unlink.`);
  process.exit(0);
}

// Branch on entry type. `rmSync(..., { recursive, force })` on a Windows
// junction with a missing target silently no-ops (recurse fails, force
// swallows the error, the junction itself is never unlinked). So unlink
// symlinks/junctions explicitly; only recursively remove real directories.
if (stat.isSymbolicLink()) {
  unlinkSync(link);
} else {
  rmSync(link, { recursive: true, force: true });
}
console.log(`Removed ${link}`);
