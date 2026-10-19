import type { PricingInput, PricingResult } from './types';
import { lookupEventTier } from './types';
import { applyProjectPricing, TOOL_PROJECT_CONFIGS } from './projects';

const CLOUD_TIERS = [
  { limit: 50_000, price: 26, label: 'Cloud · up to 50K hits' },
  { limit: 100_000, price: 42, label: 'Cloud · up to 100K hits' },
  { limit: 300_000, price: 85, label: 'Cloud · up to 300K hits' },
  { limit: 600_000, price: 139, label: 'Cloud · up to 600K hits' },
  { limit: 1_000_000, price: 204, label: 'Cloud · up to 1M hits' },
  { limit: 2_000_000, price: 399, label: 'Cloud · up to 2M hits' },
  { limit: 5_000_000, price: 975, label: 'Cloud · up to 5M hits' },
];

export function calculateMatomoPricing(input: PricingInput): PricingResult {
  const hits = input.pageviews + input.events;
  const result: PricingResult =
    hits > 5_000_000
      ? {
          monthlyCost: null,
          label: '10M+ hits',
          note: 'Contact Matomo for Cloud above 5M hits. Self-hosted is free.',
        }
      : { ...lookupEventTier(hits, CLOUD_TIERS), note: 'Self-hosted is free' };

  return applyProjectPricing(TOOL_PROJECT_CONFIGS.matomo, input, result);
}
