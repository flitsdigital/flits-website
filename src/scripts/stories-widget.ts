import { reducedMotion } from './media';
import { easeOut } from './motion';
import type { PageScope } from './page-scope';
import { showOnly } from './show-only';

const STORY_MS = 5000;

/**
 * Stories widget: a ring opens the viewer at that story; each runs 5 s with its bar, then the next;
 * after the last (or ×, or Escape) it closes and the rings it showed turn grey.
 */
export function initStoriesWidget(scope: PageScope) {
  const widgets = [...document.querySelectorAll<HTMLElement>('[data-stories]')];
  if (!widgets.length) return;

  widgets.forEach((w) => {
    const viewer = w.querySelector<HTMLElement>('[data-story-viewer]')!;
    const rings = [...w.querySelectorAll<HTMLButtonElement>('[data-story]')];
    const photos = [...viewer.querySelectorAll<HTMLElement>('[data-story-photo]')];
    const bars = [...viewer.querySelectorAll<HTMLElement>('[data-story-bar]')];
    const caption = viewer.querySelector<HTMLElement>('[data-story-caption]')!;
    const row = w.querySelector<HTMLElement>('.stories__row')!;
    const closeButton = viewer.querySelector<HTMLButtonElement>('[data-story-close]')!;
    const still = reducedMotion();
    let at = -1;
    let frame = 0;
    let started = 0;
    let closing: Animation | undefined;

    // Focus only moves back to a ring when it was inside the widget: an auto-ending story must not pull a
    // visitor out of the contact form they started typing in.
    const close = () => {
      cancelAnimationFrame(frame);
      const hadFocus = w.contains(document.activeElement);
      // Fades out over the rings (clicks already pass through), then hides; reopening cancels the fade.
      viewer.style.pointerEvents = 'none';
      closing = viewer.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 150, easing: easeOut(), fill: 'forwards' });
      closing.finished.then(() => at === -1 && (viewer.hidden = true), () => {});
      row.inert = false;
      if (hadFocus) rings[Math.max(0, at)]?.focus({ preventScroll: true });
      at = -1;
    };
    // Opening grows the viewer out of the ring that was tapped, so it is clear where it came from.
    const grow = (ring: HTMLElement) => {
      closing?.cancel();
      const box = w.getBoundingClientRect();
      const face = (ring.querySelector('.stories__face') ?? ring).getBoundingClientRect();
      viewer.style.transformOrigin = `${face.left + face.width / 2 - box.left}px ${face.top + face.height / 2 - box.top}px`;
      viewer.animate(reducedMotion() ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'scale(0.9)' }, { opacity: 1, transform: 'none' }], {
        duration: 220,
        easing: easeOut(),
      });
    };
    const open = (i: number) => {
      if (i >= photos.length) return close();
      const first = at === -1; // also true while the close fade still runs
      at = Math.max(0, i);
      viewer.hidden = false;
      viewer.style.pointerEvents = '';
      if (first) grow(rings[at]);
      row.inert = true; // the rings behind the viewer leave the tab order
      if (first) closeButton.focus({ preventScroll: true });
      rings[at].classList.add('is-seen');
      showOnly(photos, at);
      bars.forEach((b, n) => (b.style.width = n < at ? '100%' : '0'));
      caption.textContent = photos[at].getAttribute('alt');
      cancelAnimationFrame(frame);
      started = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - started) / STORY_MS);
        bars[at].style.width = `${still ? 100 : t * 100}%`;
        if (t < 1) frame = scope.frame(tick);
        else open(at + 1);
      };
      frame = scope.frame(tick);
    };

    rings.forEach((r) => r.addEventListener('click', () => open(Number(r.dataset.story))));
    viewer.querySelectorAll<HTMLButtonElement>('[data-story-step]').forEach((b) => b.addEventListener('click', () => open(at + Number(b.dataset.storyStep))));
    closeButton.addEventListener('click', close);
    w.addEventListener('keydown', (e) => e.key === 'Escape' && !viewer.hidden && close());
  });
}
