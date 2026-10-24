/** 👈 👉 stepping through the process cards; returns a cleanup for page transitions. */
export function initProcessSteps() {
  const observers: ResizeObserver[] = [];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
    resize.observe(track);
    observers.push(resize);
  });
  return () => observers.forEach((o) => o.disconnect());
}
