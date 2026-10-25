import type { APIRoute } from 'astro';
import { env, measure } from '../../lib/pagespeed';

// Runs on Vercel, not at build. The CDN keeps the answer a day, so PSI is asked about once a day.
export const prerender = false;

export const GET: APIRoute = async () => {
  const site = env('SITE_URL');
  const key = env('PSI_API_KEY');
  const result = site && key ? await measure(site, key) : { mobile: null, desktop: null, measuredAt: new Date().toISOString(), stale: true };
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      // A stale answer is cached briefly, so a PSI hiccup doesn't stick for a day.
      'Cache-Control': result.stale ? 'public, s-maxage=600' : 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
};
