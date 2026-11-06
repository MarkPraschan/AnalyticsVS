import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST_DIR = 'dist';
const SITE_ORIGIN = 'https://www.analyticsvs.com';

function walkHtmlFiles(dir) {
  const files = [];
  if (!existsSync(dir)) return files;

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(path));
    } else if (entry.name.endsWith('.html')) {
      files.push(path);
    }
  }
  return files;
}

function resolveInternalPath(pathname) {
  const clean = pathname.split('#')[0].split('?')[0];
  if (!clean.startsWith('/')) return null;
  if (clean.startsWith('/_astro/') || clean.startsWith('/bench/')) return null;

  const relative = clean.replace(/^\/+/, '');
  const candidates = relative
    ? [
        join(DIST_DIR, relative),
        join(DIST_DIR, relative, 'index.html'),
        join(DIST_DIR, `${relative}.html`),
      ]
    : [join(DIST_DIR, 'index.html')];

  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile())
    ? clean
    : false;
}

function collectHrefs(html) {
  const hrefs = new Set();
  for (const match of html.matchAll(/\b(?:href)=["']([^"']+)["']/gi)) {
    hrefs.add(match[1]);
  }
  return hrefs;
}

function toPathname(href) {
  if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) {
    return null;
  }
  if (href.startsWith('#')) return null;
  if (href.startsWith(SITE_ORIGIN)) {
    return new URL(href).pathname;
  }
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    return null;
  }
  if (href.startsWith('/')) return href;
  return null;
}

const htmlFiles = walkHtmlFiles(DIST_DIR);
if (htmlFiles.length === 0) {
  console.error(`[check:links] No HTML files in ${DIST_DIR}. Run npm run build first.`);
  process.exit(1);
}

const missing = [];

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  for (const href of collectHrefs(html)) {
    const pathname = toPathname(href);
    if (!pathname) continue;
    const resolved = resolveInternalPath(pathname);
    if (resolved === false) {
      missing.push({ file, href: pathname });
    }
  }
}

if (missing.length > 0) {
  const unique = [...new Map(missing.map((item) => [`${item.file}:${item.href}`, item])).values()];
  console.error(`[check:links] ${unique.length} broken internal link(s):`);
  for (const item of unique.slice(0, 50)) {
    console.error(`  ${item.href}  (from ${item.file.replace(`${DIST_DIR}/`, '')})`);
  }
  if (unique.length > 50) {
    console.error(`  …and ${unique.length - 50} more`);
  }
  process.exit(1);
}

console.log(`[check:links] OK — scanned ${htmlFiles.length} HTML file(s) under ${DIST_DIR}.`);
