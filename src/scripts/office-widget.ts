import { photoLabel, isToday } from '../lib/relative-day';

/** "Kijk binnen": recompute "foto van vandaag / 3 dagen geleden" in the browser, so a cached page stays right. */
export function initOfficeWidget() {
  const now = new Date();
  document.querySelectorAll<HTMLElement>('[data-office]').forEach((w) => {
    const date = new Date(w.dataset.office!);
    w.querySelector('[data-office-when]')!.textContent = photoLabel(date, now);
    w.querySelector<HTMLElement>('[data-office-fresh]')!.hidden = !isToday(date, now);
  });
}
