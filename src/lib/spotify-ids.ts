/** Spotify track id from a share link (`open.spotify.com/[intl-xx/]track/<id>?si=…`) or a `spotify:track:<id>` URI; null for anything else. */
export function trackId(urlOrUri: string): string | null {
  const m = urlOrUri.match(/^spotify:track:([A-Za-z0-9]{22})$/) ?? urlOrUri.match(/^https:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?track\/([A-Za-z0-9]{22})(?:[/?#]|$)/);
  return m ? m[1] : null;
}

/** Previous and next index in a list of `n` tracks, wrapping around. */
export const neighbours = (i: number, n: number) => ({ prev: (i - 1 + n) % n, next: (i + 1) % n });
