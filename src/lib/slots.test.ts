import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inSeason, candidates, pickSlot, slotWidget, pagePath, initialWidget, byFileOrder } from './slots.ts';

test('season window, inclusive, also across the new year', () => {
  const xmas = { from: [12, 1], to: [12, 26] } as const;
  assert.equal(inSeason(xmas, 11, 30), false);
  assert.equal(inSeason(xmas, 12, 1), true);
  assert.equal(inSeason(xmas, 12, 26), true);
  assert.equal(inSeason(xmas, 12, 27), false);
  assert.equal(inSeason({ from: [12, 15], to: [1, 6] }, 1, 3), true);
  assert.equal(inSeason({ from: [12, 15], to: [1, 6] }, 2, 1), false);
  assert.equal(inSeason(undefined, 6, 1), true); // no season = always
});

test('a fixed widget wins', () => {
  assert.equal(pickSlot({ fixed: 'spotify', candidates: ['weather'], fallback: 'weather', random: () => 0 }), 'spotify');
});

test('an empty pool falls back', () => {
  assert.equal(pickSlot({ candidates: [], fallback: 'weather', random: () => 0.5 }), 'weather');
});

test('random picks across the pool', () => {
  assert.equal(pickSlot({ candidates: ['weather', 'spotify', 'pagespeed'], fallback: 'weather', random: () => 0.99 }), 'pagespeed');
  assert.equal(pickSlot({ candidates: ['weather', 'spotify', 'pagespeed'], fallback: 'weather', random: () => 0 }), 'weather');
});

test('unavailable widgets leave the pool', () => {
  assert.deepEqual(candidates(['christmas', 'stories'], (id) => id !== 'stories'), ['christmas']);
});

test('a slot with nothing in season shows nothing', () => {
  assert.equal(slotWidget({ candidates: [], fallback: 'christmas', fallbackAvailable: false, random: () => 0 }), null);
  assert.equal(slotWidget({ candidates: [], fallback: 'weather', fallbackAvailable: true, random: () => 0 }), 'weather');
  assert.equal(slotWidget({ candidates: ['reviews'], fallback: 'christmas', fallbackAvailable: false, random: () => 0 }), 'reviews');
  assert.equal(slotWidget({ fixed: 'office', candidates: [], fallback: 'christmas', fallbackAvailable: false, random: () => 0 }), 'office');
});

test('fixed choices match with or without a trailing slash', () => {
  assert.equal(pagePath('/contact/'), '/contact');
  assert.equal(pagePath('/contact'), '/contact');
  assert.equal(pagePath('/'), '/');
});

test('the visible default is the first widget without a season', () => {
  const seasons = { christmas: { from: [12, 1], to: [12, 26] } } as const;
  assert.equal(initialWidget(['christmas', 'reviews', 'office'], seasons), 'reviews');
  assert.equal(initialWidget(['weather', 'spotify'], seasons), 'weather');
  assert.equal(initialWidget(['christmas'], seasons), null);
});

test('collection entries in the order of their file', () => {
  const entries = [{ id: 'cupra' }, { id: 'fpv' }, { id: 'koffiekoets' }, { id: 'koffiekoets-2' }];
  assert.deepEqual(byFileOrder(entries, ['koffiekoets', 'koffiekoets-2', 'cupra', 'fpv']).map((e) => e.id), ['koffiekoets', 'koffiekoets-2', 'cupra', 'fpv']);
});
