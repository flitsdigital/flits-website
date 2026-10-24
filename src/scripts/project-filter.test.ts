import { test } from 'node:test';
import assert from 'node:assert/strict';
import { archiveView, type ArchiveItem } from './project-filter.ts';

const items: ArchiveItem[] = [
  { types: ['Websites', 'Foto'], sector: 'Retail', date: 3 },
  { types: ['Video'], sector: 'Horeca', date: 1 },
  { types: ['Websites'], sector: 'Horeca', date: 2 },
];
const sel = (types: string[] = [], sectors: string[] = [], order: 'new' | 'old' = 'new') => ({
  types: new Set(types),
  sectors: new Set(sectors),
  order,
});

test('no filters: everything, newest first, "Alles" pressed', () => {
  const v = archiveView(items, sel());
  assert.deepEqual(v.order, [0, 2, 1]);
  assert.deepEqual(v.visible, [true, true, true]);
  assert.equal(v.all, true);
});

test('types are OR-ed, groups are AND-ed', () => {
  assert.deepEqual(archiveView(items, sel(['Video', 'Foto'])).visible, [true, true, false]);
  assert.deepEqual(archiveView(items, sel(['Websites'], ['Horeca'])).visible, [false, false, true]);
});

test('a sector alone un-presses "Alles"', () => {
  assert.equal(archiveView(items, sel([], ['Horeca'])).all, false);
});

test('every second visible card is offset, in display order', () => {
  // Horeca only: items 2 (date 2) then 1 (date 1) → item 1 is the second visible card
  assert.deepEqual(archiveView(items, sel([], ['Horeca'])).offset, [false, true, false]);
  // oldest first: 1, 2, 0 → item 2 is second
  assert.deepEqual(archiveView(items, sel([], [], 'old')).offset, [false, false, true]);
});

test('nothing matches: empty state', () => {
  assert.equal(archiveView(items, sel(['Advertenties'])).empty, true);
});
