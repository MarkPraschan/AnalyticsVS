export interface ScatterPoint {
  id: string;
  label: string;
  href: string;
  transferBytes: number;
  overheadMs: number;
  transferLabel: string;
  overheadLabel: string;
  rating: 'good' | 'mid' | 'bad';
  logoUrl: string | null;
  initial: string;
}

interface ChartGeometry {
  width: number;
  height: number;
  pad: { top: number; right: number; bottom: number; left: number };
  plotW: number;
  plotH: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

const POINT_RADIUS = 15;

function formatKib(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

function formatOverhead(ms: number): string {
  if (ms >= 1000) return `+${(ms / 1000).toFixed(2)} s`;
  return `+${Math.round(ms)} ms`;
}

function logDomain(values: number[], padRatio = 0.12): { min: number; max: number } {
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const logMin = Math.log(Math.max(minValue, 1));
  const logMax = Math.log(Math.max(maxValue, minValue * 1.01, 2));
  const span = Math.max(logMax - logMin, 0.35);
  return {
    min: Math.exp(logMin - span * padRatio),
    max: Math.exp(logMax + span * padRatio),
  };
}

/** Nice log-ish tick candidates filtered to the visible domain. */
function logTicks(min: number, max: number, candidates: number[]): number[] {
  const ticks = candidates.filter((tick) => tick >= min * 0.98 && tick <= max * 1.02);
  if (ticks.length >= 3) return ticks;
  return [min, Math.sqrt(min * max), max];
}

function buildGeometry(points: ScatterPoint[], width: number): ChartGeometry {
  const height = Math.max(320, Math.min(460, Math.round(width * 0.64)));
  const pad = {
    top: 36,
    right: 24,
    bottom: 56,
    left: width < 520 ? 56 : 68,
  };
  const transferDomain = logDomain(points.map((point) => point.transferBytes));
  const overheadDomain = logDomain(points.map((point) => point.overheadMs));

  return {
    width,
    height,
    pad,
    plotW: width - pad.left - pad.right,
    plotH: height - pad.top - pad.bottom,
    xMin: transferDomain.min,
    xMax: transferDomain.max,
    yMin: overheadDomain.min,
    yMax: overheadDomain.max,
  };
}

function logT(value: number, min: number, max: number): number {
  const logMin = Math.log(min);
  const logMax = Math.log(max);
  return (Math.log(Math.max(value, min)) - logMin) / (logMax - logMin || 1);
}

/** High transfer on the left, low transfer (better) on the right. Log scale. */
function xFor(bytes: number, geo: ChartGeometry): number {
  return geo.pad.left + (1 - logT(bytes, geo.xMin, geo.xMax)) * geo.plotW;
}

/** Low overhead (better) at the top, high overhead at the bottom. Log scale. */
function yFor(ms: number, geo: ChartGeometry): number {
  return geo.pad.top + logT(ms, geo.yMin, geo.yMax) * geo.plotH;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replaceAll("'", '&#39;');
}

function pointMark(point: ScatterPoint, x: number, y: number): string {
  const r = POINT_RADIUS;
  if (point.logoUrl) {
    return `
      <circle class="benchmark-scatter__halo" cx="${x}" cy="${y}" r="${r + 2}" />
      <clipPath id="clip-${escapeAttr(point.id)}"><circle cx="${x}" cy="${y}" r="${r}" /></clipPath>
      <image href="${escapeAttr(point.logoUrl)}" x="${x - r}" y="${y - r}" width="${r * 2}" height="${r * 2}" clip-path="url(#clip-${escapeAttr(point.id)})" preserveAspectRatio="xMidYMid slice" />
    `;
  }

  return `
    <circle class="benchmark-scatter__halo" cx="${x}" cy="${y}" r="${r + 2}" />
    <circle class="benchmark-scatter__dot" cx="${x}" cy="${y}" r="${r}" />
    <text class="benchmark-scatter__initial" x="${x}" y="${y + 4}" text-anchor="middle">${escapeHtml(point.initial)}</text>
  `;
}

function renderChart(root: HTMLElement, points: ScatterPoint[]) {
  const frame = root.querySelector<HTMLElement>('[data-scatter-frame]');
  const tooltip = root.querySelector<HTMLElement>('[data-scatter-tooltip]');
  if (!frame || !tooltip || points.length === 0) return;

  const width = Math.max(320, Math.floor(frame.clientWidth));
  const geo = buildGeometry(points, width);
  const xTicks = logTicks(geo.xMin, geo.xMax, [
    2 * 1024,
    5 * 1024,
    10 * 1024,
    25 * 1024,
    50 * 1024,
    100 * 1024,
    200 * 1024,
  ]);
  const yTicks = logTicks(geo.yMin, geo.yMax, [200, 300, 500, 750, 1000, 1500, 2000]);

  const grid = [
    ...xTicks.map((tick) => {
      const x = xFor(tick, geo);
      return `<line class="benchmark-scatter__grid" x1="${x}" y1="${geo.pad.top}" x2="${x}" y2="${geo.pad.top + geo.plotH}" />`;
    }),
    ...yTicks.map((tick) => {
      const y = yFor(tick, geo);
      return `<line class="benchmark-scatter__grid" x1="${geo.pad.left}" y1="${y}" x2="${geo.pad.left + geo.plotW}" y2="${y}" />`;
    }),
  ].join('');

  const xLabels = xTicks
    .map((tick) => {
      const x = xFor(tick, geo);
      return `<text class="benchmark-scatter__tick" x="${x}" y="${geo.height - 30}" text-anchor="middle">${formatKib(tick)}</text>`;
    })
    .join('');

  const yLabels = yTicks
    .map((tick) => {
      const y = yFor(tick, geo);
      return `<text class="benchmark-scatter__tick" x="${geo.pad.left - 10}" y="${y + 4}" text-anchor="end">${formatOverhead(tick)}</text>`;
    })
    .join('');

  const pointsMarkup = points
    .map((point) => {
      const x = xFor(point.transferBytes, geo);
      const y = yFor(point.overheadMs, geo);
      const labelY = y - POINT_RADIUS - 10;
      return `<a
        class="benchmark-scatter__point benchmark-scatter__point--${point.rating}"
        href="${escapeAttr(point.href)}"
        data-scatter-point
        data-x="${x}"
        data-y="${y}"
        data-label="${escapeAttr(point.label)}"
        data-overhead="${escapeAttr(point.overheadLabel)}"
        data-transfer="${escapeAttr(point.transferLabel)}"
        aria-label="${escapeAttr(`${point.label}: ${point.overheadLabel} load overhead, ${point.transferLabel} transfer`)}"
      >
        ${pointMark(point, x, y)}
        <text class="benchmark-scatter__label" x="${x}" y="${labelY}" text-anchor="middle">${escapeHtml(point.label)}</text>
      </a>`;
    })
    .join('');

  frame.innerHTML = `
    <svg class="benchmark-scatter__svg" viewBox="0 0 ${geo.width} ${geo.height}" role="img" aria-hidden="true">
      <rect class="benchmark-scatter__plot" x="${geo.pad.left}" y="${geo.pad.top}" width="${geo.plotW}" height="${geo.plotH}" rx="12" />
      ${grid}
      <line class="benchmark-scatter__axis" x1="${geo.pad.left}" y1="${geo.pad.top + geo.plotH}" x2="${geo.pad.left + geo.plotW}" y2="${geo.pad.top + geo.plotH}" />
      <line class="benchmark-scatter__axis" x1="${geo.pad.left}" y1="${geo.pad.top}" x2="${geo.pad.left}" y2="${geo.pad.top + geo.plotH}" />
      ${xLabels}
      ${yLabels}
      <text class="benchmark-scatter__axis-label" x="${geo.pad.left + geo.plotW / 2}" y="${geo.height - 8}" text-anchor="middle">Heavier transfer ← → Lighter transfer (log)</text>
      <text class="benchmark-scatter__axis-label" x="14" y="${geo.pad.top + geo.plotH / 2}" text-anchor="middle" transform="rotate(-90 14 ${geo.pad.top + geo.plotH / 2})">Higher overhead ← → Lower overhead (log)</text>
      <text class="benchmark-scatter__corner" x="${geo.pad.left + geo.plotW - 10}" y="${geo.pad.top + 18}" text-anchor="end">Best</text>
      ${pointsMarkup}
    </svg>
  `;

  // Re-attach tooltip inside the frame so positioning is local to the chart.
  frame.appendChild(tooltip);

  const hideTooltip = () => {
    tooltip.hidden = true;
    tooltip.textContent = '';
  };

  const showTooltip = (target: SVGAElement) => {
    const label = target.dataset.label ?? '';
    const overhead = target.dataset.overhead ?? '';
    const transfer = target.dataset.transfer ?? '';
    const x = Number(target.dataset.x);
    const y = Number(target.dataset.y);
    tooltip.hidden = false;
    tooltip.innerHTML = `<strong>${escapeHtml(label)}</strong><span>${escapeHtml(overhead)} load · ${escapeHtml(transfer)} transfer</span>`;

    const svg = frame.querySelector('svg');
    if (!svg) return;
    const svgRect = svg.getBoundingClientRect();
    const frameRect = frame.getBoundingClientRect();
    const scaleX = svgRect.width / geo.width;
    const scaleY = svgRect.height / geo.height;
    const tipWidth = tooltip.offsetWidth;
    const tipHeight = tooltip.offsetHeight;
    const pointScreenX = (svgRect.left - frameRect.left) + x * scaleX;
    const pointScreenY = (svgRect.top - frameRect.top) + y * scaleY;
    let left = pointScreenX - tipWidth / 2;
    let top = pointScreenY - POINT_RADIUS * scaleY - tipHeight - 6;
    left = Math.max(4, Math.min(left, frameRect.width - tipWidth - 4));
    if (top < 4) top = pointScreenY + POINT_RADIUS * scaleY + 8;
    tooltip.style.transform = `translate(${left}px, ${top}px)`;
  };

  frame.querySelectorAll<SVGAElement>('[data-scatter-point]').forEach((pointEl) => {
    pointEl.addEventListener('mouseenter', () => showTooltip(pointEl));
    pointEl.addEventListener('focus', () => showTooltip(pointEl));
    pointEl.addEventListener('mouseleave', hideTooltip);
    pointEl.addEventListener('blur', hideTooltip);
  });

  hideTooltip();
}

export function initBenchmarkScatter(root: HTMLElement) {
  const points = JSON.parse(root.dataset.points ?? '[]') as ScatterPoint[];
  if (points.length === 0) return;

  const render = () => {
    if (!root.isConnected) return;
    renderChart(root, points);
  };
  render();

  const frame = root.querySelector('[data-scatter-frame]');
  const existing = (root as HTMLElement & { __scatterObserver?: ResizeObserver }).__scatterObserver;
  existing?.disconnect();

  if (frame && 'ResizeObserver' in window) {
    let frameWidth = frame.clientWidth;
    const observer = new ResizeObserver((entries) => {
      if (!root.isConnected) {
        observer.disconnect();
        return;
      }
      const nextWidth = Math.floor(entries[0]?.contentRect.width ?? frame.clientWidth);
      if (Math.abs(nextWidth - frameWidth) < 8) return;
      frameWidth = nextWidth;
      render();
    });
    observer.observe(frame);
    (root as HTMLElement & { __scatterObserver?: ResizeObserver }).__scatterObserver = observer;
  }
}
