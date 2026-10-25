import { studioTime, TIME_ZONE } from '../lib/time';
import { daysUntilChristmas, christmasStage, christmasLabel, christmasPhoto, isDark } from '../lib/christmas';

const ymd = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: 'numeric', day: 'numeric' });

/** Live countdown and office photo for the Christmas widget (studio date, Amsterdam). Pinned widgets have no data-christmas. */
export function initChristmas() {
  const widgets = document.querySelectorAll<HTMLElement>('[data-christmas]');
  if (!widgets.length) return;
  const [y, m, d] = ymd.format(new Date()).split('-').map(Number);
  const days = daysUntilChristmas(y, m, d);
  widgets.forEach((w) => {
    const photos: Record<string, string> = JSON.parse(w.dataset.christmas!);
    const key = christmasPhoto(christmasStage(m, d), isDark(studioTime().h), new Set(Object.keys(photos)));
    if (key) w.querySelector('img')!.src = photos[key];
    const digits = w.querySelector<HTMLElement>('[data-christmas-days]')!;
    const tile = digits.firstElementChild!; // cloned so the tiles keep Astro's scoped-style attribute
    digits.replaceChildren(
      ...String(days)
        .padStart(2, '0')
        .split('')
        .map((n) => Object.assign(tile.cloneNode(), { textContent: n })),
    );
    digits.setAttribute('aria-label', `${days} ${christmasLabel(days).toLowerCase()}`);
    w.querySelector('[data-christmas-label]')!.textContent = christmasLabel(days);
  });
}
