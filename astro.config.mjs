import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';
import { reviewPages } from './src/data/site.ts';

// Legal pages still marked `draft: true` are noindex, so they stay out of the sitemap too
const draftLegal = readdirSync('src/content/legal')
  .filter((f) => /^draft:\s*true/m.test(readFileSync(`src/content/legal/${f}`, 'utf8')))
  .map((f) => `/${f.replace(/\.md$/, '')}/`);

export default defineConfig({
  // Used for canonical and Open Graph URLs. shortcut: assumed from info@flitsdigital.nl; change if the live domain differs.
  site: 'https://flitsdigital.nl',
  // Pages stay prerendered; only routes with `export const prerender = false` (src/pages/api) run on Vercel.
  // Web Analytics is cookieless (no banner needed); turn it on in the Vercel project too.
  adapter: vercel({ maxDuration: 30, webAnalytics: { enabled: true } }),
  // All CSS in the HTML: five small stylesheets were render-blocking requests (~340ms on PageSpeed mobile)
  build: { inlineStylesheets: 'always' },
  // /sitemap-index.xml for Google; review pages and the 404 (noindex) stay out
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return path !== '/404/' && !reviewPages.some((p) => path.startsWith(`${p}/`)) && !draftLegal.includes(path);
      },
    }),
  ],
});
