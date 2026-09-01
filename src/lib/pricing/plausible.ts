import type { PricingInput, PricingResult } from './types';
import { lookupPageviewTier } from './types';
import { applyProjectPricing, projectCount, TOOL_PROJECT_CONFIGS } from './projects';

const STARTER_TIERS = [
  { limit: 10_000, price: 9 },
  { limit: 100_000, price: 19 },
  { limit: 200_000, price: 29 },
  { limit: 500_000, price: 49 },
  { limit: 1_000_000, price: 69 },
  { limit: 2_000_000, price: 89 },
  { limit: 5_000_000, price: 109 },
  { limit: 10_000_000, price: 149 },
];

export function calculatePlausiblePricing(input: PricingInput): PricingResult {
  const base = lookupPageviewTier(input.pageviews, STARTER_TIERS);
  const projects = projectCount(input);

  if (projects > 1) {
    base.label = `Starter · ${base.label}`;
  }

  return applyProjectPricing(TOOL_PROJECT_CONFIGS.plausible, input, base);
}
