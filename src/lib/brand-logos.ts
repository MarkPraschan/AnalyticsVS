/** Local brand marks under `/public/brands` — prefer static assets over CDN. */
const LOCAL_BRAND_LOGOS: Partial<Record<string, string>> = {
  'google-analytics-4': '/brands/google-analytics.svg',
  'google-analytics-360': '/brands/google-analytics.svg',
  plausible: '/brands/plausible.svg',
  fathom: '/brands/fathom.svg',
  hotjar: '/brands/hotjar.svg',
  posthog: '/brands/posthog.svg',
  umami: '/brands/umami.svg',
  matomo: '/brands/matomo.svg',
  ahrefs: '/brands/ahrefs.png',
  datafast: '/brands/datafast.png',
};

/** Tool IDs whose mark already includes its own square background (skip frame padding). */
const FULL_BLEED_BRAND_LOGOS = new Set<string>([]);

export function getBrandLogoUrl(toolId: string): string | null {
  return LOCAL_BRAND_LOGOS[toolId] ?? null;
}

/** True when the mark already includes its own square background (skip frame padding). */
export function isFullBleedBrandLogo(toolId: string): boolean {
  return FULL_BLEED_BRAND_LOGOS.has(toolId);
}
