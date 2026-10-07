#!/usr/bin/env node
// Re-copies the vendored theme files from the game client.
//
// The panel repo is standalone (it cannot import across the repo boundary at
// build time), so the game's three stylesheets and the header logo are copies.
// If you retheme the game, run this to refresh them:
//
//   node scripts/sync-styles.mjs            # game client at ../frontend
//   node scripts/sync-styles.mjs --from ../primordia/frontend
//
// It is idempotent and will not touch anything else.

import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const DEFAULT_SOURCE = resolve(root, '../frontend'); // sibling checkout

function argValue(name) {
  const idx = process.argv.indexOf(name);
  return idx === -1 ? null : process.argv[idx + 1];
}

const source = argValue('--from') ? resolve(argValue('--from')) : DEFAULT_SOURCE;

const FILES = [
  ['src/styles/globals.css', 'src/styles/globals.css'],
  ['src/styles/retro-os.css', 'src/styles/retro-os.css'],
  ['src/styles/ui.css', 'src/styles/ui.css'],
  ['src/assets/main_page.png', 'src/assets/main_page.png'],
];

let ok = true;
for (const [src, dst] of FILES) {
  const from = join(source, src);
  const to = join(root, dst);
  if (!existsSync(from)) {
    console.error(`[sync] MISSING source: ${from}`);
    ok = false;
    continue;
  }
  mkdirSync(dirname(to), { recursive: true });
  copyFileSync(from, to);
  console.log(`[sync] ${src} -> ${dst}`);
}

if (ok) {
  console.log(`[sync] theme refreshed from ${source}`);
} else {
  console.error(`[sync] some sources were missing in ${source}`);
  process.exit(1);
}