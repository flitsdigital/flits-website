import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inSeason, candidates, pickSlot, slotWidget } from './slots.ts';

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
