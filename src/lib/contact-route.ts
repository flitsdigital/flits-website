import { leadFrom, validateLead } from './lead.ts';

/** POST to n8n; resolves true on a 2xx. Injected so tests don't need a network. */
type Post = (url: string, headers: Record<string, string>, body: unknown) => Promise<boolean>;

export const postJson: Post = async (url, headers, body) => {
  const res = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body), signal: AbortSignal.timeout(10000) });
  return res.ok;
};

/**
 * What /api/contact does with a submitted form: check it, then hand it to the n8n webhook
 * (which mails it through Flits' own mail server). Spam gets a fake success so bots learn nothing.
 */
export async function processContact(data: FormData, { webhook, secret, post }: { webhook?: string; secret?: string; post: Post }) {
  const lead = leadFrom(data);
  const check = validateLead(lead);
  if (check.spam) return { status: 200 };
  if (!check.ok) return { status: 400, errors: check.errors };
  if (!webhook) return { status: 503 };
  const { trap: _trap, ...payload } = lead;
  try {
    const ok = await post(webhook, secret ? { 'x-flits-secret': secret } : {}, { ...payload, receivedAt: new Date().toISOString() });
    return { status: ok ? 200 : 502 };
  } catch {
    return { status: 502 };
  }
}
