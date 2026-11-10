import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shortQuote, firstName } from './quotes.ts';

test('first sentence of the first paragraph', () => {
  assert.equal(
    shortQuote(['De mannen van Flits hebben een super mooie site voor mijn winkel Kaasloods 28 gebouwd. Super blij mee.']),
    'De mannen van Flits hebben een super mooie site voor mijn winkel Kaasloods 28 gebouwd.',
  );
});

test('a long sentence is cut at a word with an ellipsis', () => {
  const long = Array.from({ length: 40 }, (_, i) => `woord${i}`).join(' ') + '.';
  const q = shortQuote([long]);
  assert.ok(q.endsWith('…'));
  assert.ok(q.length <= 91, `length ${q.length}`);
  assert.ok(!q.slice(0, -1).endsWith(' '));
  assert.ok(long.startsWith(q.slice(0, -1)));
});

test('an ellipsis does not end the sentence', () => {
  assert.equal(shortQuote(['Ok... dit is top. Echt waar.']), 'Ok... dit is top.');
});

test('one long word is cut at the limit, not one letter short of it', () => {
  assert.equal(shortQuote(['x'.repeat(100)], 10), `${'x'.repeat(10)}…`);
});

test('first name from the author line', () => {
  assert.equal(firstName('Rik, Kaasloods28'), 'Rik');
  assert.equal(firstName('Car Rally Noord'), 'Car Rally Noord');
});
