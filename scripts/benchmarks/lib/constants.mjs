export const FIXTURE_VERSION = 'minimal-v1';

export const FIXTURE_PATH_PREFIX = '/bench/minimal-v1';

export const RUN_COUNT = 7;

export const POST_LOAD_WAIT_MS = 5000;

/** Lighthouse-style Fast 4G (see scripts/benchmarks/README) */
export const NETWORK_FAST_4G = {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
};

export const ENVIRONMENT_LABEL = {
  connection: 'Fast 4G',
  device: 'Desktop',
};
