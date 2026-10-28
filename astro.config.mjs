import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  // Used for canonical and Open Graph URLs. shortcut: assumed from info@flitsdigital.nl; change if the live domain differs.
  site: 'https://flitsdigital.nl',
  // Pages stay prerendered; only routes with `export const prerender = false` (src/pages/api) run on Vercel.
  adapter: vercel({ maxDuration: 30 }),
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
