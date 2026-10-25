/**
 * Inline playback for the Spotify widget through Spotify's iFrame API: a hidden embed plays the track,
 * our own play button and progress bar drive and follow it. Nothing from Spotify loads (no script, no
 * cookies) until a visitor presses play. Logged-out visitors hear Spotify's 30 s preview.
 */
type PlaybackUpdate = { data: { isPaused: boolean; position: number; duration: number } };
type Controller = {
  play(): void;
  togglePlay(): void;
  destroy(): void;
  addListener(event: 'ready', cb: () => void): void;
  addListener(event: 'playback_update', cb: (e: PlaybackUpdate) => void): void;
};
type IFrameAPI = { createController(el: HTMLElement, options: object, cb: (c: Controller) => void): void };

// The API script calls window.onSpotifyIframeApiReady once per page load, so it is loaded once and kept across Swup visits.
let api: Promise<IFrameAPI> | undefined;
const loadApi = () =>
  (api ??= new Promise<IFrameAPI>((resolve, reject) => {
    (window as unknown as { onSpotifyIframeApiReady: (a: IFrameAPI) => void }).onSpotifyIframeApiReady = resolve;
    const script = Object.assign(document.createElement('script'), { src: 'https://open.spotify.com/embed/iframe-api/v1', async: true });
    script.onerror = () => {
      api = undefined; // try again on the next press
      reject(new Error('Spotify iFrame API failed to load'));
    };
    document.head.append(script);
  }));

export function initSpotify(): (() => void) | void {
  const widgets = [...document.querySelectorAll<HTMLElement>('[data-spotify]')];
  if (!widgets.length) return;
  const controllers: Controller[] = [];

  const offs = widgets.map((widget) => {
    const button = widget.querySelector<HTMLButtonElement>('[data-spotify-play]')!;
    const fill = widget.querySelector<HTMLElement>('[data-spotify-fill]')!;
    let controller: Promise<Controller> | undefined;

    const create = () =>
      (controller ??= loadApi().then(
        (API) =>
          new Promise<Controller>((resolve) => {
            const host = widget.querySelector<HTMLElement>('[data-spotify-embed]')!;
            API.createController(host, { uri: widget.dataset.spotify, width: 300, height: 80 }, (c) => {
              controllers.push(c);
              c.addListener('ready', () => resolve(c));
              c.addListener('playback_update', ({ data }) => {
                widget.toggleAttribute('data-playing', !data.isPaused);
                button.setAttribute('aria-pressed', String(!data.isPaused));
                if (data.duration) fill.style.width = `${Math.min(100, (data.position / data.duration) * 100)}%`;
              });
            });
          }),
      ));

    const onClick = () => {
      const first = !controller;
      widget.toggleAttribute('data-loading', first);
      create()
        .then((c) => (first ? c.play() : c.togglePlay()))
        .catch(() => {})
        .finally(() => widget.removeAttribute('data-loading'));
    };
    button.addEventListener('click', onClick);
    return () => button.removeEventListener('click', onClick);
  });

  return () => {
    offs.forEach((off) => off());
    controllers.forEach((c) => c.destroy()); // stops the music before Swup swaps the page
  };
}
