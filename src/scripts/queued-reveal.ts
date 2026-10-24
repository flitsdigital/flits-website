import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Osmo "Queued Scroll Reveal", unchanged except: GSAP from npm, started per page view from app.ts (Swup)
 * with a cleanup, and nothing is hidden with reduced motion. Items entering the viewport join one
 * shared queue and fade/rise in one after another.
 */
gsap.registerPlugin(ScrollTrigger);

export function initQueuedScrollReveal(): (() => void) | void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const queue: Element[] = [];
  let isRunning = false;
  const triggers: ScrollTrigger[] = [];
  const revealed: Element[] = [];

  document.querySelectorAll('[data-queued-reveal-group]').forEach((group) => {
    const items = group.hasAttribute('data-queued-reveal-children') ? [...group.children] : [...group.querySelectorAll('[data-queued-reveal-item]')];
    if (!items.length) return;

    items.forEach((item) => {
      if (item.getBoundingClientRect().bottom <= 0) return;

      // Set items on load
      gsap.set(item, { autoAlpha: 0, y: '4em' });
      revealed.push(item);

      triggers.push(
        ScrollTrigger.create({
          trigger: item,
          start: 'top 100%', // Reveal offset
          once: true,
          onEnter: () => {
            queue.push(item);
            if (queue.length > 12) reveal(queue.shift()!); // Max queue length

            if (!isRunning) {
              isRunning = true;
              gsap.delayedCall(0.1, revealNext); // Delay
            }
          },
        }),
      );
    });
  });

  function reveal(item: Element) {
    gsap.to(item, { autoAlpha: 1, duration: 1.2, ease: 'power1.out', clearProps: 'opacity, visibility' });
    gsap.to(item, { y: '0em', duration: 1.2, ease: 'expo.out', clearProps: 'transform' });
  }

  function revealNext() {
    const item = queue.shift();
    if (!item) {
      isRunning = false;
      return;
    }

    // Animate items on scroll
    reveal(item);
    gsap.delayedCall(0.075, revealNext); // Stagger
  }

  return () => {
    triggers.forEach((t) => t.kill());
    gsap.killTweensOf(revealNext);
    gsap.killTweensOf(revealed);
  };
}
