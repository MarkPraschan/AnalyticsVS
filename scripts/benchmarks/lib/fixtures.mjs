import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const benchmarksRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..', 'benchmarks');

export function getBenchmarksRoot() {
  return benchmarksRoot;
}

export function loadManifest() {
  const manifestPath = path.join(benchmarksRoot, 'config', 'manifest.json');
  return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
}

export function loadSnippets() {
  const snippetsPath = path.join(benchmarksRoot, 'config', 'snippets.json');
  if (!fs.existsSync(snippetsPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(snippetsPath, 'utf8'));
}

export function isConfiguredSnippet(headHtml) {
  const html = headHtml?.trim();
  if (!html) return false;
  if (/^<!--[\s\S]*-->$/.test(html)) return false;
  return /<script/i.test(html);
}

export function getConfiguredTools() {
  const manifest = loadManifest();
  const snippets = loadSnippets();
  if (!snippets?.tools) {
    return [];
  }

  return manifest.tools.filter((tool) => {
    const entry = snippets.tools[tool.id];
    return isConfiguredSnippet(entry?.headHtml);
  });
}

export function getToolFromManifest(toolId) {
  const manifest = loadManifest();
  const tool = manifest.tools.find((entry) => entry.id === toolId);
  if (!tool) {
    throw new Error(`Unknown tool id: ${toolId}`);
  }
  return tool;
}

export function fixtureUrl(baseUrl, toolSlug) {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  return `${normalizedBase}/bench/minimal-v1/${toolSlug}/`;
}

export function controlFixtureUrl(baseUrl) {
  return fixtureUrl(baseUrl, '_control');
}

export function diffRunStats(toolRuns, baselineRuns, keys) {
  const overheadRuns = toolRuns.map((toolRun, index) => {
    const baselineRun = baselineRuns[index];
    const entry = { run: toolRun.run };
    for (const key of keys) {
      const toolValue = toolRun[key];
      const baselineValue = baselineRun?.[key];
      if (toolValue == null || baselineValue == null) {
        entry[key] = null;
      } else {
        entry[key] = roundMetric(toolValue - baselineValue);
      }
    }
    return entry;
  });

  const stats = {};
  for (const key of keys) {
    const values = overheadRuns.map((run) => run[key]).filter((value) => value != null);
    stats[key] = summarizeRuns(values);
  }

  return { overheadRuns, stats };
}

export function ensureResultsDir() {
  const resultsDir = path.join(benchmarksRoot, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  return resultsDir;
}

export function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function summarizeRuns(values) {
  if (values.length === 0) return null;
  return {
    mean: roundMetric(mean(values)),
    min: roundMetric(Math.min(...values)),
    max: roundMetric(Math.max(...values)),
  };
}

export function roundMetric(value) {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value);
}
