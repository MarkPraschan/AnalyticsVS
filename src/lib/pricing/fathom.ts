import type { PricingInput, PricingResult } from './types';
import { lookupPageviewTier } from './types';
import { applyProjectPricing, TOOL_PROJECT_CONFIGS } from './projects';

const TIERS = [
  { limit: 100_000, price: 15 },
  { limit: 200_000, price: 25 },
  { limit: 500_000, price: 39 },
  { limit: 1_000_000, price: 59 },
  { limit: 2_000_000, price: 79 },
  { limit: 5_000_000, price: 119 },
  { limit: 10_000_000, price: 169 },
];

export function calculateFathomPricing(input: PricingInput): PricingResult {
  const base =
    input.pageviews < 100_000
      ? {
          monthlyCost: 15,
          label: 'Minimum plan (up to 100K pageviews)',
          note: 'Fathom minimum plan covers up to 100,000 pageviews.',
        }
      : lookupPageviewTier(input.pageviews, TIERS);

  return applyProjectPricing(TOOL_PROJECT_CONFIGS.fathom, input, base);
}
