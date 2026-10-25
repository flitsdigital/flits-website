const STORY_MS = 5000;

/**
 * Stories widget: a ring opens the viewer at that story; each runs 5 s with its bar, then the next;
 * after the last (or ×, or Escape) it closes and the rings it showed turn grey.
 */
export function initStoriesWidget(): (() => void) | void {
  const widgets = [...document.querySelectorAll<HTMLElement>('[data-stories]')];
  if (!widgets.length) return;
  const stops: (() => void)[] = [];

  widgets.forEach((w) => {
    const viewer = w.querySelector<HTMLElement>('[data-story-viewer]')!;
    const rings = [...w.querySelectorAll<HTMLButtonElement>('[data-story]')];
    const photos = [...viewer.querySelectorAll<HTMLElement>('[data-story-photo]')];
    const bars = [...viewer.querySelectorAll<HTMLElement>('[data-story-bar]')];
    const caption = viewer.querySelector<HTMLElement>('[data-story-caption]')!;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let at = -1;
    let frame = 0;
    let started = 0;

    const close = () => {
      cancelAnimationFrame(frame);
      viewer.hidden = true;
      rings[Math.max(0, at)]?.focus();
      at = -1;
    };
    const open = (i: number) => {
      if (i >= photos.length) return close();
      at = Math.max(0, i);
      viewer.hidden = false;
      rings[at].classList.add('is-seen');
      photos.forEach((p, n) => p.classList.toggle('is-active', n === at));
      bars.forEach((b, n) => (b.style.width = n < at ? '100%' : '0'));
      caption.textContent = photos[at].getAttribute('alt');
      cancelAnimationFrame(frame);
      started = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / STORY_MS);
        bars[at].style.width = `${still ? 100 : t * 100}%`;
        if (t < 1) frame = requestAnimationFrame(tick);
        else open(at + 1);
      };
      frame = requestAnimationFrame(tick);
    };

    rings.forEach((r) => r.addEventListener('click', () => open(Number(r.dataset.story))));
    viewer.querySelectorAll<HTMLButtonElement>('[data-story-step]').forEach((b) => b.addEventListener('click', () => open(at + Number(b.dataset.storyStep))));
    viewer.querySelector('[data-story-close]')!.addEventListener('click', close);
    viewer.addEventListener('keydown', (e) => e.key === 'Escape' && close());
    stops.push(() => cancelAnimationFrame(frame));
  });

  return () => stops.forEach((s) => s());
}
