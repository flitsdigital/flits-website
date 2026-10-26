import { getCollection } from 'astro:content';
import { trackId } from './spotify-ids';
import { byFileOrder } from './slots';
import trackFile from '../content/tracks.json';

export type Track = { id: string; uri: string; href: string; title: string; artist: string; cover: string };

/** Spotify's public oEmbed (no key): title and cover art; undefined when Spotify does not answer in 5 s. */
async function oembed(url: string): Promise<{ title?: string; thumbnail_url?: string } | undefined> {
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(5000) });
    return res.ok ? await res.json() : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The widget's tracks from src/content/tracks.json, in file order, with title and cover from Spotify at build.
 * The stored title/cover keep the build going when Spotify is down. Memoised per build (one oEmbed call per
 * track); not in dev, where a remembered result would outlive content edits.
 */
let tracks: Promise<Track[]> | undefined;
export const getTracks = () => (import.meta.env?.DEV ? loadTracks() : (tracks ??= loadTracks()));

const loadTracks = () =>
  getCollection('tracks').then((entries) =>
    Promise.all(
      byFileOrder(entries, trackFile.map((t) => t.id)).map(async ({ id, data }) => {
        const tid = trackId(data.url)!; // the collection schema already rejects non-track links
        const o = await oembed(data.url);
        const title = o?.title ?? data.title;
        const cover = o?.thumbnail_url ?? data.cover;
        if (!title || !cover) throw new Error(`tracks.json "${id}": Spotify did not answer and there is no stored title/cover`);
        return { id, uri: `spotify:track:${tid}`, href: `https://open.spotify.com/track/${tid}`, title, artist: data.artist, cover };
      }),
    ),
  );
