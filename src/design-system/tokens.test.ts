import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
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

// A var() that points nowhere silently falls back (an easing becomes `ease`, a colour disappears).
// Defined = in tokens.css/themes.css, declared in the same file (scoped custom properties of a
// component count), or set from a script with setProperty('--x') anywhere.
test('every var(--name) under src/ is defined', () => {
  const src = new URL('../', import.meta.url);
  const read = (path: string) => readFileSync(new URL(path, src), 'utf8');
  const names = (text: string, re: RegExp) => [...text.matchAll(re)].map((m) => m[1]);
  const declared = (text: string) => names(text, /(--[\w-]+)\s*:/g);
  const files = readdirSync(src, { recursive: true, encoding: 'utf8' }).filter(
    (f: string) => /\.(astro|css|ts)$/.test(f) && !f.endsWith('.test.ts'),
  );
  const global = new Set([
    ...declared(read('styles/tokens.css')),
    ...declared(read('styles/themes.css')),
    ...files.flatMap((f: string) => names(read(f), /setProperty\(\s*['"`](--[\w-]+)/g)),
  ]);
  const missing = files.flatMap((file: string) => {
    const text = read(file);
    const local = new Set(declared(text));
    return names(text, /var\(\s*(--[\w-]+)/g)
      .filter((name) => !name.endsWith('-')) // var(--span-${n}): built in a template
      .filter((name) => !global.has(name) && !local.has(name))
      .map((name) => `${file}: ${name}`);
  });
  assert.deepEqual([...new Set(missing)], []);
});
