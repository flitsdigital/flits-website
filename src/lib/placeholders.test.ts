import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findPlaceholder } from './placeholders.ts';

test('finds a placeholder in square brackets', () => {
  assert.equal(findPlaceholder('Rik kreeg reacties [van wie?].'), '[van wie?]');
});

test('a Markdown link is not a placeholder', () => {
  assert.equal(findPlaceholder('Zie [de site](https://kaasloods28.nl).'), null);
});

test('plain text has none', () => {
  assert.equal(findPlaceholder('De site staat live.'), null);
});

test('looks inside nested frontmatter, not at array brackets', () => {
  assert.equal(findPlaceholder({ tags: ['Website', 'Foto'], stats: { items: [{ value: '14' }] } }), null);
  assert.equal(findPlaceholder({ results: { body: ['Live.', 'Bijgewerkt [datum].'] } }), '[datum]');
});
