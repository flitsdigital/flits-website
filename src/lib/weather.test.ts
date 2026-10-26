import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skyFor, seasonFor, weatherScene, allScenes, isDaylight, currentFromMet } from './weather.ts';

test('MET Norway symbol codes map to the photo skies', () => {
  const codes = ['clearsky_day', 'fair_night', 'partlycloudy_day', 'cloudy', 'fog', 'lightrain', 'rainshowers_day', 'heavyrain', 'sleet', 'lightsnow', 'snowshowers_night', 'rainandthunder', 'heavysnowandthunder'];
  assert.deepEqual(codes.map((c) => skyFor(c)), [
    'helder', 'helder', 'halfbewolkt', 'bewolkt', 'mist', 'regen', 'regen', 'regen', 'regen', 'sneeuw', 'sneeuw', 'onweer', 'onweer',
  ]);
});

test('frost only replaces dry skies', () => {
  assert.equal(skyFor('clearsky_day', -3), 'vorst');
  assert.equal(skyFor('cloudy', 0), 'vorst');
  assert.equal(skyFor('snow', -3), 'sneeuw');
  assert.equal(skyFor('fog', -1), 'mist');
});

test('daylight in Emmen from the sun', () => {
  assert.equal(isDaylight(new Date('2026-10-26T11:00:00Z')), true);
  assert.equal(isDaylight(new Date('2026-10-26T23:00:00Z')), false);
  assert.equal(isDaylight(new Date('2026-06-21T19:00:00Z')), true); // 21:00 in summer
  assert.equal(isDaylight(new Date('2026-12-21T16:00:00Z')), false); // 17:00 in winter
});

test('current weather from a MET Norway response', () => {
  const met = {
    properties: {
      meta: { updated_at: '2026-10-26T12:30:59Z' },
      timeseries: [{ time: '2026-10-26T12:00:00Z', data: { instant: { details: { air_temperature: 11.5 } }, next_1_hours: { summary: { symbol_code: 'partlycloudy_day' } } } }],
    },
  };
  assert.deepEqual(currentFromMet(met, new Date('2026-10-26T12:40:00Z')), { temperature: 11.5, symbol: 'partlycloudy_day', isDay: true });
  // no day/night suffix: the sun decides
  met.properties.timeseries[0].data.next_1_hours.summary.symbol_code = 'cloudy';
  assert.equal(currentFromMet(met, new Date('2026-10-26T22:00:00Z'))!.isDay, false);
  assert.equal(currentFromMet({}, new Date()), null);
});

test('seasons follow the trees, not the calendar', () => {
  assert.deepEqual([1, 3, 4, 5, 6, 9, 10, 11, 12].map(seasonFor), ['winter', 'winter', 'lente', 'lente', 'zomer', 'zomer', 'herfst', 'herfst', 'winter']);
});

test('live scene: daypart from daylight and hour, fixed seasons for snow, frost and thunder', () => {
  assert.deepEqual(weatherScene('clearsky_day', 18, true, 9, 7), { key: 'zomer-ochtend-helder', label: 'Zonnige start' });
  assert.deepEqual(weatherScene('partlycloudy_day', 12, true, 19, 10), { key: 'herfst-avond-halfbewolkt', label: 'Af en toe zon' });
  assert.equal(weatherScene('cloudy', 4, false, 7, 1).key, 'winter-nacht-bewolkt'); // dark winter morning
  assert.equal(weatherScene('lightsnow', -1, true, 14, 4).key, 'winter-middag-sneeuw'); // April snow
  assert.equal(weatherScene('rainandthunder', 15, true, 15, 10).key, 'zomer-middag-onweer');
  assert.deepEqual(weatherScene('clearsky_day', -4, true, 8, 2), { key: 'winter-ochtend-vorst', label: 'Ruiten krabben' });
});

test('92 unique photos', () => {
  const keys = allScenes().map((s) => s.key);
  assert.equal(keys.length, 92);
  assert.equal(new Set(keys).size, 92);
});
