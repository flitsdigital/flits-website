import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseTokens } from './tokens.ts';

test('parses groups, values and strips trailing comments', () => {
  const css = `:root {
  --ignored: 1px;
  /* @group Kleuren */
  --color-a: #fff; /* wit */
  /* @group Type */
  --text-x: 900 1rem/0.9 var(--font-display); /* 16px */
}`;
  assert.deepEqual(parseTokens(css), [
    { group: 'Kleuren', tokens: [{ name: '--color-a', value: '#fff' }] },
    { group: 'Type', tokens: [{ name: '--text-x', value: '900 1rem/0.9 var(--font-display)' }] },
  ]);
});

test('every declaration in tokens.css lands in a group', () => {
  const css = readFileSync(new URL('../styles/tokens.css', import.meta.url), 'utf8');
  const declared = css.match(/^\s*--[\w-]+\s*:/gm)!.length;
  const parsed = parseTokens(css).reduce((n, g) => n + g.tokens.length, 0);
  assert.equal(parsed, declared);
});
