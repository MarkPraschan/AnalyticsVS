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

function buildContentEntry(result, inputPath) {
  const tool = getToolFromManifest(result.tool);
  const slug = slugForResult(result);
  const rawResultsPath = path.relative(projectRoot, inputPath).replace(/\\/g, '/');

  return {
    tool: result.tool,
    testDate: result.testDate,
    slug,
    title: `${tool.name} Script Performance`,
    status: 'recorded',
    environment: {
      connection: result.environment.connection,
      device: result.environment.device,
    },
    metrics: {
      transferSizeBytes: result.metrics.transferSizeBytes,
      decodedBodySizeBytes: result.metrics.decodedBodySizeBytes,
      mainThreadBlockingMs: result.metrics.mainThreadBlockingMs,
      lighthouseScoreImpact: null,
    },
    methodology: `Recorded on AnalyticsVS fixture ${result.fixtureVersion} (${result.fixtureUrl}). Eager <head> snippet, Fast 4G, ${result.environment.runs} runs, mean reported. See /methodology/ and benchmarks/README.md.`,
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
      `[import] Metrics: transfer=${published.metrics.transferSizeBytes}B, decoded=${published.metrics.decodedBodySizeBytes}B, blocking=${published.metrics.mainThreadBlockingMs}ms`,
    );
  }
}

main();
