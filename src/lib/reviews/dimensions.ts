export const REVIEW_DIMENSIONS = [
  'privacy-compliance',
  'analytics-scope',
  'product-capabilities',
  'revenue-attribution',
  'integrations',
  'deployment',
  'ux-reliability',
  'other',
] as const;

export type ReviewDimension = (typeof REVIEW_DIMENSIONS)[number];

export const DIMENSION_LABELS: Record<ReviewDimension, string> = {
  'privacy-compliance': 'Privacy & compliance',
  'analytics-scope': 'Web analytics scope',
  'product-capabilities': 'Product & behavior capabilities',
  'revenue-attribution': 'Revenue attribution',
  integrations: 'Integrations & ecosystem',
  deployment: 'Cloud vs self-hosted',
  'ux-reliability': 'UX & reliability',
  other: 'Other considerations',
};

export const DIMENSION_ORDER: ReviewDimension[] = [...REVIEW_DIMENSIONS];

export function getDimensionLabel(dimension: ReviewDimension): string {
  return DIMENSION_LABELS[dimension];
}
