/**
 * A project request from the "Start een project" modal or the contact form. Pure, so the browser
 * (before sending) and /api/contact (before forwarding to n8n) check it with the same rules.
 */
export type Lead = {
  name: string;
  email: string;
  phone: string;
  services: string[];
  message: string;
  source: 'modal' | 'contact';
  /** Hidden field ("website") that people never see; a filled one means a bot. */
  trap: string;
};

type Fields = { get(name: string): FormDataEntryValue | null; getAll(name: string): FormDataEntryValue[] };

const text = (v: FormDataEntryValue | null | undefined) => (typeof v === 'string' ? v.trim() : '');

export function leadFrom(data: Fields): Lead {
  return {
    name: [text(data.get('firstName')), text(data.get('lastName'))].filter(Boolean).join(' '),
    email: text(data.get('email')),
    phone: text(data.get('phone')),
    services: data.getAll('services').map(text).filter(Boolean),
    message: text(data.get('message')),
    source: text(data.get('source')) === 'modal' ? 'modal' : 'contact',
    trap: text(data.get('website')),
  };
}

// Too long is refused, not cut: a cut request reads wrong and nobody notices.
const MAX = { name: 120, email: 160, phone: 30, message: 2000, service: 60, services: 10 };

// One-line fields may end up in a mail subject or header, so a line break there is refused.
const multiline = (s: string) => /[\r\n]/.test(s);

export function validateLead(lead: Lead) {
  const errors: string[] = [];
  if (!lead.name || lead.name.length > MAX.name || multiline(lead.name)) errors.push('name');
  if (lead.email.length > MAX.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) errors.push('email');
  if (lead.phone.length > MAX.phone || multiline(lead.phone) || lead.phone.replace(/\D/g, '').length < 6) errors.push('phone');
  if (lead.message.length > MAX.message) errors.push('message');
  if (lead.services.length > MAX.services || lead.services.some((s) => s.length > MAX.service || multiline(s))) errors.push('services');
  return { ok: errors.length === 0, spam: lead.trap !== '', errors };
}

/** The mail-app fallback when sending fails. */
export function mailtoFor(lead: Lead, to: string) {
  const body = [
    lead.services.length ? `Ik ben op zoek naar: ${lead.services.join(', ')}` : '',
    '',
    lead.message,
    '',
    `Naam: ${lead.name}`,
    `E-mail: ${lead.email}`,
    `Telefoon: ${lead.phone}`,
  ].join('\n');
  return `mailto:${to}?subject=${encodeURIComponent(`Nieuw project via de website — ${lead.name}`)}&body=${encodeURIComponent(body.trim())}`;
}
