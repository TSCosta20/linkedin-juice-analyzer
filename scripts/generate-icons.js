#!/usr/bin/env node
/**
 * Generates minimal placeholder PNG icons for the Chrome extension.
 * Uses only Node.js built-ins — no npm dependencies.
 *
 * The output is a valid 1x1 green PNG; Chrome scales it automatically.
 * Replace with real artwork before publishing to the Chrome Web Store.
 *
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Valid 1x1 green (#22c55e) PNG, base64-encoded
const PNG_1x1_GREEN_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQ' +
  'AABjkB6QAAAABJRU5ErkJggg==';

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

for (const size of [16, 48, 128]) {
  const outPath = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(outPath, Buffer.from(PNG_1x1_GREEN_B64, 'base64'));
  console.log(`Written: ${outPath}`);
}

console.log('\nDone. Replace public/icons/ with real artwork before publishing.');
