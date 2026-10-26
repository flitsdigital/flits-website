import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leadFrom, validateLead, mailtoFor } from './lead.ts';

const form = (fields: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) (Array.isArray(v) ? v : [v]).forEach((x) => f.append(k, x));
  return f;
};

const modal = form({
  firstName: ' Thijs ',
  lastName: 'de Vries',
  email: 'thijs@example.nl',
  phone: '06 12345678',
  services: ['Website laten maken', 'Foto & video'],
  message: '  Nieuwe site voor de koets  ',
  source: 'modal',
});

test('a lead from the modal form, trimmed', () => {
  assert.deepEqual(leadFrom(modal), {
    name: 'Thijs de Vries',
    email: 'thijs@example.nl',
    phone: '06 12345678',
    services: ['Website laten maken', 'Foto & video'],
    message: 'Nieuwe site voor de koets',
    source: 'modal',
    trap: '',
  });
});

test('a complete lead is valid', () => {
  assert.deepEqual(validateLead(leadFrom(modal)), { ok: true, spam: false, errors: [] });
});

test('required fields and an e-mail that is not one', () => {
  const r = validateLead(leadFrom(form({ firstName: '', email: 'geen-mail', phone: '12', source: 'contact' })));
  assert.equal(r.ok, false);
  assert.deepEqual(r.errors.sort(), ['email', 'name', 'phone']);
});

test('line breaks in one-line fields are refused (they could end up in a mail header)', () => {
  const r = validateLead(leadFrom(form({ firstName: 'Jan\r\nBcc: spam@x.nl', email: 'a@b.nl', phone: '0612\n345678', source: 'contact', services: 'Web\nsite' })));
  assert.deepEqual(r.errors, ['name', 'phone', 'services']);
});

test('too long input is refused, not cut', () => {
  const r = validateLead(leadFrom(form({ firstName: 'x', email: 'a@b.nl', phone: '0612345678', message: 'y'.repeat(2001), source: 'contact' })));
  assert.deepEqual(r.errors, ['message']);
});

test('the hidden trap field marks spam (answered as if it worked, never forwarded)', () => {
  const r = validateLead(leadFrom(form({ firstName: 'Bot', email: 'b@b.nl', phone: '0612345678', source: 'contact', website: 'http://spam' })));
  assert.equal(r.spam, true);
});

test('unknown sources become "contact"', () => {
  assert.equal(leadFrom(form({ source: 'elders' })).source, 'contact');
});

test('mailto fallback carries everything', () => {
  const href = mailtoFor(leadFrom(modal), 'info@flitsdigital.nl');
  assert.ok(href.startsWith('mailto:info@flitsdigital.nl?subject='));
  const body = decodeURIComponent(href.split('body=')[1]);
  for (const part of ['Website laten maken, Foto & video', 'Nieuwe site voor de koets', 'Thijs de Vries', 'thijs@example.nl', '06 12345678']) assert.ok(body.includes(part), part);
});
