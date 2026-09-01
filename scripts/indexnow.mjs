import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SITE_HOST = 'www.analyticsvs.com';
const SITE_ORIGIN = `https://${SITE_HOST}`;
const INDEXNOW_KEY = '10e9597eea9841d0ba00e598be768556';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';
const DIST_DIR = 'dist';
const MAX_URLS_PER_REQUEST = 10_000;

function shouldSubmit() {
  if (process.env.INDEXNOW_SUBMIT === 'false') return false;
  if (process.env.INDEXNOW_SUBMIT === 'true') return true;
  return process.env.VERCEL === '1' || process.env.CI === 'true';
}

function collectPageUrls() {
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
  if (!shouldSubmit()) {
    console.log('[indexnow] Skipped (set INDEXNOW_SUBMIT=true to run locally).');
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
  console.warn('[indexnow] Warning:', error.message);
});
