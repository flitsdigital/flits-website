import { test } from 'node:test';
import assert from 'node:assert/strict';
import { featured, isNew, yearOf } from './projects.ts';

const p = (id: string, date: string, types: string[] = []) => ({ id, data: { date: new Date(date), types } });
const all = [p('a', '2026-01-01', ['Website']), p('b', '2026-05-01', ['Video']), p('c', '2026-03-01', ['Website']), p('d', '2026-04-01'), p('e', '2026-02-01')];

test('newest four by default', () => {
  assert.deepEqual(featured(all).map((x) => x.id), ['b', 'd', 'c', 'e']);
});

test('the type first, newest first within, then the newest others', () => {
  assert.deepEqual(featured(all, { type: 'Website' }).map((x) => x.id), ['c', 'a', 'b', 'd']);
});

test('the current case is left out of its own related projects', () => {
  assert.deepEqual(featured(all, { exclude: 'b' }).map((x) => x.id), ['d', 'c', 'e', 'a']);
});

test('new means the last 60 days', () => {
  const today = new Date('2026-11-10');
  assert.equal(isNew(new Date('2026-10-28'), today), true);
  assert.equal(isNew(new Date('2026-03-01'), today), false);
});

test('the year is read in UTC', () => {
  assert.equal(yearOf(new Date('2026-01-01')), '2026');
});
