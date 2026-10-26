import { test } from 'node:test';
import assert from 'node:assert/strict';
import { projectsFor, faqsFor } from './select.ts';

const p = (id: string, types: string[]) => ({ id, data: { types } });
// newest first, as getProjects() returns them
const projects = [p('a', ['Social']), p('b', ['Websites']), p('c', ['Video']), p('d', ['Websites']), p('e', []), p('f', ['Social'])];

test('projects of the type first, then the newest others, always 4', () => {
  assert.deepEqual(projectsFor(projects, 'Websites').map((x) => x.id), ['b', 'd', 'a', 'c']);
  assert.deepEqual(projectsFor(projects, 'Social').map((x) => x.id), ['a', 'f', 'b', 'c']);
});

test('no or an unknown type: just the newest 4', () => {
  assert.deepEqual(projectsFor(projects).map((x) => x.id), ['a', 'b', 'c', 'd']);
  assert.deepEqual(projectsFor(projects, 'Podcasts').map((x) => x.id), ['a', 'b', 'c', 'd']);
});

test('a FAQ shows on every service unless it names services', () => {
  const faqs = [{ data: { q: 'algemeen' } }, { data: { q: 'web', services: ['website-laten-maken'] } }, { data: { q: 'leeg', services: [] } }];
  assert.deepEqual(faqsFor(faqs, 'website-laten-maken').map((f) => f.data.q), ['algemeen', 'web', 'leeg']);
  assert.deepEqual(faqsFor(faqs, 'social-media').map((f) => f.data.q), ['algemeen', 'leeg']);
});
