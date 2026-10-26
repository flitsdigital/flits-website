import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';
import { readdirSync, readFileSync } from 'node:fs';

// Legal pages still marked `draft: true` are noindex, so they stay out of the sitemap too
const draftLegal = readdirSync('src/content/legal')
  .filter((f) => /^draft:\s*true/m.test(readFileSync(`src/content/legal/${f}`, 'utf8')))
  .map((f) => `/${f.replace(/\.md$/, '')}/`);

export default defineConfig({
  // Used for canonical and Open Graph URLs. shortcut: assumed from info@flitsdigital.nl; change if the live domain differs.
  site: 'https://flitsdigital.nl',
  // Pages stay prerendered; only routes with `export const prerender = false` (src/pages/api) run on Vercel.
  adapter: vercel({ maxDuration: 30 }),
  // /sitemap-index.xml for Google; review pages (noindex) stay out
  integrations: [
    sitemap({
      filter: (page) => {
        const path = new URL(page).pathname;
        return !/^\/(styleguide|components|sections|widgets)(\/|$)/.test(path) && !draftLegal.includes(path);
      },
    }),
  ],
  // Spotify cover art is downloaded at build and served from our own domain (SpotifyWidget.astro)
  image: { remotePatterns: [{ protocol: 'https', hostname: '**.spotifycdn.com' }, { protocol: 'https', hostname: 'i.scdn.co' }] },
});
