import { gsap } from 'gsap';

function initCursorMarqueeEffect() {
  const hoverOutDelay = 0.4;
  const followDuration = 0.4;
  const speedMultiplier = 5;

  const cursor = document.querySelector<HTMLElement>('[data-cursor-marquee-status]');
  if (!cursor) return;
  const targets = cursor.querySelectorAll<HTMLElement>('[data-cursor-marquee-text-target]');

  const xTo = gsap.quickTo(cursor, 'x', { duration: followDuration, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: followDuration, ease: 'power3' });

  let pauseTimeout: ReturnType<typeof setTimeout> | null = null;
  let activeEl: Element | null = null;
  let lastX = 0;
  let lastY = 0;

  function playFor(el: Element) {
    if (!el) return;
    if (pauseTimeout) clearTimeout(pauseTimeout);
    const text = el.getAttribute('data-cursor-marquee-text') || '';
    const sec = (text.length || 1) / speedMultiplier;
    targets.forEach((t) => {
      t.textContent = text;
      t.style.animationPlayState = 'running';
      t.style.animationDuration = sec + 's';
    });
    cursor!.setAttribute('data-cursor-marquee-status', 'active');
    activeEl = el;
  }

  function pauseLater() {
    cursor!.setAttribute('data-cursor-marquee-status', 'not-active');
    if (pauseTimeout) clearTimeout(pauseTimeout);
    pauseTimeout = setTimeout(() => {
      targets.forEach((t) => {
        t.style.animationPlayState = 'paused';
      });
    }, hoverOutDelay * 1000);
    activeEl = null;
  }

  function checkTarget() {
    const el = document.elementFromPoint(lastX, lastY);
    const hit = el && el.closest('[data-cursor-marquee-text]');
    if (hit !== activeEl) {
      if (activeEl) pauseLater();
      if (hit) playFor(hit);
    }
  }

  window.addEventListener(
    'pointermove',
    (e) => {
      lastX = e.clientX;
      lastY = e.clientY;
      xTo(lastX);
      yTo(lastY);
      checkTarget();
    },
    { passive: true },
  );

  window.addEventListener(
    'scroll',
    () => {
      xTo(lastX);
      yTo(lastY);
      checkTarget();
    },
    { passive: true },
  );

  setTimeout(() => {
    cursor.setAttribute('data-cursor-marquee-status', 'not-active');
  }, 500);
}

/** Cursor marquee (shell, outside #swup). Mouse/trackpad only: there is nothing to hover on touch. Runs once. */
export function initCursorMarquee() {
  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) initCursorMarqueeEffect();
}
