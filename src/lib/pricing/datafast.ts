import type { PricingInput, PricingResult } from './types';
import { lookupEventTier } from './types';
import { applyProjectPricing, projectCount, TOOL_PROJECT_CONFIGS } from './projects';

const STARTER_TIERS = [
  { limit: 10_000, price: 9 },
  { limit: 100_000, price: 19 },
  { limit: 200_000, price: 29 },
  { limit: 500_000, price: 49 },
  { limit: 1_000_000, price: 69 },
  { limit: 2_000_000, price: 89 },
  { limit: 5_000_000, price: 129 },
  { limit: 10_000_000, price: 169 },
];

const GROWTH_TIERS = [
  { limit: 10_000, price: 19 },
  { limit: 100_000, price: 39 },
  { limit: 200_000, price: 59 },
  { limit: 500_000, price: 99 },
  { limit: 1_000_000, price: 139 },
  { limit: 2_000_000, price: 179 },
  { limit: 5_000_000, price: 259 },
  { limit: 10_000_000, price: 339 },
];

export function calculateDataFastPricing(input: PricingInput): PricingResult {
  const volume = input.pageviews + input.events;
  const projects = projectCount(input);
  const tiers = projects > 1 ? GROWTH_TIERS : STARTER_TIERS;
  const base = lookupEventTier(volume, tiers);

  if (projects <= 1) {
    base.label = `Starter · ${base.label}`;
  }

  return applyProjectPricing(TOOL_PROJECT_CONFIGS.datafast, input, base);
}
