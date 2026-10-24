/**
 * Osmo "Rotating Image Trail", unchanged except: fewer photos that stay longer and fade out instead of
 * spinning away (feedback 2026-10-24), typed, every [data-trail-area] on the page, started
 * per page view from app.ts (Swup) with a cleanup, and off with reduced motion. Moving the mouse over
 * the area spawns clones of the items in turn, which pop in and fade out.
 * Touch screens have no cursor: there a virtual one drifts through the area in a slow figure eight
 * while it is on screen, and feeds the same trail.
 */
export function initRotatingImageTrail(): (() => void) | void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cleanups: (() => void)[] = [];

  document.querySelectorAll<HTMLElement>('[data-trail-area]').forEach((area) => {
    const collection = area.querySelector('[data-trail-collection]');
    if (!collection) return;

    const items = collection.querySelectorAll<HTMLElement>('[data-trail-item]');
    if (!items.length) return;

    // Distance logic
    let index = 0;
    let lastCloneX: number | null = null;
    let lastCloneY: number | null = null;

    const cardWidth = items[0].getBoundingClientRect().width;
    const stepDistance = cardWidth * 1.25; // Osmo 0.5: fewer photos
    const timers = new Set<number>();
    const later = (fn: () => void, ms: number) => {
      const id = window.setTimeout(() => {
        timers.delete(id);
        fn();
      }, ms);
      timers.add(id);
    };

    function spawnTrailItem(x: number, y: number) {
      const original = items[index];
      const clone = original.cloneNode(true) as HTMLElement;

      clone.style.left = x + 'px';
      clone.style.top = y + 'px';

      clone.setAttribute('data-trail-item', 'hidden');

      area.appendChild(clone);

      void clone.getBoundingClientRect();

      clone.setAttribute('data-trail-item', 'visible');

      later(() => clone.setAttribute('data-trail-item', 'transition-out'), 1200); // Osmo 400: stays longer
      later(() => clone.remove(), 1800);

      index = (index + 1) % items.length;
      lastCloneX = x;
      lastCloneY = y;
    }

    // Mouse movement logic (x, y relative to the area)
    const trailTo = (x: number, y: number, rect: DOMRect) => {
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        lastCloneX = null;
        lastCloneY = null;
        return;
      }

      if (lastCloneX === null || lastCloneY === null) {
        spawnTrailItem(x, y);
        return;
      }

      const dx = x - lastCloneX;
      const dy = y - lastCloneY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance >= stepDistance) {
        spawnTrailItem(x, y);
      }
    };
    const onMove = (event: MouseEvent) => {
      const rect = area.getBoundingClientRect();
      trailTo(event.clientX - rect.left, event.clientY - rect.top, rect);
    };
    area.addEventListener('mousemove', onMove);
    cleanups.push(() => {
      area.removeEventListener('mousemove', onMove);
      timers.forEach(clearTimeout);
    });

    // Touch: a virtual cursor on a figure eight (one loop ≈ 9s), only while the area is on screen
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) {
      let frame = 0;
      let start = 0;
      const drift = (now: number) => {
        start ||= now;
        const t = (now - start) / 1000;
        const rect = area.getBoundingClientRect();
        const x = rect.width * (0.5 + 0.36 * Math.sin(t * 0.7));
        const y = rect.height * (0.55 + 0.3 * Math.sin(t * 1.4));
        trailTo(x, y, rect);
        frame = requestAnimationFrame(drift);
      };
      const visibility = new IntersectionObserver(([entry]) => {
        cancelAnimationFrame(frame);
        if (entry?.isIntersecting) frame = requestAnimationFrame(drift);
      });
      visibility.observe(area);
      cleanups.push(() => {
        visibility.disconnect();
        cancelAnimationFrame(frame);
      });
    }
  });

  return () => cleanups.forEach((fn) => fn());
}
