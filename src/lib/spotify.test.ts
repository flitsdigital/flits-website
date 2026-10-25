import { test } from 'node:test';
import assert from 'node:assert/strict';
import { trackId, neighbours } from './spotify-ids.ts';

test('track id from the link variants Spotify hands out', () => {
  assert.equal(trackId('https://open.spotify.com/track/0bYg9bo50gSsH3LtXe2SQn?si=abc'), '0bYg9bo50gSsH3LtXe2SQn');
  assert.equal(trackId('https://open.spotify.com/intl-nl/track/0bYg9bo50gSsH3LtXe2SQn'), '0bYg9bo50gSsH3LtXe2SQn');
  assert.equal(trackId('spotify:track:0bYg9bo50gSsH3LtXe2SQn'), '0bYg9bo50gSsH3LtXe2SQn');
});

test('albums and playlists are not tracks', () => {
  assert.equal(trackId('https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX'), null);
  assert.equal(trackId('https://open.spotify.com/playlist/37i9dQZF1DX0Yxoavh5qJV'), null);
});

test('previous and next wrap around the list', () => {
  assert.deepEqual(neighbours(0, 3), { prev: 2, next: 1 });
  assert.deepEqual(neighbours(2, 3), { prev: 1, next: 0 });
  assert.deepEqual(neighbours(0, 1), { prev: 0, next: 0 });
});
