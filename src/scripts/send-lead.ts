import { leadFrom, mailtoFor } from '../lib/lead';

/**
 * Sends a "Start een project" form to /api/contact (n8n mails it to Flits). When that fails
 * (offline, server down) the visitor's mail app opens with the request filled in, so nothing is lost.
 * Resolves 'sent' or 'mail-app'.
 */
export async function sendLead(form: HTMLFormElement, to: string): Promise<'sent' | 'mail-app'> {
  const data = new FormData(form);
  try {
    const res = await fetch('/api/contact', { method: 'POST', body: data, headers: { accept: 'application/json' } });
    if (res.ok) return 'sent';
  } catch {
    // offline or blocked: fall through to the mail app
  }
  window.location.href = mailtoFor(leadFrom(data), to);
  return 'mail-app';
}
