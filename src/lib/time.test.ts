import { test } from 'node:test';
import assert from 'node:assert/strict';
import { studioTime, clockAngles, secondsSince } from './time.ts';

test('formats in Europe/Amsterdam with DST zone names', () => {
  // 2026-07-01 10:05:30 UTC = 12:05:30 CEST
  assert.deepEqual(studioTime(new Date('2026-07-01T10:05:30Z')), { hh: '12', mm: '05', h: 12, m: 5, s: 30, zone: 'CEST' });
  // 2026-12-01 10:05:30 UTC = 11:05:30 CET
  assert.equal(studioTime(new Date('2026-12-01T10:05:30Z')).zone, 'CET');
});

test('clock hand angles', () => {
  assert.deepEqual(clockAngles({ h: 15, m: 30, s: 15 }), { hour: 105, minute: 181.5, second: 90 });
});

test('secondsSince counts across the minute and after a long pause', () => {
  assert.equal(secondsSince(59, 0), 1);
  assert.equal(secondsSince(10, 40), 30); // tab hidden for 30 s
  assert.equal(secondsSince(20, 20), 0);
});
