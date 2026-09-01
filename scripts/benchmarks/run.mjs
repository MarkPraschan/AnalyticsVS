import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  ENVIRONMENT_LABEL,
  FIXTURE_VERSION,
  RUN_COUNT,
} from './lib/constants.mjs';
import {
  ensureResultsDir,
  fixtureUrl,
  getConfiguredTools,
  getToolFromManifest,
  loadManifest,
  mean,
  roundMetric,
} from './lib/fixtures.mjs';
import { collectRunMetrics, setupLongTaskObserver } from './lib/metrics.mjs';

function parseArgs(argv) {
  const options = { tool: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--tool') {
      options.tool = argv[index + 1] ?? null;
      index += 1;
    }
  }
  return options;
}

function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function runTool(browser, tool, baseUrl) {
  const url = fixtureUrl(baseUrl, tool.slug);
  const runs = [];

  console.log(`[benchmark] ${tool.id} → ${url}`);

  for (let runIndex = 1; runIndex <= RUN_COUNT; runIndex += 1) {
    const context = await browser.newContext();
    const page = await context.newPage();

    await setupLongTaskObserver(page);
    const collector = await collectRunMetrics(page, tool.scriptHostPatterns);

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
      const metrics = await collector.finish();
      runs.push({ run: runIndex, ...metrics });
      console.log(
        `  run ${runIndex}/${RUN_COUNT}: transfer=${metrics.transferSizeBytes}B decoded=${metrics.decodedBodySizeBytes}B blocking=${metrics.mainThreadBlockingMs}ms`,
      );
    } finally {
      await context.close();
    }
  }

  const transferValues = runs.map((run) => run.transferSizeBytes);
  const decodedValues = runs.map((run) => run.decodedBodySizeBytes);
  const blockingValues = runs.map((run) => run.mainThreadBlockingMs);

  return {
    fixtureVersion: FIXTURE_VERSION,
    tool: tool.id,
    toolName: tool.name,
    testDate: todayIsoDate(),
    fixtureUrl: url,
    environment: {
      ...ENVIRONMENT_LABEL,
      browser: `Chromium ${browser.version()}`,
      runs: RUN_COUNT,
      aggregation: 'mean',
    },
    runs,
    metrics: {
      transferSizeBytes: roundMetric(mean(transferValues)),
      decodedBodySizeBytes: roundMetric(mean(decodedValues)),
      mainThreadBlockingMs: roundMetric(mean(blockingValues)),
      lighthouseScoreImpact: null,
    },
    aggregates: {
      transferSizeBytes: { mean: mean(transferValues), values: transferValues },
      decodedBodySizeBytes: { mean: mean(decodedValues), values: decodedValues },
      mainThreadBlockingMs: { mean: mean(blockingValues), values: blockingValues },
    },
  };
}

async function main() {
  const { tool: toolFilter } = parseArgs(process.argv.slice(2));
  const baseUrl = process.env.BENCHMARK_BASE_URL ?? 'http://localhost:4321';
  const manifest = loadManifest();

  let tools = getConfiguredTools();
  if (tools.length === 0) {
    console.error('[benchmark] No configured snippets found.');
    console.error('Copy benchmarks/config/snippets.example.json → snippets.json and paste vendor snippets.');
    process.exit(1);
  }

  if (toolFilter) {
    const tool = getToolFromManifest(toolFilter);
    const configured = tools.some((entry) => entry.id === tool.id);
    if (!configured) {
      console.error(`[benchmark] Tool "${toolFilter}" has no snippet in snippets.json`);
      process.exit(1);
    }
    tools = [tool];
  }

  const browser = await chromium.launch({ headless: true });
  const resultsDir = ensureResultsDir();

  try {
    for (const tool of tools) {
      const result = await runTool(browser, tool, baseUrl);
      const outputPath = path.join(resultsDir, `${tool.id}-${result.testDate}.json`);
      fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
      console.log(`[benchmark] Wrote ${outputPath}`);
    }
  } finally {
    await browser.close();
  }

  console.log(`[benchmark] Done. ${tools.length} tool(s), base URL: ${baseUrl}`);
}

main().catch((error) => {
  console.error('[benchmark] Failed:', error);
  process.exit(1);
});
