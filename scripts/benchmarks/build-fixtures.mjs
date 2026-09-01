import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FIXTURE_PATH_PREFIX,
  FIXTURE_VERSION,
} from './lib/constants.mjs';
import { loadManifest, loadSnippets } from './lib/fixtures.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputRoot = path.join(projectRoot, 'public', 'bench', FIXTURE_VERSION);

function buildHtml({ tool, headHtml, fixtureHost }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>AnalyticsVS benchmark fixture — ${tool.name}</title>
  ${headHtml}
</head>
<body>
  <main>
    <h1>AnalyticsVS script lab</h1>
    <p>Fixture <code>${FIXTURE_VERSION}</code> for <strong>${tool.name}</strong>.</p>
    <p>Host: <code>${fixtureHost}</code>. Not indexed. Used only for controlled script benchmarks.</p>
  </main>
</body>
</html>
`;
}

function buildPlaceholderHtml(tool, fixtureHost) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex, nofollow">
  <title>AnalyticsVS benchmark fixture — ${tool.name} (pending)</title>
</head>
<body>
  <main>
    <h1>Snippet not configured</h1>
    <p>Add <code>${tool.id}</code> to <code>benchmarks/config/snippets.json</code> and rebuild fixtures.</p>
    <p>Expected host: <code>${fixtureHost}</code></p>
  </main>
</body>
</html>
`;
}

function writeFixture(tool, html) {
  const dir = path.join(outputRoot, tool.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8');
}

function main() {
  const manifest = loadManifest();
  const snippets = loadSnippets();
  const fixtureHost = snippets?.fixtureHost ?? manifest.recommendedHost ?? 'bench.analyticsvs.com';

  fs.mkdirSync(outputRoot, { recursive: true });

  let configured = 0;

  for (const tool of manifest.tools) {
    const entry = snippets?.tools?.[tool.id];
    const headHtml = entry?.headHtml?.trim();

    if (headHtml && !headHtml.startsWith('<!--')) {
      writeFixture(tool, buildHtml({ tool, headHtml, fixtureHost }));
      configured += 1;
      console.log(`[fixtures] ${tool.id} → ${FIXTURE_PATH_PREFIX}/${tool.slug}/`);
    } else {
      writeFixture(tool, buildPlaceholderHtml(tool, fixtureHost));
      console.log(`[fixtures] ${tool.id} → placeholder (no snippet)`);
    }
  }

  const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex, nofollow">
  <title>AnalyticsVS benchmark fixtures</title>
</head>
<body>
  <h1>AnalyticsVS benchmark fixtures (${FIXTURE_VERSION})</h1>
  <p>Configured tools: ${configured} / ${manifest.tools.length}</p>
  <ul>
    ${manifest.tools
      .map(
        (tool) =>
          `<li><a href="${FIXTURE_PATH_PREFIX}/${tool.slug}/">${tool.name}</a></li>`,
      )
      .join('\n    ')}
  </ul>
</body>
</html>
`;

  fs.writeFileSync(path.join(outputRoot, 'index.html'), indexHtml, 'utf8');
  console.log(`[fixtures] Wrote ${manifest.tools.length} tool pages to public/bench/${FIXTURE_VERSION}/`);

  if (!snippets) {
    console.warn('[fixtures] benchmarks/config/snippets.json not found — only placeholders were built.');
    console.warn('[fixtures] Copy benchmarks/config/snippets.example.json → snippets.json');
  }
}

main();
