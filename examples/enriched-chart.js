/**
 * Chart crawl + enrichment:
 * identifiers, listing URLs, developer, price, description, category, version,
 * dates, ratings / histogram, content rating, OS requirements, installs, policy
 * links, release notes — plus optional permissions and Data safety panels.
 *
 * Run from the repository root:
 *
 *   node examples/enriched-chart.js
 *
 * Environment (all optional except where noted):
 *   COLLECTION     — `TOP_FREE` (default), `TOP_PAID`, `GROSSING`, etc. (see lib/constants.js)
 *   COUNTRY        — store country (default `us`)
 *   HL / PLAY_LANG — Play Store UI language (default `en`). Use `HL`, not shell `LANG` (often `en_US.UTF-8`).
 *   NUM            — chart size to fetch then enrich (default `15`; use `100` for a full top-100 style run)
 *   THROTTLE       — max concurrent requests for the shared limiter (default `5`)
 *   INCLUDE_EXTRA  — set to `1` to also fetch `permissions()` (short list) and `datasafety()` per app
 *   PARALLEL       — set to `1` to enrich all chart rows concurrently (default: one app at a time)
 *   OUTPUT         — JSON output path (default `examples/enriched-chart-results.json`)
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import gplay from '../index.js';
import { stripUnicodeLineTerminators } from './strip-unicode-line-terminators.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const outputPath =
  process.env.OUTPUT ?? path.join(__dirname, 'enriched-chart-results.json');

const collectionKey = process.env.COLLECTION ?? 'TOP_FREE';
const collection = gplay.collection[collectionKey];
if (!collection) {
  console.error(
    `Unknown COLLECTION "${collectionKey}". Use a key from gplay.collection.`
  );
  process.exit(1);
}

const country = process.env.COUNTRY ?? 'us';
const lang = process.env.HL ?? process.env.PLAY_LANG ?? 'en';
const num = Math.max(1, Number.parseInt(process.env.NUM ?? '15', 10) || 15);
const throttle = Math.max(
  1,
  Number.parseInt(process.env.THROTTLE ?? '5', 10) || 5
);
const includeExtra = process.env.INCLUDE_EXTRA === '1';
const parallel = process.env.PARALLEL === '1';

const baseOpts = { country, lang, throttle };

function playStoreAppUrl(appId) {
  return `https://play.google.com/store/apps/details?id=${encodeURIComponent(appId)}`;
}

function playStoreDeveloperUrl(developerId) {
  if (developerId == null || developerId === '') {
    return null;
  }
  return `https://play.google.com/store/apps/dev?id=${encodeURIComponent(developerId)}`;
}

/**
 * Maps `app()` output into a flat record
 * @param {Record<string, unknown>} d
 */
function mapMacStyleAppRow(d) {
  const appId = d.appId;
  return {
    play_store_id: appId,
    package_name: appId,
    name: d.title ?? null,
    play_store_url: typeof appId === 'string' ? playStoreAppUrl(appId) : null,
    icon_url: d.icon ?? null,
    developer: d.developer ?? null,
    developer_url: playStoreDeveloperUrl(d.developerId),
    google_developer_id: d.developerId ?? null,
    price: d.price ?? null,
    currency: d.currency ?? null,
    is_free: typeof d.free === 'boolean' ? d.free : null,
    description: d.description ?? null,
    summary: d.summary ?? null,
    category: d.genre ?? null,
    primary_category_id: d.genreId ?? null,
    categories: d.categories ?? [],
    released_at: d.released ?? null,
    store_updated_at_ms: d.updated ?? null,
    version: d.version ?? null,
    release_notes: d.recentChanges ?? null,
    rating: d.score ?? null,
    rating_text: d.scoreText ?? null,
    ratings_count: d.ratings ?? null,
    reviews_count: d.reviews ?? null,
    rating_histogram: d.histogram ?? null,
    content_rating: d.contentRating ?? null,
    android_min_version: d.androidVersion ?? null,
    android_version_text: d.androidVersionText ?? null,
    installs_range: d.installs ?? null,
    min_installs: d.minInstalls ?? null,
    max_installs: d.maxInstalls ?? null,
    developer_website: d.developerWebsite ?? null,
    privacy_policy_url: d.privacyPolicy ?? null,
    offers_in_app_purchases: d.offersIAP ?? null,
    ad_supported: d.adSupported ?? null,
    available: d.available ?? null,
  };
}

/**
 * @param {string} appId
 * @param {number} rank
 * @param {Record<string, unknown> | undefined} chartRow
 */
async function enrichOne(appId, rank, chartRow) {
  const opts = { appId, ...baseOpts };
  try {
    const detail = await gplay.app(opts);
    const record = {
      rank,
      chart_snapshot: chartRow
        ? {
            appId: chartRow.appId,
            title: chartRow.title,
            score: chartRow.score,
            developer: chartRow.developer,
          }
        : { appId },
      app: mapMacStyleAppRow(detail),
    };

    if (includeExtra) {
      const [permShort, safety] = await Promise.all([
        gplay.permissions({ ...opts, short: true }),
        gplay.datasafety(opts),
      ]);
      record.permissions_short = permShort;
      record.data_safety = safety;
    }

    return record;
  } catch (err) {
    return {
      rank,
      chart_snapshot: chartRow
        ? { appId: chartRow.appId, title: chartRow.title }
        : { appId },
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

const chartApps = await gplay.list({
  collection,
  category: gplay.category.APPLICATION,
  num,
  ...baseOpts,
});

let enriched;
if (parallel) {
  enriched = await Promise.all(
    chartApps.map((row, i) => enrichOne(row.appId, i + 1, row))
  );
} else {
  enriched = [];
  for (let i = 0; i < chartApps.length; i++) {
    enriched.push(await enrichOne(chartApps[i].appId, i + 1, chartApps[i]));
  }
}

const payload = {
  source: {
    store: 'google_play',
    collection: collectionKey,
    country,
    lang,
    num_requested: num,
    include_extra: includeExtra,
    fetchedAt: new Date().toISOString(),
  },
  apps: enriched,
};

await writeFile(
  outputPath,
  JSON.stringify(stripUnicodeLineTerminators(payload), null, 2),
  'utf8'
);

const ok = enriched.filter((r) => !r.error).length;
const failed = enriched.length - ok;
console.log(
  `Enriched ${ok}/${enriched.length} apps (${failed} errors) → ${outputPath}`
);
console.log(
  `INCLUDE_EXTRA=${includeExtra ? '1' : '0'} parallel=${parallel ? '1' : '0'}`
);
