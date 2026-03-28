/**
 * Fetches the top 100 apps from a Play Store chart via `list()`.
 *
 * Run from the repository root (dependencies must be installed):
 *
 *   node examples/top100.js
 *
 * Optional env:
 *   COLLECTION — `TOP_FREE` (default), `TOP_PAID`, `GROSSING`, etc. (see lib/constants.js)
 *   COUNTRY    — store country, default `us`
 *   LANG       — language, default `en`
 *   OUTPUT     — path to write JSON (default: `examples/top100-results.json` next to this file)
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import gplay from '../index.js';
import { stripUnicodeLineTerminators } from './strip-unicode-line-terminators.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath =
  process.env.OUTPUT ?? path.join(__dirname, 'top100-results.json');

const collectionKey = process.env.COLLECTION ?? 'TOP_FREE';
const collection = gplay.collection[collectionKey];
if (!collection) {
  console.error(
    `Unknown COLLECTION "${collectionKey}". Use a key from gplay.collection.`
  );
  process.exit(1);
}

const country = process.env.COUNTRY ?? 'us';
const lang = process.env.LANG ?? 'en';

const apps = await gplay.list({
  collection,
  category: gplay.category.APPLICATION,
  num: 100,
  country,
  lang,
  throttle: 5,
});

const payload = {
  collection: collectionKey,
  country,
  lang,
  fetchedAt: new Date().toISOString(),
  apps,
};

const payloadForFile = stripUnicodeLineTerminators(payload);
await writeFile(outputPath, JSON.stringify(payloadForFile, null, 2), 'utf8');

console.log(`Chart: ${collectionKey} — ${apps.length} apps`);
console.log(`Wrote ${outputPath}\n`);
apps.forEach((app, i) => {
  console.log(`${String(i + 1).padStart(3)}. ${app.title} (${app.appId})`);
});
