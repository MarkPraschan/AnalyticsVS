import { NETWORK_FAST_4G, POST_LOAD_WAIT_MS } from './constants.mjs';

function matchesHostPattern(url, patterns) {
  return patterns.some((pattern) => url.includes(pattern));
}

export async function setupLongTaskObserver(page) {
  await page.addInitScript(() => {
    window.__benchmarkLongTasks = [];
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__benchmarkLongTasks.push({
          startTime: entry.startTime,
          duration: entry.duration,
          name: entry.name,
        });
      }
    });
    observer.observe({ type: 'longtask', buffered: true });
  });
}

export async function collectRunMetrics(page, scriptHostPatterns) {
  const scriptResponses = new Map();
  const requestIds = new Set();

  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NETWORK_FAST_4G);
  await cdp.send('Network.clearBrowserCache');

  cdp.on('Network.responseReceived', (event) => {
    const { requestId, response, type } = event;
    if (!['Script', 'XHR', 'Fetch', 'Document'].includes(type)) return;
    if (!matchesHostPattern(response.url, scriptHostPatterns)) return;
    requestIds.add(requestId);
    scriptResponses.set(requestId, {
      url: response.url,
      transferSizeBytes: 0,
      decodedBodySizeBytes: 0,
    });
  });

  cdp.on('Network.loadingFinished', (event) => {
    if (!requestIds.has(event.requestId)) return;
    const existing = scriptResponses.get(event.requestId);
    if (!existing) return;
    scriptResponses.set(event.requestId, {
      ...existing,
      transferSizeBytes: event.encodedDataLength ?? 0,
      decodedBodySizeBytes: event.decodedBodyLength ?? 0,
    });
  });

  return {
    async finish() {
      await page.waitForTimeout(POST_LOAD_WAIT_MS);

      const longTasks = await page.evaluate(() => window.__benchmarkLongTasks ?? []);
      const scripts = [...scriptResponses.values()].filter((entry) => entry.url.endsWith('.js') || entry.url.includes('.js?'));

      const transferSizeBytes = scripts.reduce((sum, entry) => sum + entry.transferSizeBytes, 0);
      const decodedBodySizeBytes = scripts.reduce((sum, entry) => sum + entry.decodedBodySizeBytes, 0);
      const mainThreadBlockingMs = longTasks
        .filter((task) => task.duration > 50)
        .reduce((sum, task) => sum + (task.duration - 50), 0);

      return {
        transferSizeBytes,
        decodedBodySizeBytes,
        mainThreadBlockingMs: Math.round(mainThreadBlockingMs * 10) / 10,
        scriptUrls: scripts.map((entry) => entry.url),
        longTaskCount: longTasks.length,
      };
    },
  };
}
