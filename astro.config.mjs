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
  // URLs of the old Webflow site (its sitemap.xml, 28 okt 2026), so rankings and shared links land somewhere.
  redirects: {
    '/cases': '/projecten',
    '/case/premiumcars-nl': '/projecten',
    '/case/groenmaat': '/projecten',
    '/case/car-rally-noord': '/projecten',
    '/case/de-huyskamer-klazienaveen': '/projecten',
    '/case/total-car-perfection-emmen': '/projecten',
    '/case/drentse-vloerverwarming-specialist': '/projecten',
    '/case/jhl-automotive': '/projecten',
    '/case/uw-glazenwassers-emmen': '/projecten',
    '/diensten/social-media-content': '/diensten/social-media',
    '/diensten/foto-video': '/diensten/foto-en-video',
    '/diensten/branding': '/diensten/grafische-vormgeving',
    '/website-laten-maken/emmen': '/diensten/website-laten-maken',
    '/website-laten-maken/hardenberg': '/diensten/website-laten-maken',
    '/website-laten-maken/coevorden': '/diensten/website-laten-maken',
    '/webshop-laten-maken': '/diensten/website-laten-maken',
    '/legal/algemene-voorwaarden': '/algemene-voorwaarden',
    '/legal/privacybeleid': '/privacybeleid',
  },
});
