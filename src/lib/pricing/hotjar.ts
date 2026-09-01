import type { PricingInput, PricingResult } from './types';
import { applyProjectPricing, TOOL_PROJECT_CONFIGS } from './projects';

const DAILY_TIERS = [
  { limit: 35, price: 0, label: 'Free (35 daily sessions)' },
  { limit: 100, price: 39, label: 'Plus' },
  { limit: 500, price: 99, label: 'Business' },
  { limit: 2000, price: 213, label: 'Business scale' },
];

export function calculateHotjarPricing(input: PricingInput): PricingResult {
  const estimatedDailySessions = Math.ceil(input.pageviews / 30 / 3);
  const tier =
    DAILY_TIERS.find((t) => estimatedDailySessions <= t.limit) ??
    DAILY_TIERS[DAILY_TIERS.length - 1];

  const base: PricingResult = {
    monthlyCost: tier.price,
    label: tier.label ?? `~${tier.limit} daily sessions`,
    note: `Estimated from ${input.pageviews.toLocaleString()} monthly pageviews (assumes ~3 pageviews/session). Hotjar bills on daily session recordings, not pageviews.`,
  };

  return applyProjectPricing(TOOL_PROJECT_CONFIGS.hotjar, input, base);
}
