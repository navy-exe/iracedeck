#!/usr/bin/env node
/**
 * Removes the Mirabox plugin symlink created by link-mirabox.mjs.
 * Tolerates the not-linked state (exits 0 with an info message).
 *
 * Refuses to delete anything that is not a symlink/junction, to avoid
 * accidentally wiping a real plugin copy someone placed there manually.
 */

import { existsSync, lstatSync, readFileSync, unlinkSync } from "node:fs";
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

const dest = process.env.MIRABOX_PLUGINS_DIR;
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

if (!stat.isSymbolicLink()) {
  console.error(`Error: ${link} exists but is not a symlink — refusing to delete.`);
  process.exit(1);
}

unlinkSync(link);
console.log(`Unlinked ${link}`);
