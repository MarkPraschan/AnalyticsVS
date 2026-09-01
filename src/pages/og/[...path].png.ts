import type { APIRoute, GetStaticPaths } from 'astro';
import { getOgEntries } from '../../lib/og/entries';
import { createOgImage } from '../../lib/og/render';
import type { OgImageEntry } from '../../lib/og/types';

export const getStaticPaths = (async () => {
  const entries = await getOgEntries();

  return entries.map((entry) => ({
    params: { path: entry.path },
    props: { entry },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { entry } = props as { entry: OgImageEntry };
  return createOgImage(entry);
};
