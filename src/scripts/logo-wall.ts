import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Osmo "Logo Wall Cycle", unchanged except: GSAP from npm, started per page view from app.ts (Swup)
 * with a cleanup, and the cycle only plays while the wall is on screen and the tab is visible
 * (Osmo starts it at once, so a wall below the fold kept swapping until it was scrolled past).
 */
gsap.registerPlugin(ScrollTrigger);

export function initLogoWallCycle(): () => void {
  const loopDelay = 1.5; // Loop Duration
  const duration = 0.9; // Animation Duration
  const cleanups: (() => void)[] = [];

  document.querySelectorAll<HTMLElement>('[data-logo-wall-cycle-init]').forEach((root) => {
    const list = root.querySelector('[data-logo-wall-list]')!;
    const items = Array.from(list.querySelectorAll<HTMLElement>('[data-logo-wall-item]'));

    const shuffleFront = root.getAttribute('data-logo-wall-shuffle') !== 'false';
    const originalTargets = items
      .map((item) => item.querySelector('[data-logo-wall-target]'))
      .filter((n): n is Element => Boolean(n));

    let visibleItems: HTMLElement[] = [];
    let visibleCount = 0;
    let pool: Element[] = [];
    let pattern: number[] = [];
    let patternIndex = 0;
    let tl: gsap.core.Timeline | undefined;
    let inView = false;
    const playIfSeen = () => (inView && !document.hidden ? tl!.play() : tl!.pause());

    function isVisible(el: Element) {
      return window.getComputedStyle(el).display !== 'none';
    }

    function shuffleArray<T>(arr: T[]) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function setup() {
      if (tl) {
        tl.kill();
      }
      visibleItems = items.filter(isVisible);
      visibleCount = visibleItems.length;

      pattern = shuffleArray(Array.from({ length: visibleCount }, (_, i) => i));
      patternIndex = 0;

      // remove all injected targets
      items.forEach((item) => {
        item.querySelectorAll('[data-logo-wall-target]').forEach((old) => old.remove());
      });

      pool = originalTargets.map((n) => n.cloneNode(true) as Element);

      let front: Element[], rest: Element[];
      if (shuffleFront) {
        const shuffledAll = shuffleArray(pool);
        front = shuffledAll.slice(0, visibleCount);
        rest = shuffleArray(shuffledAll.slice(visibleCount));
      } else {
        front = pool.slice(0, visibleCount);
        rest = shuffleArray(pool.slice(visibleCount));
      }
      pool = front.concat(rest);

      for (let i = 0; i < visibleCount; i++) {
        const parent = visibleItems[i].querySelector('[data-logo-wall-target-parent]') || visibleItems[i];
        parent.appendChild(pool.shift()!);
      }

      tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay, paused: true });
      tl.call(swapNext);
      playIfSeen();
    }

    function swapNext() {
      const nowCount = items.filter(isVisible).length;
      if (nowCount !== visibleCount) {
        setup();
        return;
      }
      if (!pool.length) return;

      const idx = pattern[patternIndex % visibleCount];
      patternIndex++;

      const container = visibleItems[idx];
      const parent =
        container.querySelector('[data-logo-wall-target-parent]') ||
        container.querySelector('*:has(> [data-logo-wall-target])') ||
        container;
      const existing = parent.querySelectorAll('[data-logo-wall-target]');
      if (existing.length > 1) return;

      const current = parent.querySelector('[data-logo-wall-target]');
      const incoming = pool.shift()!;

      gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
      parent.appendChild(incoming);

      if (current) {
        gsap.to(current, {
          yPercent: -50,
          autoAlpha: 0,
          duration,
          ease: 'expo.inOut',
          onComplete: () => {
            current.remove();
            pool.push(current);
          },
        });
      }

      gsap.to(incoming, {
        yPercent: 0,
        autoAlpha: 1,
        duration,
        delay: 0.1,
        ease: 'expo.inOut',
      });
    }

    setup();

    const trigger = ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (self) => {
        inView = self.isActive;
        playIfSeen();
      },
    });

    document.addEventListener('visibilitychange', playIfSeen);

    cleanups.push(() => {
      tl?.kill();
      trigger.kill();
      document.removeEventListener('visibilitychange', playIfSeen);
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
