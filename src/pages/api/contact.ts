import type { APIRoute } from 'astro';
import { processContact, postJson } from '../../lib/contact-route';
import { env } from '../../lib/env';

// Runs on Vercel. The "Start een project" form posts here; n8n mails the request to Flits.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return new Response(null, { status: 400 });
  }
  const result = await processContact(data, { webhook: env('N8N_FORM_WEBHOOK_URL'), secret: env('N8N_FORM_SECRET'), post: postJson });
  return new Response(JSON.stringify({ ok: result.status === 200, errors: result.errors ?? [] }), {
    status: result.status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
};
