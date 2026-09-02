import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getToolFromManifest } from './lib/fixtures.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const benchmarksContentDir = path.join(projectRoot, 'src', 'content', 'benchmarks');

function parseArgs(argv) {
  const files = argv.filter((arg) => !arg.startsWith('--'));
  return { files };
}

function slugForResult(result) {
  const month = result.testDate.slice(0, 7);
  return `${result.tool}-script-${month}`;
}

function detectInstall(headHtml) {
  const html = headHtml ?? '';
  const hasAsync = /\basync\b/i.test(html);
  const hasDefer = /\bdefer\b/i.test(html);
  const hasModule = /type\s*=\s*["']module["']/i.test(html);
  const loading = hasModule ? 'module' : hasDefer ? 'defer' : hasAsync ? 'async' : 'blocking';
  const renderBlocking = loading === 'blocking';
  return { loading, renderBlocking };
}

function buildContentEntry(result, inputPath) {
  const tool = getToolFromManifest(result.tool);
  const slug = slugForResult(result);
  const rawResultsPath = path.relative(projectRoot, inputPath).replace(/\\/g, '/');

  let install = null;
  try {
    const snippetsPath = path.join(projectRoot, 'benchmarks', 'config', 'snippets.json');
    if (fs.existsSync(snippetsPath)) {
      const snippets = JSON.parse(fs.readFileSync(snippetsPath, 'utf8'));
      const headHtml = snippets.tools?.[result.tool]?.headHtml;
      if (headHtml && !headHtml.includes('<!-- Paste')) {
        install = detectInstall(headHtml);
      }
    }
  } catch {
    // Optional: install metadata is best-effort from local snippets.
  }

  return {
    tool: result.tool,
    testDate: result.testDate,
    slug,
    title: `${tool.name} Script Performance`,
    status: 'recorded',
    environment: {
      connection: result.environment.connection,
      device: result.environment.device,
      runs: result.environment.runs ?? result.runStats?.runs ?? 7,
    },
    ...(install ? { install } : {}),
    baseline: result.baseline
      ? {
          pageLoadMs: result.baseline.metrics.pageLoadMs ?? null,
          mainThreadBlockingMs: result.baseline.metrics.mainThreadBlockingMs ?? null,
          runStats: result.baseline.runStats ?? null,
        }
      : null,
    overhead: result.overhead
      ? {
          pageLoadMs: result.overhead.metrics.pageLoadMs ?? null,
          mainThreadBlockingMs: result.overhead.metrics.mainThreadBlockingMs ?? null,
          runStats: result.overhead.runStats ?? null,
        }
      : null,
    metrics: {
      transferSizeBytes: result.metrics.transferSizeBytes,
      decodedBodySizeBytes: result.metrics.decodedBodySizeBytes,
      mainThreadBlockingMs: result.metrics.mainThreadBlockingMs,
      pageLoadMs: result.metrics.pageLoadMs ?? null,
      scriptLoadMs: result.metrics.scriptLoadMs ?? null,
    },
    runStats: result.runStats ?? null,
    rawResultsUrl: null,
    _rawResultsFile: rawResultsPath,
  };
}

function main() {
  const { files } = parseArgs(process.argv.slice(2));
  if (files.length === 0) {
    console.error('Usage: npm run benchmark:import -- benchmarks/results/plausible-2026-09-01.json');
    process.exit(1);
  }

  fs.mkdirSync(benchmarksContentDir, { recursive: true });

  for (const fileArg of files) {
    const inputPath = path.resolve(process.cwd(), fileArg);
    const result = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const entry = buildContentEntry(result, inputPath);
    const { _rawResultsFile, ...published } = entry;

    const outputPath = path.join(benchmarksContentDir, `${published.slug}.json`);
    fs.writeFileSync(outputPath, `${JSON.stringify(published, null, 2)}\n`, 'utf8');

    console.log(`[import] Wrote ${path.relative(projectRoot, outputPath)}`);
    console.log(`[import] Raw results: ${_rawResultsFile}`);
    console.log(
      `[import] Overhead load=${published.overhead?.pageLoadMs ?? '—'}ms, transfer=${published.metrics.transferSizeBytes}B`,
    );
  }
}

main();
