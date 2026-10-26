import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processContact } from './contact-route.ts';

const good = () => {
  const f = new FormData();
  f.append('firstName', 'Thijs');
  f.append('email', 'thijs@example.nl');
  f.append('phone', '0612345678');
  f.append('source', 'contact');
  return f;
};
const config = { webhook: 'https://n8n.example/webhook/lead', secret: 's3cret' };

test('a valid lead is forwarded to n8n with the secret', async () => {
  const sent: { url: string; headers: Record<string, string>; body: unknown }[] = [];
  const r = await processContact(good(), { ...config, post: async (url, headers, body) => (sent.push({ url, headers, body }), true) });
  assert.equal(r.status, 200);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].url, config.webhook);
  assert.equal(sent[0].headers['x-flits-secret'], 's3cret');
  assert.equal((sent[0].body as { email: string }).email, 'thijs@example.nl');
  assert.equal('trap' in (sent[0].body as object), false);
});

test('invalid input: 400 with the fields, nothing sent', async () => {
  const f = good();
  f.set('email', 'nope');
  let sent = 0;
  const r = await processContact(f, { ...config, post: async () => (sent++, true) });
  assert.deepEqual([r.status, r.errors, sent], [400, ['email'], 0]);
});

test('spam looks like success but is never forwarded', async () => {
  const f = good();
  f.set('website', 'http://spam');
  let sent = 0;
  const r = await processContact(f, { ...config, post: async () => (sent++, true) });
  assert.deepEqual([r.status, sent], [200, 0]);
});

test('no webhook configured: 503', async () => {
  const r = await processContact(good(), { post: async () => true });
  assert.equal(r.status, 503);
});

test('n8n down or refusing: 502', async () => {
  assert.equal((await processContact(good(), { ...config, post: async () => false })).status, 502);
  assert.equal((await processContact(good(), { ...config, post: async () => Promise.reject(new Error('down')) })).status, 502);
});
