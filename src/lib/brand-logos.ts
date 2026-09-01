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

export function getBrandLogoUrl(toolId: string): string | null {
  const slug = BRAND_LOGO_SLUGS[toolId];
  if (!slug) return null;
  return `${REICON_LOGO_CDN}/${slug}/original.svg`;
}
