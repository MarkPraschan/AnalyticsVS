import type { PricingInput, PricingResult } from './types';

export function calculateGA360Pricing(_input: PricingInput): PricingResult {
  return {
    monthlyCost: null,
    label: 'Custom annual contract',
    note: 'Google Analytics 360 is quote-only through Google or a Sales Partner. Free GA4 covers most sites.',
  };
}
