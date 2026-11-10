import { reducedMotion } from './media';
import type { PageScope } from './page-scope';

/** 👈 👉 stepping through the process cards. */
export function initProcessSteps(scope: PageScope) {
  const reduceMotion = reducedMotion();

  document.querySelectorAll<HTMLElement>('[data-steps]').forEach((root) => {
    const track = root.querySelector<HTMLElement>('[data-steps-track]')!;
    const prev = root.querySelector<HTMLButtonElement>('[data-steps-prev]')!;
    const next = root.querySelector<HTMLButtonElement>('[data-steps-next]')!;
    // 👈 only once you've moved on, 👉 only while there is more to see
    const sync = () => {
      const atStart = track.scrollLeft < 1;
      const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
      // Keep keyboard focus: hand it to the other button before hiding the focused one
      if (atEnd && document.activeElement === next && !atStart) prev.focus();
      if (atStart && document.activeElement === prev && !atEnd) next.focus();
      prev.hidden = atStart;
      next.hidden = atEnd;
    };
    const step = (dir: 1 | -1) => {
      const card = track.firstElementChild as HTMLElement;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      track.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: reduceMotion ? 'auto' : 'smooth' });
    };
    prev.addEventListener('click', () => step(-1));
    next.addEventListener('click', () => step(1));
    track.addEventListener('scroll', sync, { passive: true });
    const resize = new ResizeObserver(sync);
    scope.add(() => resize.disconnect());
    resize.observe(track);
  });
}
