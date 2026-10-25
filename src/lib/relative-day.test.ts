import { test } from 'node:test';
import assert from 'node:assert/strict';
import { relativeDay, isToday, photoLabel } from './relative-day.ts';

const today = new Date('2026-10-25T12:00:00+01:00');

test('recent photos say how long ago', () => {
  assert.equal(relativeDay(new Date('2026-10-25T08:00:00+01:00'), today), 'vandaag');
  assert.equal(relativeDay(new Date('2026-10-24'), today), 'gisteren');
  assert.equal(relativeDay(new Date('2026-10-22'), today), '3 dagen geleden');
  assert.equal(relativeDay(new Date('2026-10-12'), today), '13 dagen geleden');
});

test('older photos get their date', () => {
  assert.equal(relativeDay(new Date('2026-10-03'), today), 'op 3 okt');
});

test('a date in the future is never "over 2 dagen"', () => {
  assert.equal(relativeDay(new Date('2026-10-27'), today), 'vandaag');
});

test('days follow Amsterdam, not UTC', () => {
  // 23:30 in Amsterdam on the 24th is already the 24th there, though UTC says 22:30
  assert.equal(relativeDay(new Date('2026-10-24T23:30:00+02:00'), new Date('2026-10-25T00:15:00+02:00')), 'gisteren');
  assert.equal(isToday(new Date('2026-10-25T00:05:00+02:00'), new Date('2026-10-25T23:50:00+01:00')), true);
});

test('photo label reads as Dutch for old photos too', () => {
  assert.equal(photoLabel(new Date('2026-10-25T08:00:00+01:00'), today), 'foto van vandaag');
  assert.equal(photoLabel(new Date('2026-10-22'), today), 'foto van 3 dagen geleden');
  assert.equal(photoLabel(new Date('2026-10-03'), today), 'foto van 3 okt');
});
