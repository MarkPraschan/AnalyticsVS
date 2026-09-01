import { getCollection } from 'astro:content';
import type { CollectionEntry } from 'astro:content';

export type ToolEntry = CollectionEntry<'tools'>;

export async function getAllTools(): Promise<ToolEntry[]> {
  return (await getCollection('tools')).sort((a, b) =>
    a.data.name.localeCompare(b.data.name),
  );
}

export async function getToolBySlug(slug: string): Promise<ToolEntry | undefined> {
  const tools = await getAllTools();
  return tools.find((t) => t.data.slug === slug);
}

export async function getToolById(id: string): Promise<ToolEntry | undefined> {
  const tools = await getAllTools();
  return tools.find((t) => t.data.id === id);
}

export async function getToolsByIds(ids: string[]): Promise<ToolEntry[]> {
  const tools = await getAllTools();
  const byId = new Map(tools.map((tool) => [tool.data.id, tool]));
  return ids.flatMap((id) => {
    const tool = byId.get(id);
    return tool ? [tool] : [];
  });
}

export async function getComparisonsForTool(toolId: string) {
  const comparisons = await getCollection('comparisons');
  return comparisons.filter((c) => c.data.tools.includes(toolId));
}

export async function getBenchmarksForTool(toolId: string) {
  const benchmarks = await getCollection('benchmarks');
  return benchmarks.filter((b) => b.data.tool === toolId);
}

export {
  getAffiliatePartners,
  getToolVisitRel,
  getToolVisitUrl,
  isAffiliateTool,
  resolveAffiliateUrl,
} from './affiliate';
export type { AffiliatePartner } from './affiliate';

export function getToolInitial(name: string): string {
  const match = name.trim().match(/[A-Za-z0-9]/);
  return match ? match[0]!.toUpperCase() : '?';
}

export const FEATURE_KEYS = [
  'cookieless',
  'gdpr_compliant',
  'real_time',
  'custom_events',
  'funnels',
  'heatmaps',
  'session_recordings',
  'ab_testing',
  'product_analytics',
  'revenue_tracking',
  'self_hosted',
  'open_source',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

type ToolFeatures = ToolEntry['data']['features'];

export function hasFeature(features: ToolFeatures, key: FeatureKey): boolean {
  return Boolean(features[key]);
}

/** Variant names where this feature differs from the primary product row. */
export function getVariantFeatureNotes(
  tool: ToolEntry['data'],
  key: FeatureKey,
): string[] {
  const primaryValue = Boolean(tool.features[key]);
  const variants = tool.variants ?? [];

  return variants
    .filter((variant) => {
      const variantValue = variant.features?.[key];
      if (variantValue === undefined) return false;
      return Boolean(variantValue) !== primaryValue;
    })
    .map((variant) => variant.name);
}

export function formatVariantFeatureNote(variantNames: string[]): string | undefined {
  if (variantNames.length === 0) return undefined;
  if (variantNames.length === 1) return `Yes via ${variantNames[0]}`;
  return `Yes via ${variantNames.slice(0, -1).join(', ')} or ${variantNames.at(-1)}`;
}

export function getPrimaryProductLabel(tool: ToolEntry['data']): string {
  return tool.name;
}

export interface ProductEdition {
  id: string;
  name: string;
  deployment: 'cloud' | 'self-hosted';
  website: string;
  summary: string;
  isPrimary: boolean;
}

export function getProductEditions(tool: ToolEntry['data']): ProductEdition[] {
  const variants = tool.variants ?? [];
  if (variants.length === 0) return [];

  const primary: ProductEdition = {
    id: tool.id,
    name: tool.name,
    deployment: tool.features.self_hosted ? 'self-hosted' : 'cloud',
    website: tool.website,
    summary: tool.tagline,
    isPrimary: true,
  };

  return [
    primary,
    ...variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      deployment: variant.deployment,
      website: variant.website,
      summary: variant.summary,
      isPrimary: false,
    })),
  ];
}

export function isVariantOnlyFeature(tool: ToolEntry['data'], key: FeatureKey): boolean {
  if (Boolean(tool.features[key])) return false;
  return getVariantFeatureNotes(tool, key).length > 0;
}

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  cookieless: 'Cookieless',
  gdpr_compliant: 'GDPR-friendly',
  real_time: 'Realtime data',
  custom_events: 'Custom events',
  funnels: 'Funnels',
  heatmaps: 'Heatmaps',
  session_recordings: 'Session recordings',
  ab_testing: 'A/B testing',
  product_analytics: 'Product analytics',
  self_hosted: 'Self-hostable',
  open_source: 'Open source',
  revenue_tracking: 'Revenue tracking',
};
