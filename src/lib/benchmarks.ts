import type { CollectionEntry } from 'astro:content';

export type BenchmarkEntry = CollectionEntry<'benchmarks'>;
export type RunStat = { mean: number; min: number; max: number };

export function getRunStat(
  benchmark: BenchmarkEntry['data'],
  key: keyof NonNullable<BenchmarkEntry['data']['runStats']>,
): RunStat | null {
  const stat = benchmark.runStats?.[key];
  if (!stat) return null;
  return stat;
}

export function getOverheadStat(
  benchmark: BenchmarkEntry['data'],
  key: 'pageLoadMs' | 'mainThreadBlockingMs',
): RunStat | null {
  const stat = benchmark.overhead?.runStats?.[key];
  if (!stat) return null;
  return stat;
}

export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${Math.round(ms)} ms`;
}

export function formatAddedMs(ms: number | null | undefined): string {
  if (ms == null) return '—';
  const formatted = formatMs(Math.abs(ms));
  if (ms <= 0) return formatted;
  return `+${formatted}`;
}

export function formatRunRange(stat: RunStat | null, formatter: (n: number) => string): string | null {
  if (!stat) return null;
  if (stat.min === stat.max) return `All 7 runs: ${formatter(stat.min)}`;
  return `Range: ${formatter(stat.min)} – ${formatter(stat.max)}`;
}

export function formatKib(bytes: number | null | undefined): string {
  if (bytes == null) return '—';
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

export function barWidthPercent(value: number, maxValue: number): number {
  if (maxValue <= 0) return 0;
  return Math.max(4, Math.round((value / maxValue) * 100));
}

export function formatRenderBlocking(blocking: boolean): string {
  return blocking ? 'Yes' : 'No';
}

export function formatLoadingMode(
  mode: 'async' | 'defer' | 'blocking' | 'module' | string | undefined,
): string {
  switch (mode) {
    case 'async':
      return 'Async';
    case 'defer':
      return 'Defer';
    case 'module':
      return 'Module';
    case 'blocking':
      return 'Blocking';
    default:
      return 'Async';
  }
}

export function formatSnippetLoadingSummary(
  loading: 'async' | 'defer' | 'blocking' | 'module' | string | undefined,
  renderBlocking: boolean,
): string {
  return `${formatLoadingMode(loading)} · ${renderBlocking ? 'render-blocking' : 'non-blocking'}`;
}

export function formatSnippetLoadingExplainer(
  loading: 'async' | 'defer' | 'blocking' | 'module' | string | undefined,
  renderBlocking: boolean,
): string {
  if (renderBlocking || loading === 'blocking') {
    return 'This script can pause the page while it downloads and runs, so the browser may wait before drawing the first visible content.';
  }
  if (loading === 'defer') {
    return 'This script downloads in the background and runs after the HTML is parsed, so the browser can draw the page’s first visible content without waiting on it.';
  }
  return 'This script downloads in the background, so the browser can draw the page’s first visible content without pausing to load the tracking code.';
}

