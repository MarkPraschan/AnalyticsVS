import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { buildSitemapLastmodMap, pathnameToSitemapKey } from './src/lib/sitemapLastmod';

let sitemapLastmodPromise: Promise<Map<string, string>> | null = null;

function getSitemapLastmodMap() {
  if (!sitemapLastmodPromise) {
    sitemapLastmodPromise = buildSitemapLastmodMap();
  }

  return sitemapLastmodPromise;
}

// https://astro.build/config
export default defineConfig({
  site: 'https://www.analyticsvs.com',

  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [
    mdx(),
    sitemap({
      async serialize(item) {
        const lastmodMap = await getSitemapLastmodMap();
        const key = pathnameToSitemapKey(new URL(item.url).pathname);
        const lastmod = lastmodMap.get(key);

        if (!lastmod) {
          return item;
        }

        return {
          ...item,
          lastmod,
        };
      },
    }),
  ],
});
