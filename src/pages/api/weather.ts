import type { APIRoute } from 'astro';
import { MET_URL, currentFromMet } from '../../widgets/weather/logic';

// Runs on Vercel. One MET Norway call per ~15 min for every visitor together (CDN cache); their terms ask
// for an identifying User-Agent and for not hammering the API. Visitors' IPs never reach MET Norway.
export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const res = await fetch(MET_URL, { headers: { 'user-agent': 'flitsdigital.nl (info@flitsdigital.nl)' }, signal: AbortSignal.timeout(8000) });
    const now = res.ok ? currentFromMet(await res.json(), new Date()) : null;
    if (!now) throw new Error(`met ${res.status}`);
    return Response.json(now, { headers: { 'cache-control': 'public, s-maxage=900, stale-while-revalidate=3600' } });
  } catch {
    return Response.json({ error: 'weather unavailable' }, { status: 502, headers: { 'cache-control': 'public, s-maxage=60' } });
  }
};
