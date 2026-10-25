import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parsePsi, measure, band } from './pagespeed.ts';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/psi.json', import.meta.url), 'utf8'));

test('performance score from a PSI v5 response', () => {
  assert.equal(parsePsi(fixture), 98);
  assert.equal(parsePsi({ lighthouseResult: { categories: { performance: { score: 0.734 } } } }), 73);
});

test('no score in the response', () => {
  assert.equal(parsePsi({}), null);
  assert.equal(parsePsi(null), null);
});

test('PSI down: stale, never throws', async () => {
  const r = await measure('https://x', 'k', { fetch: () => Promise.reject(new Error('down')) });
  assert.deepEqual([r.mobile, r.desktop, r.stale], [null, null, true]);
});

test('PSI hanging: gives up after the timeout', async () => {
  const r = await measure('https://x', 'k', { fetch: (_u, init) => new Promise((_, reject) => init?.signal?.addEventListener('abort', () => reject(new Error('abort')))), timeoutMs: 50 });
  assert.deepEqual([r.mobile, r.desktop, r.stale], [null, null, true]);
});

test('both strategies measured', async () => {
  const seen: string[] = [];
  const fake = (u: string | URL | Request) => {
    seen.push(new URL(String(u)).searchParams.get('strategy')!);
    return Promise.resolve(new Response(JSON.stringify(fixture)));
  };
  const r = await measure('https://flitsdigital.nl', 'k', { fetch: fake as typeof fetch });
  assert.deepEqual([r.mobile, r.desktop, r.stale], [98, 98, false]);
  assert.deepEqual(seen.sort(), ['desktop', 'mobile']);
});

test('Lighthouse colour bands', () => {
  assert.deepEqual([0, 49, 50, 89, 90, 100].map(band), ['bad', 'bad', 'mid', 'mid', 'good', 'good']);
});
