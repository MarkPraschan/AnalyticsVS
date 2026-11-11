export interface ToolAffiliateData {
  id: string;
  name: string;
  website: string;
  affiliate: {
    enabled: boolean;
    url?: string;
    commission?: string;
    notes?: string;
  };
}

type AffiliateConfig = ToolAffiliateData['affiliate'];

/** Env override: AFFILIATE_URL_<TOOL_ID> e.g. AFFILIATE_URL_PLAUSIBLE */
function getAffiliateEnvOverride(toolId: string): string | undefined {
  const key = `AFFILIATE_URL_${toolId.toUpperCase().replace(/-/g, '_')}`;
  const value = import.meta.env?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function resolveAffiliateUrl(affiliate: AffiliateConfig, toolId: string): string | undefined {
  const envUrl = getAffiliateEnvOverride(toolId);
  if (envUrl) return envUrl;
  return affiliate.url;
}

export function isAffiliateTool(tool: ToolAffiliateData): boolean {
  if (!tool.affiliate.enabled) return false;
  return Boolean(resolveAffiliateUrl(tool.affiliate, tool.id));
}

export function getToolVisitUrl(tool: ToolAffiliateData): string {
  if (isAffiliateTool(tool)) {
    return resolveAffiliateUrl(tool.affiliate, tool.id)!;
  }
  return tool.website;
}

export function getToolVisitRel(tool: ToolAffiliateData): string {
  return isAffiliateTool(tool) ? 'noopener noreferrer sponsored' : 'noopener noreferrer';
}

/**
 * Host → affiliate program rules for rewriting every outbound vendor link.
 * Keep in sync with `affiliate.url` in `src/content/tools/*.json`.
 */
const AFFILIATE_OUTBOUND_PROGRAMS: Array<{
  toolId: string;
  matchHost: (host: string) => boolean;
  /** Preserve path + query-tag (Rewardful). */
  mode: 'query' | 'replace';
  queryParam?: string;
  queryValue?: string;
  defaultUrl: string;
}> = [
  {
    toolId: 'datafast',
    matchHost: (host) => host === 'datafa.st',
    mode: 'query',
    queryParam: 'via',
    queryValue: 'analyticsvs',
    defaultUrl: 'https://datafa.st/?via=analyticsvs',
  },
  {
    toolId: 'fathom',
    matchHost: (host) => host === 'usefathom.com',
    mode: 'replace',
    defaultUrl: 'https://usefathom.com/ref/U4V5UE',
  },
  {
    toolId: 'hotjar',
    matchHost: (host) => host === 'hotjar.com' || host.endsWith('.hotjar.com'),
    mode: 'replace',
    defaultUrl: 'https://invite.contentsquare.com/analyticsvs',
  },
];

function programAffiliateUrl(toolId: string, fallback: string): string {
  return getAffiliateEnvOverride(toolId) ?? fallback;
}

/**
 * Rewrite outbound vendor URLs onto the affiliate destination when a program applies.
 * - DataFast: keep path, set `?via=analyticsvs`
 * - Fathom / Hotjar: replace with the partner landing URL (programs are not deep-linkable)
 */
export function tagAffiliateOutboundUrl(href: string): string {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return href;
  }

  const host = url.hostname.replace(/^www\./, '');

  // Already on Hotjar's Contentsquare invite host
  if (host === 'invite.contentsquare.com') return href;

  for (const program of AFFILIATE_OUTBOUND_PROGRAMS) {
    if (!program.matchHost(host)) continue;
    const affiliateUrl = programAffiliateUrl(program.toolId, program.defaultUrl);

    if (program.mode === 'query' && program.queryParam && program.queryValue) {
      if (!url.searchParams.get(program.queryParam)) {
        url.searchParams.set(program.queryParam, program.queryValue);
      }
      return url.toString();
    }

    return affiliateUrl;
  }

  return href;
}

export function isAffiliateOutboundUrl(href: string): boolean {
  try {
    const url = new URL(href);
    const host = url.hostname.replace(/^www\./, '');
    if (host === 'invite.contentsquare.com') return true;
    return AFFILIATE_OUTBOUND_PROGRAMS.some((program) => program.matchHost(host));
  } catch {
    return /usefathom\.com\/ref\/|invite\.contentsquare\.com\//i.test(href);
  }
}

/** Hosts that markdown/content should treat as affiliate for disclosure detection. */
export const AFFILIATE_CONTENT_HOST_PATTERN =
  /usefathom\.com|datafa\.st|hotjar\.com|invite\.contentsquare\.com/i;

export interface AffiliatePartner {
  id: string;
  name: string;
  commission?: string;
  notes?: string;
}

export function getAffiliatePartners(
  tools: Array<{ data: ToolAffiliateData }>,
): AffiliatePartner[] {
  return tools
    .filter((tool) => isAffiliateTool(tool.data))
    .map((tool) => ({
      id: tool.data.id,
      name: tool.data.name,
      commission: tool.data.affiliate.commission,
      notes: tool.data.affiliate.notes,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
