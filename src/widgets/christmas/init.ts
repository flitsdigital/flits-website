import { studioNow } from '../../lib/time';
import { daysUntilChristmas, christmasStage, christmasLabel, christmasPhoto, isDark } from './logic';

/** Live countdown and office photo for the Christmas widget (studio date, Amsterdam). Pinned widgets have no data-christmas. */
export function init() {
  const widgets = document.querySelectorAll<HTMLElement>('[data-christmas]');
  if (!widgets.length) return;
  const now = studioNow();
  const days = daysUntilChristmas(now.year, now.month, now.day);
  widgets.forEach((w) => {
    const photos: Record<string, string> = JSON.parse(w.dataset.christmas!);
    const key = christmasPhoto(christmasStage(now.month, now.day), isDark(now.h), new Set(Object.keys(photos)));
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
