const REICON_LOGO_CDN = 'https://cdn.reicon.dev/logos';

/** Reicon CDN slugs for full-color `original.svg` brand marks. */
const BRAND_LOGO_SLUGS: Partial<Record<string, string>> = {
  'google-analytics-4': 'google-analytics',
  plausible: 'plausible-analytics',
  fathom: 'fathom',
  hotjar: 'hotjar',
  posthog: 'posthog',
  umami: 'umami',
  matomo: 'matomo',
  ahrefs: 'ahrefs',
};

/** Local static marks when Reicon has no logo (paths under `/public`). */
const LOCAL_BRAND_LOGOS: Partial<Record<string, string>> = {
  datafast: '/brands/datafast.png',
};

/** Tool IDs whose mark already includes its own square background (skip frame padding). */
const FULL_BLEED_BRAND_LOGOS = new Set<string>([]);

export function getBrandLogoUrl(toolId: string): string | null {
  const localPath = LOCAL_BRAND_LOGOS[toolId];
  if (localPath) return localPath;

  const slug = BRAND_LOGO_SLUGS[toolId];
  if (!slug) return null;
  return `${REICON_LOGO_CDN}/${slug}/original.svg`;
}

/** True when the mark already includes its own square background (skip frame padding). */
export function isFullBleedBrandLogo(toolId: string): boolean {
  return FULL_BLEED_BRAND_LOGOS.has(toolId);
}
