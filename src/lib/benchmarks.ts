import type { CollectionEntry } from 'astro:content';
import { getCollection } from 'astro:content';

export type BenchmarkEntry = CollectionEntry<'benchmarks'>;
export type RunStat = { mean: number; min: number; max: number };
export type BenchRating = 'good' | 'mid' | 'bad';

/** Bold the tool name; keep the rest of the benchmark title at normal weight for scanning. */
export function splitBenchmarkTitle(
  title: string,
  toolName: string,
): { toolName: string; rest: string } {
  if (toolName && title.startsWith(toolName)) {
    return { toolName, rest: title.slice(toolName.length) };
  }
  return { toolName: title, rest: '' };
}

/** Absolute bands from the recorded corpus (see /methodology/). */
export const BENCH_THRESHOLDS = {
  overheadMs: { goodMax: 350, midMax: 800 },
  transferBytes: { goodMax: 10 * 1024, midMax: 50 * 1024 },
  decodedBytes: { goodMax: 20 * 1024, midMax: 150 * 1024 },
} as const;

export function rateOverheadMs(ms: number | null | undefined): BenchRating | null {
  if (ms == null) return null;
  if (ms <= BENCH_THRESHOLDS.overheadMs.goodMax) return 'good';
  if (ms <= BENCH_THRESHOLDS.overheadMs.midMax) return 'mid';
  return 'bad';
}

export function rateTransferBytes(bytes: number | null | undefined): BenchRating | null {
  if (bytes == null) return null;
  if (bytes <= BENCH_THRESHOLDS.transferBytes.goodMax) return 'good';
  if (bytes <= BENCH_THRESHOLDS.transferBytes.midMax) return 'mid';
  return 'bad';
}

export function rateDecodedBytes(bytes: number | null | undefined): BenchRating | null {
  if (bytes == null) return null;
  if (bytes <= BENCH_THRESHOLDS.decodedBytes.goodMax) return 'good';
  if (bytes <= BENCH_THRESHOLDS.decodedBytes.midMax) return 'mid';
  return 'bad';
}

export function rateLoadingMethod(
  loading: 'async' | 'defer' | 'blocking' | 'module' | string | undefined,
  renderBlocking: boolean,
): BenchRating {
  if (renderBlocking || loading === 'blocking') return 'bad';
  return 'good';
}

export function benchRatingClass(rating: BenchRating | null | undefined): string {
  if (!rating) return '';
  return `bench-rating bench-rating--${rating}`;
}

export function benchRatingLabel(rating: BenchRating | null | undefined): string | undefined {
  if (!rating) return undefined;
  switch (rating) {
    case 'good':
      return 'Good';
    case 'mid':
      return 'Medium';
    case 'bad':
      return 'Poor';
  }
}

/** Only recorded benchmarks are published on the site. */
export function isPublishedBenchmark(benchmark: BenchmarkEntry): boolean {
  return benchmark.data.status === 'recorded';
}

export async function getPublishedBenchmarks(): Promise<BenchmarkEntry[]> {
  const benchmarks = await getCollection('benchmarks');
  return benchmarks
    .filter(isPublishedBenchmark)
    .sort((a, b) => b.data.testDate.localeCompare(a.data.testDate));
}

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

