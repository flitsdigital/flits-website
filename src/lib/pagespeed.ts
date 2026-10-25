/** Google PageSpeed Insights (v5) performance scores for the deployed site. */
export type PageSpeed = { mobile: number | null; desktop: number | null; measuredAt: string; stale: boolean };

const API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/** Performance score 0–100 from a PSI response, or null when it has none. */
export function parsePsi(json: unknown): number | null {
  const score = (json as { lighthouseResult?: { categories?: { performance?: { score?: unknown } } } } | null)?.lighthouseResult?.categories?.performance?.score;
  return typeof score === 'number' ? Math.round(score * 100) : null;
}

/** Lighthouse's colour bands: 0–49 red, 50–89 orange, 90–100 green. */
export const band = (score: number) => (score < 50 ? 'bad' : score < 90 ? 'mid' : 'good');

/** Mobile and desktop score in parallel. Never throws: any failure or timeout gives `stale: true` with null scores. */
export async function measure(siteUrl: string, key: string, { fetch: get = fetch, timeoutMs = 10000 }: { fetch?: typeof fetch; timeoutMs?: number } = {}): Promise<PageSpeed> {
  const one = async (strategy: 'mobile' | 'desktop') => {
    const url = `${API}?url=${encodeURIComponent(siteUrl)}&strategy=${strategy}&category=performance&key=${encodeURIComponent(key)}`;
    const res = await get(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`PSI ${res.status}`);
    return parsePsi(await res.json());
  };
  try {
    const [mobile, desktop] = await Promise.all([one('mobile'), one('desktop')]);
    return { mobile, desktop, measuredAt: new Date().toISOString(), stale: mobile === null && desktop === null };
  } catch {
    return { mobile: null, desktop: null, measuredAt: new Date().toISOString(), stale: true };
  }
}

/** Env at build (Astro loads .env into import.meta.env) and at runtime on Vercel (process.env). */
export const env = (name: string): string | undefined => process.env[name] ?? (import.meta as { env?: Record<string, string> }).env?.[name];

/** One measurement per build, however many pages render the widget. Without key or URL: stale. */
let atBuild: Promise<PageSpeed> | undefined;
export function measureAtBuild(): Promise<PageSpeed> {
  const site = env('SITE_URL');
  const key = env('PSI_API_KEY');
  return (atBuild ??= site && key ? measure(site, key, { timeoutMs: 60000 }) : Promise.resolve({ mobile: null, desktop: null, measuredAt: new Date().toISOString(), stale: true }));
}
