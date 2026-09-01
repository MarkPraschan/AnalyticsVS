import type { PricingInput, PricingResult } from './types';
import { applyProjectPricing, projectCount, TOOL_PROJECT_CONFIGS } from './projects';

export function calculateUmamiPricing(input: PricingInput): PricingResult {
  const events = input.pageviews + input.events;
  const projects = projectCount(input);

  let base: PricingResult;

  if (events <= 100_000 && projects <= 1) {
    base = {
      monthlyCost: 0,
      label: 'Hobby (up to 100K events · 1 site)',
      note: 'Self-hosted is also free',
    };
  } else if (events <= 1_000_000 && projects <= 10) {
    base = {
      monthlyCost: 20,
      label: 'Pro (up to 1M events)',
      note: projects > 1 ? 'Pro supports multiple websites' : '',
    };
  } else if (events <= 10_000_000 && projects <= 100) {
    base = { monthlyCost: 200, label: 'Business (up to 10M events)', note: '' };
  } else {
    base = { monthlyCost: null, label: 'Enterprise', note: '' };
  }

  if (projects > 1 && events <= 100_000) {
    base = {
      monthlyCost: 20,
      label: 'Pro required for multiple sites',
      note: 'Hobby is limited to one website on Umami Cloud',
    };
  }

  return applyProjectPricing(TOOL_PROJECT_CONFIGS.umami, input, base);
}
