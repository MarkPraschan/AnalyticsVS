import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * IndexNow (https://www.indexnow.org/documentation)
 *
 * Hosting: Vercel static Astro build (`vercel.json` buildCommand = `npm run build`).
 * `npm run build` runs the `postbuild` script, which invokes this file.
 *
 * When it submits:
 * - Production Vercel builds (`VERCEL_ENV=production`)
 * - Or `INDEXNOW_SUBMIT=true` (manual / CI)
 *
 * When it skips:
 * - Local `npm run build` (unless INDEXNOW_SUBMIT=true)
 * - Vercel preview / development deploys
 * - `INDEXNOW_SUBMIT=false`
 *
 * The key file is public by design and is served from the site root:
 *   https://www.analyticsvs.com/10e9597eea9841d0ba00e598be768556.txt
 *
 * Manual command after a local production-like build:
 *   INDEXNOW_SUBMIT=true npm run indexnow
 */

const SITE_HOST = 'www.analyticsvs.com';
const SITE_ORIGIN = `https://${SITE_HOST}`;
const INDEXNOW_KEY = '10e9597eea9841d0ba00e598be768556';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const DIST_DIR = 'dist';
const KEY_FILE = join('public', `${INDEXNOW_KEY}.txt`);
const MAX_URLS_PER_REQUEST = 10_000;

function shouldSubmit() {
  if (process.env.INDEXNOW_SUBMIT === 'false') return false;
  if (process.env.INDEXNOW_SUBMIT === 'true') return true;
  return process.env.VERCEL_ENV === 'production';
}

function assertKeyFile() {
  if (!existsSync(KEY_FILE)) {
    throw new Error(`Missing IndexNow key file at ${KEY_FILE}`);
  }
  const contents = readFileSync(KEY_FILE, 'utf8').trim();
  if (contents !== INDEXNOW_KEY) {
    throw new Error(`IndexNow key file must contain exactly ${INDEXNOW_KEY}`);
  }
}

function collectPageUrls() {
  if (!existsSync(DIST_DIR)) {
    return [];
  }

  const files = readdirSync(DIST_DIR).filter(
    (file) => file.startsWith('sitemap') && file.endsWith('.xml'),
  );

  const urls = new Set();

  for (const file of files) {
    const xml = readFileSync(join(DIST_DIR, file), 'utf8');
    for (const match of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const url = match[1]?.trim();
      if (!url || url.endsWith('.xml')) continue;
      if (url.startsWith(SITE_ORIGIN)) {
        urls.add(url);
      }
    }
  }

  return [...urls].sort();
}

async function submitUrls(urlList) {
  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: SITE_HOST,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
      urlList,
    }),
  });

  if (!response.ok && response.status !== 202) {
    const body = await response.text();
    throw new Error(`IndexNow submission failed (${response.status}): ${body}`);
  }

  return response.status;
}

async function main() {
  assertKeyFile();

  if (!shouldSubmit()) {
    console.log(
      '[indexnow] Skipped (production Vercel deploys run automatically; set INDEXNOW_SUBMIT=true to run locally).',
    );
    return;
  }

  const urlList = collectPageUrls();

  if (urlList.length === 0) {
    console.warn('[indexnow] No URLs found in dist sitemap files.');
    return;
  }

  for (let index = 0; index < urlList.length; index += MAX_URLS_PER_REQUEST) {
    const batch = urlList.slice(index, index + MAX_URLS_PER_REQUEST);
    const status = await submitUrls(batch);
    console.log(`[indexnow] Submitted ${batch.length} URL(s) — HTTP ${status}.`);
  }
}

main().catch((error) => {
  // Never fail the Vercel build because Bing/Yandex is unreachable.
  console.warn('[indexnow] Warning:', error.message);
});
