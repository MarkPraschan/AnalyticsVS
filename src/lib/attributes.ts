import type { CollectionEntry } from 'astro:content';

export type ToolData = CollectionEntry<'tools'>['data'];

export type AttributeId =
  | 'free'
  | 'free-trial'
  | 'gdpr-friendly'
  | 'cookieless'
  | 'revenue-tracking'
  | 'product-analytics'
  | 'session-replay'
  | 'self-hosted'
  | 'open-source';

export interface AttributeMeta {
  id: AttributeId;
  label: string;
  dotClassName: string;
  bgClassName: string;
  borderBClassName: string;
}

const ATTRIBUTE_ORDER: AttributeId[] = [
  'free',
  'free-trial',
  'revenue-tracking',
  'gdpr-friendly',
  'cookieless',
  'product-analytics',
  'session-replay',
  'self-hosted',
  'open-source',
];

export const ATTRIBUTE_META: Record<AttributeId, AttributeMeta> = {
  free: {
    id: 'free',
    label: 'Free',
    dotClassName: 'fill-lime-500',
    bgClassName: 'bg-gradient-to-br from-white to-lime-50',
    borderBClassName: 'border-b-lime-200',
  },
  'free-trial': {
    id: 'free-trial',
    label: 'Free trial',
    dotClassName: 'fill-green-500',
    bgClassName: 'bg-gradient-to-br from-white to-green-50',
    borderBClassName: 'border-b-green-200',
  },
  'gdpr-friendly': {
    id: 'gdpr-friendly',
    label: 'GDPR-friendly',
    dotClassName: 'fill-amber-500',
    bgClassName: 'bg-gradient-to-br from-white to-amber-50',
    borderBClassName: 'border-b-amber-200',
  },
  cookieless: {
    id: 'cookieless',
    label: 'Cookieless',
    dotClassName: 'fill-amber-500',
    bgClassName: 'bg-gradient-to-br from-white to-amber-50',
    borderBClassName: 'border-b-amber-200',
  },
  'revenue-tracking': {
    id: 'revenue-tracking',
    label: 'Revenue tracking',
    dotClassName: 'fill-indigo-500',
    bgClassName: 'bg-gradient-to-br from-white to-indigo-50',
    borderBClassName: 'border-b-indigo-200',
  },
  'product-analytics': {
    id: 'product-analytics',
    label: 'Product analytics',
    dotClassName: 'fill-indigo-500',
    bgClassName: 'bg-gradient-to-br from-white to-indigo-50',
    borderBClassName: 'border-b-indigo-200',
  },
  'session-replay': {
    id: 'session-replay',
    label: 'Session replay',
    dotClassName: 'fill-violet-500',
    bgClassName: 'bg-gradient-to-br from-white to-violet-50',
    borderBClassName: 'border-b-violet-200',
  },
  'self-hosted': {
    id: 'self-hosted',
    label: 'Self-hosted',
    dotClassName: 'fill-slate-500',
    bgClassName: 'bg-gradient-to-br from-white to-slate-50',
    borderBClassName: 'border-b-slate-200',
  },
  'open-source': {
    id: 'open-source',
    label: 'Open source',
    dotClassName: 'fill-slate-500',
    bgClassName: 'bg-gradient-to-br from-white to-slate-50',
    borderBClassName: 'border-b-slate-200',
  },
};

function hasFreeTier(tool: ToolData): boolean {
  const { pricing } = tool;
  if (pricing.model === 'free') return true;
  if (pricing.tiers?.some((tier) => tier.price === 0)) return true;
  return false;
}

export function resolveToolAttributes(tool: ToolData): AttributeMeta[] {
  const ids = new Set<AttributeId>();
  const { features, pricing } = tool;

  if (hasFreeTier(tool)) ids.add('free');
  if (pricing.hasFreeTrial) ids.add('free-trial');
  if (features.gdpr_compliant) ids.add('gdpr-friendly');
  if (features.cookieless) ids.add('cookieless');
  if (features.revenue_tracking) ids.add('revenue-tracking');
  if (features.product_analytics) ids.add('product-analytics');
  if (features.session_recordings) ids.add('session-replay');
  if (features.self_hosted) ids.add('self-hosted');
  if (features.open_source) ids.add('open-source');

  return ATTRIBUTE_ORDER.filter((id) => ids.has(id)).map((id) => ATTRIBUTE_META[id]);
}
