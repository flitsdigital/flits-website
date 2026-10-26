import type { APIRoute } from 'astro';
import { processContact, postJson } from '../../lib/contact-route';
import { env } from '../../lib/env';

// Runs on Vercel. The modal and the contact form post here; n8n mails it through Flits' own mail server.
export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return new Response(null, { status: 400 });
  }
  const result = await processContact(data, { webhook: env('N8N_FORM_WEBHOOK_URL'), secret: env('N8N_FORM_SECRET'), post: postJson });

  // The scripts ask for JSON; a plain form post (no JavaScript) goes back to /contact with the outcome.
  if (request.headers.get('accept')?.includes('application/json')) {
    return new Response(JSON.stringify({ ok: result.status === 200, errors: result.errors ?? [] }), {
      status: result.status,
      headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
    });
  }
  const outcome = result.status === 200 ? 'verzonden' : 'fout';
  return new Response(null, { status: 303, headers: { location: `/contact#${outcome}` } });
};
