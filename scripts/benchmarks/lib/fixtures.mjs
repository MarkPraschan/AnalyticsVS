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

export function getConfiguredTools() {
  const manifest = loadManifest();
  const snippets = loadSnippets();
  if (!snippets?.tools) {
    return [];
  }

  return manifest.tools.filter((tool) => {
    const entry = snippets.tools[tool.id];
    if (!entry?.headHtml) return false;
    const html = entry.headHtml.trim();
    return html.length > 0 && !html.startsWith('<!--');
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

export function ensureResultsDir() {
  const resultsDir = path.join(benchmarksRoot, 'results');
  fs.mkdirSync(resultsDir, { recursive: true });
  return resultsDir;
}

export function mean(values) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function roundMetric(value) {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value);
}
