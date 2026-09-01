import type { PricingInput, PricingResult } from './types';
import { applyProjectPricing, TOOL_PROJECT_CONFIGS } from './projects';

const FREE_EVENTS = 1_000_000;

export function calculatePostHogPricing(input: PricingInput): PricingResult {
  const totalEvents = input.pageviews + input.events;

  const base: PricingResult =
    totalEvents <= FREE_EVENTS
      ? {
          monthlyCost: 0,
          label: 'Free tier (up to 1M events)',
          note: 'Includes pageviews + custom events. Verify current rates on posthog.com.',
        }
      : {
          monthlyCost: null,
          label: `${totalEvents.toLocaleString()} events/month`,
          note: 'Above 1M events, PostHog uses usage-based pricing. Check posthog.com/pricing for current rates.',
        };

  return applyProjectPricing(TOOL_PROJECT_CONFIGS.posthog, input, base);
}
