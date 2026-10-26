import { studioTime, TIME_ZONE } from '../lib/time';
import { weatherScene, type CurrentWeather } from '../lib/weather';

// One request per 15 minutes, shared across page views (Swup re-runs this on every visit).
let cache: { at: number; data: Promise<CurrentWeather> } | undefined;
const current = () => {
  if (!cache || Date.now() - cache.at > 15 * 60_000) {
    cache = { at: Date.now(), data: fetch('/api/weather').then((r) => (r.ok ? r.json() : Promise.reject(r.status))) };
    cache.data.catch(() => (cache = undefined)); // retry on the next page view
  }
  return cache.data;
};

const today = new Intl.DateTimeFormat('nl-NL', { timeZone: TIME_ZONE, day: 'numeric', month: 'short' });
const month = new Intl.DateTimeFormat('nl-NL', { timeZone: TIME_ZONE, month: 'numeric' });

/** Live weather for Emmen in the weather widget; on a failed request temperature and condition stay empty. */
export function initWeather(): (() => void) | void {
  const widgets = [...document.querySelectorAll<HTMLElement>('[data-weather]')];
  if (!widgets.length) return;
  let stopped = false;
  widgets.forEach((w) => (w.querySelector('[data-weather-date]')!.textContent = today.format(new Date()).replace('.', '')));

  current()
    .then((c) => {
      if (stopped) return;
      const scene = weatherScene(c.symbol, c.temperature, c.isDay, studioTime().h, Number(month.format(new Date())));
      widgets.forEach((w) => {
        const photos: Record<string, string> = JSON.parse(w.dataset.weather!);
        const img = w.querySelector('img')!;
        if (photos[scene.key]) img.src = photos[scene.key];
        w.querySelector('[data-weather-temp]')!.textContent = `${Math.round(c.temperature)} °`;
        w.querySelector('[data-weather-condition]')!.textContent = scene.label;
      });
    })
    .catch(() => {});

  return () => (stopped = true);
}
