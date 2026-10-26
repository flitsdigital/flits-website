import { relativeDay } from '../../lib/relative-day';

/** Bericht van de studio: ‹ › browse newer/older posts; dates are recomputed so a cached page stays right. */
export function init() {
  const now = new Date();
  document.querySelectorAll<HTMLElement>('[data-studio-posts]').forEach((w) => {
    w.querySelectorAll<HTMLTimeElement>('[data-post-date]').forEach((t) => (t.textContent = relativeDay(new Date(t.dateTime), now)));
    const slides = [...w.querySelectorAll<HTMLElement>('[data-post]')];
    const [newer, older] = [...w.querySelectorAll<HTMLButtonElement>('[data-post-step]')];
    const pos = w.querySelector('[data-post-pos]');
    let at = 0;
    const show = (i: number) => {
      at = Math.min(slides.length - 1, Math.max(0, i));
      slides.forEach((s, n) => {
        s.classList.toggle('is-active', n === at);
        s.toggleAttribute('aria-hidden', n !== at);
      });
      if (pos) pos.textContent = `${at + 1}/${slides.length}`;
      if (newer) newer.disabled = at === 0;
      if (older) older.disabled = at === slides.length - 1;
    };
    newer?.addEventListener('click', () => show(at - 1));
    older?.addEventListener('click', () => show(at + 1));
  });
}
