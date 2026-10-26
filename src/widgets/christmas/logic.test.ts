import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daysUntilChristmas, christmasStage, christmasLabel, christmasPhoto } from './logic.ts';

test('days until Christmas', () => {
  assert.equal(daysUntilChristmas(2026, 12, 4), 21);
  assert.equal(daysUntilChristmas(2026, 12, 24), 1);
  assert.equal(daysUntilChristmas(2026, 12, 25), 0);
  assert.equal(daysUntilChristmas(2026, 12, 26), 0);
  assert.equal(daysUntilChristmas(2026, 12, 27), 363);
  assert.equal(daysUntilChristmas(2026, 10, 25), 61); // across the DST change
});

test('stage grows every two days in December', () => {
  assert.deepEqual([[11, 30], [12, 1], [12, 2], [12, 3], [12, 12], [12, 23], [12, 31]].map(([m, d]) => christmasStage(m, d)), [0, 1, 1, 2, 6, 12, 12]);
});

test('label', () => {
  assert.deepEqual([0, 1, 2].map(christmasLabel), ['Vrolijk kerstfeest', 'Dag tot kerst', 'Dagen tot kerst']);
});

test('photo falls back to an earlier stage, then to daylight', () => {
  const some = new Set(['dag-00', 'dag-06', 'dag-12', 'nacht-12']);
  assert.equal(christmasPhoto(9, false, some), 'dag-06');
  assert.equal(christmasPhoto(12, true, some), 'nacht-12');
  assert.equal(christmasPhoto(7, true, some), 'dag-06');
  assert.equal(christmasPhoto(3, false, new Set()), undefined);
});
