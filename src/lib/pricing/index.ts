import { calculateGA4Pricing } from './ga4';
import { calculatePlausiblePricing } from './plausible';
import { calculateFathomPricing } from './fathom';
import { calculateHotjarPricing } from './hotjar';
import { calculatePostHogPricing } from './posthog';
import { calculateUmamiPricing } from './umami';
import { calculateDataFastPricing } from './datafast';
import { calculateMatomoPricing } from './matomo';
import { calculateAhrefsPricing } from './ahrefs';
import type { PricingCalculator } from './types';

export const PRICING_CALCULATORS: Record<string, PricingCalculator> = {
  'google-analytics-4': calculateGA4Pricing,
  plausible: calculatePlausiblePricing,
  fathom: calculateFathomPricing,
  hotjar: calculateHotjarPricing,
  posthog: calculatePostHogPricing,
  umami: calculateUmamiPricing,
  datafast: calculateDataFastPricing,
  matomo: calculateMatomoPricing,
  ahrefs: calculateAhrefsPricing,
};

export * from './types';
export * from './projects';
