import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // Used for canonical and Open Graph URLs. shortcut: assumed from info@flitsdigital.nl; change if the live domain differs.
  site: 'https://flitsdigital.nl',
  // Pages stay prerendered; only routes with `export const prerender = false` (src/pages/api) run on Vercel.
  adapter: vercel(),
});
