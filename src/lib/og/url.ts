import { SITE } from '../site';

export function pathnameToOgPath(pathname: string): string {
  const trimmed = pathname.replace(/^\/+|\/+$/g, '');
  return trimmed.length === 0 ? 'index' : trimmed;
}

export function getOgImageUrl(pathname: string): string {
  const ogPath = pathnameToOgPath(pathname);
  return new URL(`/og/${ogPath}.png`, SITE.url).href;
}
