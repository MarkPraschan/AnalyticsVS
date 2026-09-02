export const FIXTURE_VERSION = 'minimal-v1';

export const FIXTURE_PATH_PREFIX = '/bench/minimal-v1';

export const CONTROL_SLUG = '_control';

export const RUN_COUNT = 7;

export const POST_LOAD_WAIT_MS = 5000;

/** Chrome DevTools Slow 4G preset (see benchmarks/README) */
export const NETWORK_SLOW_4G = {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
};

/** @deprecated Use NETWORK_SLOW_4G */
export const NETWORK_FAST_4G = NETWORK_SLOW_4G;

export const ENVIRONMENT_LABEL = {
  connection: 'Slow 4G (Simulated)',
  device: 'Desktop (Chromium)',
};
