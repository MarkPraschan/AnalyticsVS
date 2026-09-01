import type { PricingInput, PricingResult } from './types';
import { applyProjectPricing, projectCount, TOOL_PROJECT_CONFIGS } from './projects';

export function calculateGA4Pricing(input: PricingInput): PricingResult {
  const freeLimit = 10_000_000;
  const projects = projectCount(input);

  const base: PricingResult =
    input.pageviews <= freeLimit
      ? {
          monthlyCost: 0,
          label: 'Free (standard GA4)',
          note: 'GA4 360 enterprise pricing starts around $50,000/year.',
        }
      : {
          monthlyCost: null,
          label: 'GA4 360 required',
          note: 'Contact Google for enterprise pricing above 10M hits/month.',
        };

  if (projects > 1 && base.monthlyCost === 0) {
    base.label = `${base.label} · ${projects} properties`;
  }

  return applyProjectPricing(TOOL_PROJECT_CONFIGS['google-analytics-4'], input, base);
}
