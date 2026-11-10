import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  // Used for canonical and Open Graph URLs. shortcut: assumed from info@flitsdigital.nl; change if the live domain differs.
  site: 'https://flitsdigital.nl',
  // Pages stay prerendered; only routes with `export const prerender = false` (src/pages/api) run in the Worker.
  // Images are optimised at build with sharp, like on Vercel, so the speed test compares hosting only.
  adapter: cloudflare({ imageService: 'compile' }),
  // No sessions on this site; skips the KV namespace the adapter would otherwise create.
  session: false,
});
