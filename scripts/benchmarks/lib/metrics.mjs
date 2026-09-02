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

function isMeasurableScriptUrl(url) {
  if (/\/g\/collect/.test(url)) return false;
  return /\.js(\?|$)/.test(url) || /\/gtag\/js(\?|$)/.test(url);
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
    if (type !== 'Script') return;
    if (!matchesHostPattern(response.url, scriptHostPatterns)) return;
    if (!isMeasurableScriptUrl(response.url)) return;
    requestIds.add(requestId);
    scriptResponses.set(requestId, {
      url: response.url,
      requestId,
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

      for (const entry of scriptResponses.values()) {
        if (entry.decodedBodySizeBytes > 0) continue;
        try {
          const body = await cdp.send('Network.getResponseBody', { requestId: entry.requestId });
          entry.decodedBodySizeBytes = Buffer.from(
            body.body,
            body.base64Encoded ? 'base64' : 'utf8',
          ).length;
        } catch {
          // Response body may be unavailable for cached or opaque responses.
        }
      }

      const longTasks = await page.evaluate(() => window.__benchmarkLongTasks ?? []);
      let scripts = [...scriptResponses.values()];

      if (scripts.length === 0) {
        scripts = await page.evaluate((patterns) => {
          function measureScript(url) {
            if (/\/g\/collect/.test(url)) return false;
            return /\.js(\?|$)/.test(url) || /\/gtag\/js(\?|$)/.test(url);
          }

          return performance
            .getEntriesByType('resource')
            .filter((entry) => patterns.some((pattern) => entry.name.includes(pattern)))
            .filter((entry) => measureScript(entry.name))
            .map((entry) => ({
              url: entry.name,
              transferSizeBytes: entry.transferSize || 0,
              decodedBodySizeBytes: entry.decodedBodySize || 0,
            }));
        }, scriptHostPatterns);
      }

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
