#!/usr/bin/env node
/**
 * Symlinks the built Mirabox plugin folder into the host app's plugins
 * directory, so the host loads the dev build directly (the Mirabox-side
 * equivalent of `streamdeck link` for Elgato).
 *
 * On Windows the destination defaults to the standard HotSpot StreamDock
 * install path (`%APPDATA%\HotSpot\StreamDock\plugins`). Set
 * MIRABOX_PLUGINS_DIR in your shell or in a gitignored .env.local at the
 * repo root to override (e.g. for VSD Craft or another vendor's build):
 *
 *   MIRABOX_PLUGINS_DIR=C:\Users\you\AppData\Roaming\HotSpot\StreamDock\plugins
 */
import { existsSync, lstatSync, readFileSync, symlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "packages", "iracing-plugin-mirabox", "com.iracedeck.sd.core.sdPlugin");
// Build output — presence confirms the plugin has actually been built
// (the plugin folder itself has manifest.json and icons checked in, so
// existence of the folder alone does not mean a build has run).
const BUILT_PLUGIN_ENTRY = join(SOURCE, "bin", "plugin.js");
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
  console.error("Error: MIRABOX_PLUGINS_DIR is not set and no default could be derived.");
  console.error("Set it in your shell or in .env.local at the repo root, e.g.:");
  console.error('  MIRABOX_PLUGINS_DIR="C:\\\\Users\\\\you\\\\AppData\\\\Roaming\\\\HotSpot\\\\StreamDock\\\\plugins"');
  process.exit(1);
}

if (!existsSync(BUILT_PLUGIN_ENTRY)) {
  console.error(`Error: Mirabox plugin is not built. Run \`pnpm build\` first.\n  Missing: ${BUILT_PLUGIN_ENTRY}`);
  process.exit(1);
}

if (!existsSync(dest)) {
  console.error(`Error: MIRABOX_PLUGINS_DIR does not exist:\n  ${dest}`);
  process.exit(1);
}

const link = join(dest, LINK_NAME);

// lstat (not exists) so we also catch dangling symlinks/junctions whose
// target has been deleted — `existsSync` follows the link and would report
// false in that case, hiding the stale entry from the fails-fast guard.
if (lstatSync(link, { throwIfNoEntry: false })) {
  console.error(`Error: a link or folder already exists at:\n  ${link}\nRun \`pnpm unlink:mirabox\` first.`);
  process.exit(1);
}

// Use "junction" on Windows to avoid requiring admin / developer mode.
const type = process.platform === "win32" ? "junction" : "dir";
symlinkSync(SOURCE, link, type);
console.log(`Linked ${SOURCE}\n     -> ${link}`);
