import { AFFILIATE_HREF_PATTERN } from './affiliate.ts';

export type OutboundPageType = 'tool' | 'compare' | 'learn' | 'guide' | 'calculator' | 'other';

export interface ToolHostSource {
  id: string;
  slug?: string;
  website: string;
  affiliateUrl?: string;
  variantWebsites?: string[];
}

export interface ToolOutboundClickProperties {
  tool: string;
  affiliate: boolean;
  destination_url: string;
  destination_host: string;
  placement: string;
  page_type: OutboundPageType;
}

export interface ClassifyToolOutboundClickInput {
  href: string;
  rel?: string | null;
  dataTool?: string | null;
  dataPlacement?: string | null;
  pathname: string;
  currentHost: string;
  hostMap: Record<string, string>;
}

const SITE_HOSTS = new Set(['analyticsvs.com']);

/** Parent hosts that would over-match if we lifted a subdomain (e.g. analytics.google.com). */
const SKIP_PARENT_HOSTS = new Set(['google.com', 'microsoft.com', 'amazon.com', 'apple.com']);

export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./, '');
}

export function pageTypeFromPath(pathname: string): OutboundPageType {
  const path = pathname.split(/[?#]/)[0] ?? pathname;
  const normalized = path.replace(/\/+$/, '') || '/';
  if (normalized === '/tools' || normalized.startsWith('/tools/')) return 'tool';
  if (normalized === '/compare' || normalized.startsWith('/compare/')) return 'compare';
  if (normalized === '/guides' || normalized.startsWith('/guides/')) return 'guide';
  if (normalized === '/learn' || normalized.startsWith('/learn/')) return 'learn';
  if (normalized === '/calculators' || normalized.startsWith('/calculators/')) return 'calculator';
  return 'other';
}

export function isAffiliateClick(href: string, rel?: string | null): boolean {
  if (rel && /\bsponsored\b/i.test(rel)) return true;
  return AFFILIATE_HREF_PATTERN.test(href);
}

function addHost(map: Record<string, string>, host: string, tool: string): void {
  const normalized = normalizeHost(host);
  if (!normalized || SITE_HOSTS.has(normalized)) return;
  map[normalized] ??= tool;

  const labels = normalized.split('.');
  if (labels.length > 2) {
    const parent = labels.slice(-2).join('.');
    if (!SKIP_PARENT_HOSTS.has(parent) && !SITE_HOSTS.has(parent)) {
      map[parent] ??= tool;
    }
  }
}

function addUrlHost(map: Record<string, string>, rawUrl: string | undefined, tool: string): void {
  if (!rawUrl) return;
  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
    addHost(map, url.hostname, tool);
  } catch {
    // Ignore malformed vendor URLs in content data.
  }
}

export function buildToolHostMap(tools: ToolHostSource[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const tool of tools) {
    const slug = tool.slug || tool.id;
    addUrlHost(map, tool.website, slug);
    addUrlHost(map, tool.affiliateUrl, slug);
    for (const website of tool.variantWebsites ?? []) {
      addUrlHost(map, website, slug);
    }
  }
  return map;
}

function parseHref(href: string, currentHost: string): URL | null {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return null;
  }
  try {
    return new URL(trimmed, `https://${currentHost || 'www.analyticsvs.com'}`);
  } catch {
    return null;
  }
}

function isInternalDestination(url: URL, currentHost: string): boolean {
  const host = normalizeHost(url.hostname);
  if (SITE_HOSTS.has(host)) return true;
  const local = normalizeHost(currentHost);
  return Boolean(local) && host === local;
}

export function classifyToolOutboundClick(
  input: ClassifyToolOutboundClickInput,
): ToolOutboundClickProperties | null {
  const url = parseHref(input.href, input.currentHost);
  if (!url) return null;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
  if (isInternalDestination(url, input.currentHost)) return null;

  const destinationHost = normalizeHost(url.hostname);
  const dataTool = input.dataTool?.trim();
  const tool = dataTool || input.hostMap[destinationHost];
  if (!tool) return null;

  return {
    tool,
    affiliate: isAffiliateClick(input.href, input.rel),
    destination_url: input.href,
    destination_host: destinationHost,
    placement: input.dataPlacement?.trim() || 'inline',
    page_type: pageTypeFromPath(input.pathname),
  };
}
