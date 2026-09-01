import type { PricingInput, PricingResult } from './types';
import { lookupEventTier } from './types';
import { applyProjectPricing, TOOL_PROJECT_CONFIGS } from './projects';

const EVENT_TIERS = [
  { limit: 1_000_000, price: 0, label: 'Free (up to 1M events)' },
  { limit: 5_000_000, price: 99 },
  { limit: 20_000_000, price: 299 },
  { limit: 100_000_000, price: 999 },
];

export function calculateAhrefsPricing(input: PricingInput): PricingResult {
  const volume = input.pageviews + input.events;
  const base = lookupEventTier(volume, EVENT_TIERS);

  if (base.monthlyCost === 0) {
    base.label = `Web Analytics · ${base.label}`;
  } else {
    base.label = `Web Analytics add-on · ${base.label}`;
  }

  base.note =
    'Per verified project. Included with Ahrefs Free up to 1M events; add-ons billed per project.';

  return applyProjectPricing(TOOL_PROJECT_CONFIGS.ahrefs, input, base);
}
