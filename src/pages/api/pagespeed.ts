import type { APIRoute } from 'astro';
import { env, measure } from '../../lib/pagespeed';

// Runs in the Worker, not at build. Workers skip the CDN cache, so the answer is kept in the Worker cache, which honours s-maxage.
export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const cache = (caches as unknown as { default: Cache }).default;
  const hit = await cache.match(request);
  if (hit) return hit;
  const site = env('SITE_URL');
  const key = env('PSI_API_KEY');
  // A real Lighthouse run takes 10–30 s; Workers wait on fetch without a wall-clock limit.
  const result = site && key ? await measure(site, key, { timeoutMs: 25000 }) : { mobile: null, desktop: null, measuredAt: new Date().toISOString(), stale: true };
  const response = new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json',
      // A stale answer is cached briefly, so a PSI hiccup doesn't stick for a day.
      'Cache-Control': result.stale ? 'public, s-maxage=600, stale-while-revalidate=86400' : 'public, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
  await cache.put(request, response.clone());
  return response;
};
