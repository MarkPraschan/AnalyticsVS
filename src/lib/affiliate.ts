export interface ToolAffiliateData {
  id: string;
  name: string;
  website: string;
  affiliate: {
    enabled: boolean;
    url?: string;
    commission?: string;
  };
}

type AffiliateConfig = ToolAffiliateData['affiliate'];

/** Env override: AFFILIATE_URL_<TOOL_ID> e.g. AFFILIATE_URL_PLAUSIBLE */
function getAffiliateEnvOverride(toolId: string): string | undefined {
  const key = `AFFILIATE_URL_${toolId.toUpperCase().replace(/-/g, '_')}`;
  const value = import.meta.env[key];
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

export interface AffiliatePartner {
  id: string;
  name: string;
  commission?: string;
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
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
