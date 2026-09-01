export interface PricingInput {
  pageviews: number;
  events: number;
  projects: number;
}

export interface PricingResult {
  monthlyCost: number | null;
  label: string;
  note?: string;
}

export type PricingCalculator = (input: PricingInput) => PricingResult;

export function lookupPageviewTier(
  pageviews: number,
  tiers: { limit: number; price: number; label?: string }[],
): PricingResult {
  return lookupVolumeTier(pageviews, tiers, 'pageviews');
}

export function lookupEventTier(
  events: number,
  tiers: { limit: number; price: number; label?: string }[],
): PricingResult {
  return lookupVolumeTier(events, tiers, 'events');
}

function lookupVolumeTier(
  volume: number,
  tiers: { limit: number; price: number; label?: string }[],
  unit: 'pageviews' | 'events',
): PricingResult {
  const sorted = [...tiers].sort((a, b) => a.limit - b.limit);
  const tier = sorted.find((t) => volume <= t.limit) ?? sorted[sorted.length - 1];

  if (!tier) {
    return { monthlyCost: null, label: 'Contact sales' };
  }

  return {
    monthlyCost: tier.price,
    label: tier.label ?? `Up to ${tier.limit.toLocaleString()} ${unit}`,
  };
}
