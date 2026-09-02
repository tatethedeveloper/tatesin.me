// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://tatesin.me',
  integrations: [
    sitemap({
      // /og/ is the source for the Open Graph image, not a page for people.
      filter: (page) => !page.endsWith('/og/'),
    }),
  ],
  build: {
    // The whole stylesheet is ~5kB; one fewer round trip before first paint.
    inlineStylesheets: 'always',
  },
});
