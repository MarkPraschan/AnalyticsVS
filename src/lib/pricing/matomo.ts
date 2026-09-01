import type { PricingInput, PricingResult } from './types';
import { lookupEventTier } from './types';
import { applyProjectPricing, TOOL_PROJECT_CONFIGS } from './projects';

const CLOUD_TIERS = [
  { limit: 50_000, price: 23, label: 'Cloud · up to 50K hits' },
  { limit: 100_000, price: 49, label: 'Cloud · up to 100K hits' },
  { limit: 250_000, price: 99, label: 'Cloud · up to 250K hits' },
  { limit: 500_000, price: 189, label: 'Cloud · up to 500K hits' },
  { limit: 1_000_000, price: 389, label: 'Cloud · up to 1M hits' },
];

export function calculateMatomoPricing(input: PricingInput): PricingResult {
  const result = lookupEventTier(input.pageviews + input.events, CLOUD_TIERS);
  const base = { ...result, note: 'Self-hosted is free' };

  return applyProjectPricing(TOOL_PROJECT_CONFIGS.matomo, input, base);
}
