import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import {
  ENVIRONMENT_LABEL,
  FIXTURE_VERSION,
  RUN_COUNT,
} from './lib/constants.mjs';
import {
  controlFixtureUrl,
  diffRunStats,
  ensureResultsDir,
  fixtureUrl,
  getConfiguredTools,
  getToolFromManifest,
  loadManifest,
  mean,
  roundMetric,
  summarizeRuns,
} from './lib/fixtures.mjs';
import { collectRunMetrics, setupLongTaskObserver } from './lib/metrics.mjs';

const OVERHEAD_KEYS = ['pageLoadMs', 'mainThreadBlockingMs'];
const BASELINE_KEYS = ['pageLoadMs', 'mainThreadBlockingMs'];
const TOOL_TIMING_KEYS = ['pageLoadMs', 'scriptLoadMs', 'mainThreadBlockingMs'];
const TOOL_SIZE_KEYS = ['transferSizeBytes', 'decodedBodySizeBytes'];

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

function metricMeans(runs, keys) {
  const metrics = {};
  for (const key of keys) {
    const values = runs.map((run) => run[key]).filter((value) => value != null);
    metrics[key] = values.length ? roundMetric(mean(values)) : null;
  }
  return metrics;
}

function metricRunStats(runs, keys) {
  const stats = { runs: RUN_COUNT };
  for (const key of keys) {
    const values = runs.map((run) => run[key]).filter((value) => value != null);
    stats[key] = summarizeRuns(values);
  }
  return stats;
}

async function verifyControlFixture(page, url) {
  const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const html = await page.content();
  const ok =
    response?.ok() &&
    (html.includes('control page') || html.includes('no analytics snippet'));
  if (!ok) {
    throw new Error(
      `[benchmark] Control fixture not found at ${url}. Deploy public/bench/minimal-v1/_control/ before running benchmarks.`,
    );
  }
}

async function runFixture(browser, url, scriptHostPatterns, label) {
  const runs = [];

  for (let runIndex = 1; runIndex <= RUN_COUNT; runIndex += 1) {
    const context = await browser.newContext();
    const page = await context.newPage();

    await setupLongTaskObserver(page);
    const collector = await collectRunMetrics(page, scriptHostPatterns);

    try {
      await page.goto(url, { waitUntil: 'load', timeout: 60_000 });
      const metrics = await collector.finish();
      runs.push({ run: runIndex, ...metrics });
      console.log(
        `  ${label} run ${runIndex}/${RUN_COUNT}: load=${metrics.pageLoadMs}ms script=${metrics.scriptLoadMs ?? '—'}ms transfer=${metrics.transferSizeBytes}B blocking=${metrics.mainThreadBlockingMs}ms`,
      );
    } finally {
      await context.close();
    }
  }

  return runs;
}

async function runBaseline(browser, baseUrl) {
  const url = controlFixtureUrl(baseUrl);
  console.log(`[benchmark] baseline → ${url}`);

  const probe = await browser.newContext();
  const probePage = await probe.newPage();
  try {
    await verifyControlFixture(probePage, url);
  } finally {
    await probe.close();
  }

  const runs = await runFixture(browser, url, [], 'baseline');
  return {
    fixtureUrl: url,
    runs,
    metrics: metricMeans(runs, BASELINE_KEYS),
    runStats: metricRunStats(runs, BASELINE_KEYS),
  };
}

async function runTool(browser, tool, baseUrl, baseline) {
  const url = fixtureUrl(baseUrl, tool.slug);
  console.log(`[benchmark] ${tool.id} → ${url}`);
  const runs = await runFixture(browser, url, tool.scriptHostPatterns, tool.id);
  const { stats: overheadStats } = diffRunStats(runs, baseline.runs, OVERHEAD_KEYS);

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
      networkNote:
        'Chrome DevTools Slow 4G preset (150 ms RTT, 1.6 Mbps down, 750 Kbps up). Simulated — not a physical cell network.',
    },
    baseline: {
      fixtureUrl: baseline.fixtureUrl,
      metrics: baseline.metrics,
      runStats: baseline.runStats,
    },
    runs,
    metrics: {
      ...metricMeans(runs, TOOL_SIZE_KEYS),
      ...metricMeans(runs, TOOL_TIMING_KEYS),
    },
    runStats: metricRunStats(runs, [...TOOL_SIZE_KEYS, ...TOOL_TIMING_KEYS]),
    overhead: {
      metrics: metricMeans(
        runs.map((run, index) => {
          const baselineRun = baseline.runs[index];
          return {
            pageLoadMs:
              run.pageLoadMs != null && baselineRun?.pageLoadMs != null
                ? run.pageLoadMs - baselineRun.pageLoadMs
                : null,
            mainThreadBlockingMs:
              run.mainThreadBlockingMs != null && baselineRun?.mainThreadBlockingMs != null
                ? run.mainThreadBlockingMs - baselineRun.mainThreadBlockingMs
                : null,
          };
        }),
        OVERHEAD_KEYS,
      ),
      runStats: {
        runs: RUN_COUNT,
        ...overheadStats,
      },
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
    const baseline = await runBaseline(browser, baseUrl);
    console.log(
      `[benchmark] baseline mean load=${baseline.metrics.pageLoadMs}ms blocking=${baseline.metrics.mainThreadBlockingMs}ms`,
    );

    for (const tool of tools) {
      const result = await runTool(browser, tool, baseUrl, baseline);
      const outputPath = path.join(resultsDir, `${tool.id}-${result.testDate}.json`);
      fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
      console.log(
        `[benchmark] overhead load=${result.overhead.metrics.pageLoadMs}ms blocking=${result.overhead.metrics.mainThreadBlockingMs}ms`,
      );
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
