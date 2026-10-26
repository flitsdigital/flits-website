import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { studioTime, studioNow, shortDate, clockAngles, secondsSince, everyTick } from './time.ts';

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

test('everyTick ticks now, then on whole seconds, and stops', () => {
  mock.timers.enable({ apis: ['setTimeout', 'Date'], now: 997 }); // loaded 3ms before a whole second
  let calls = 0;
  const stop = everyTick(() => calls++, 1000);
  assert.equal(calls, 1);
  mock.timers.tick(3); // 1000: the next whole second, not 1997
  assert.equal(calls, 2);
  mock.timers.tick(999);
  assert.equal(calls, 2);
  mock.timers.tick(1); // 2000
  assert.equal(calls, 3);
  stop();
  mock.timers.tick(5000);
  assert.equal(calls, 3);
  mock.timers.reset();
});

test('studioNow: the date in Emmen, not in UTC or on the build machine', () => {
  // 23:30 UTC on 31 Dec = already New Year's Day in Amsterdam
  const t = studioNow(new Date('2026-12-31T23:30:00Z'));
  assert.deepEqual([t.year, t.month, t.day, t.h, t.dateLabel], [2027, 1, 1, 0, '1 jan']);
  assert.equal(studioNow(new Date('2026-10-26T11:00:00Z')).dateLabel, '26 okt');
});

test('shortDate: "3 okt", no trailing dot', () => {
  assert.equal(shortDate(new Date('2026-10-03T12:00:00Z')), '3 okt');
  assert.equal(shortDate(new Date('2026-09-10T12:00:00Z')), '10 sep');
});
