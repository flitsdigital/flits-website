import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skyFor, seasonFor, weatherScene, allScenes } from './weather.ts';

test('WMO codes map to the photo skies', () => {
  assert.deepEqual([0, 1, 2, 3, 45, 48, 51, 63, 66, 71, 77, 80, 85, 95, 99].map((c) => skyFor(c)), [
    'helder', 'helder', 'halfbewolkt', 'bewolkt', 'mist', 'mist', 'regen', 'regen', 'regen', 'sneeuw', 'sneeuw', 'regen', 'sneeuw', 'onweer', 'onweer',
  ]);
});

test('frost only replaces dry skies', () => {
  assert.equal(skyFor(0, -3), 'vorst');
  assert.equal(skyFor(3, 0), 'vorst');
  assert.equal(skyFor(73, -3), 'sneeuw');
  assert.equal(skyFor(45, -1), 'mist');
});

test('seasons follow the trees, not the calendar', () => {
  assert.deepEqual([1, 3, 4, 5, 6, 9, 10, 11, 12].map(seasonFor), ['winter', 'winter', 'lente', 'lente', 'zomer', 'zomer', 'herfst', 'herfst', 'winter']);
});

test('live scene: daypart from daylight and hour, fixed seasons for snow, frost and thunder', () => {
  assert.deepEqual(weatherScene(0, 18, true, 9, 7), { key: 'zomer-ochtend-helder', label: 'Zonnige start' });
  assert.deepEqual(weatherScene(2, 12, true, 19, 10), { key: 'herfst-avond-halfbewolkt', label: 'Af en toe zon' });
  assert.equal(weatherScene(3, 4, false, 7, 1).key, 'winter-nacht-bewolkt'); // dark winter morning
  assert.equal(weatherScene(73, -1, true, 14, 4).key, 'winter-middag-sneeuw'); // April snow
  assert.equal(weatherScene(95, 15, true, 15, 10).key, 'zomer-middag-onweer');
  assert.deepEqual(weatherScene(0, -4, true, 8, 2), { key: 'winter-ochtend-vorst', label: 'Ruiten krabben' });
});

test('92 unique photos', () => {
  const keys = allScenes().map((s) => s.key);
  assert.equal(keys.length, 92);
  assert.equal(new Set(keys).size, 92);
});
