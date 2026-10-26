/** Server-side settings: at build (Astro loads .env into import.meta.env) and at runtime on Vercel (process.env). */
export const env = (name: string): string | undefined => process.env[name] ?? (import.meta as { env?: Record<string, string> }).env?.[name];
