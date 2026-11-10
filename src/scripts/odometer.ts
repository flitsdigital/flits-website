import { gsap, ScrollTrigger } from './gsap';
import { reducedMotion } from './media';
import type { PageScope } from './page-scope';

type Segment = { type: 'digit' | 'static'; char: string };

/**
 * Osmo "Number Odometer", unchanged except: GSAP from npm, typed, started per page view from app.ts
 * (Swup) with a cleanup (timelines and the resize listener), and the options no markup sets left out
 * (start value, grow/reveal, stagger order, per-element timing, the programmatic update add-on): every
 * digit rolls up from 0. Digits roll like a mechanical counter when a [data-odometer-group] scrolls into view.
 */
export function initNumberOdometer(scope: PageScope) {
  const prefersReducedMotion = reducedMotion();
  const initFlag = 'data-odometer-initialized';

  // Configuration
  const defaults = {
    duration: 1,
    ease: 'power3.out',
    elementStagger: 0.1,
    digitStagger: 0.04,
    triggerStart: 'top 80%',
    digitCycles: 2,
  };

  const groups = [...document.querySelectorAll<HTMLElement>('[data-odometer-group]')];
  if (!groups.length) return;

  // Scroll-triggered groups; the context collects their timelines for the cleanup
  const ctx = gsap.context(() => {});
  scope.add(() => ctx.revert());
  ctx.add(() => groups.forEach((group) => {
    if (group.hasAttribute(initFlag)) return;
    group.setAttribute(initFlag, '');

    const elements = Array.from(group.querySelectorAll<HTMLElement>('[data-odometer-element]'));
    if (!elements.length || prefersReducedMotion) return;

    const elementData = elements.map((el) => {
      const originalText = el.textContent!.trim();
      const step = getLineHeightRatio(el);
      const rollers = buildRollerDOM(el, parseSegments(originalText), step);
      return { el, rollers, step, originalText };
    });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: defaults.triggerStart,
        once: true,
      },
      onComplete() {
        elementData.forEach(({ el, originalText }) => {
          cleanupElement(el, originalText);
        });
      },
    });

    elementData.forEach(({ rollers, step }, orderIdx) => {
      const offset = orderIdx * defaults.elementStagger;

      rollers.forEach(({ roller, targetPos }, digitIdx) => {
        const reversedIdx = rollers.length - 1 - digitIdx;
        tl.to(
          roller,
          {
            y: -targetPos * step + 'em',
            duration: defaults.duration,
            ease: defaults.ease,
            force3D: true,
          },
          offset + reversedIdx * defaults.digitStagger,
        );
      });
    });
  }));

  // Helpers
  function getLineHeightRatio(el: HTMLElement) {
    const cs = getComputedStyle(el);
    const lh = cs.lineHeight;
    if (lh === 'normal') return 1.2;
    return parseFloat(lh) / parseFloat(cs.fontSize);
  }

  function parseSegments(text: string): Segment[] {
    return [...text].map((char) => ({
      type: /\d/.test(char) ? 'digit' : 'static',
      char,
    }));
  }

  function buildRollerDOM(el: HTMLElement, segments: Segment[], step: number) {
    el.innerHTML = '';
    el.style.height = '';
    const rollers: { roller: HTMLElement; targetPos: number }[] = [];
    const totalCells = 10 * defaults.digitCycles;
    segments.forEach((seg) => {
      if (seg.type === 'static') {
        const span = document.createElement('span');
        span.setAttribute('data-odometer-part', 'static');
        span.style.height = step + 'em';
        span.style.lineHeight = String(step);
        span.textContent = seg.char;
        el.appendChild(span);
        return;
      }
      const mask = document.createElement('span');
      mask.setAttribute('data-odometer-part', 'mask');
      mask.style.height = step + 'em';
      mask.style.lineHeight = String(step);
      const roller = document.createElement('span');
      roller.setAttribute('data-odometer-part', 'roller');
      roller.style.lineHeight = String(step);

      const digits = [];
      for (let d = 0; d < totalCells; d++) {
        digits.push(d % 10);
      }
      roller.textContent = digits.join('\n');
      mask.appendChild(roller);
      el.appendChild(mask);
      const endDigit = parseInt(seg.char, 10);
      rollers.push({ roller, targetPos: endDigit || 10 }); // a 0 rolls a full turn instead of standing still
    });
    return rollers;
  }

  function cleanupElement(el: HTMLElement, originalText: string) {
    el.style.overflow = '';
    el.style.height = '';

    // Remove rollers, set final digit, clear inline bloat (but preserve width)
    const digits = [...originalText].filter((c) => /\d/.test(c));
    let di = 0;

    el.querySelectorAll<HTMLElement>('[data-odometer-part="mask"]').forEach((mask) => {
      const roller = mask.querySelector('[data-odometer-part="roller"]');
      if (roller) roller.remove();
      mask.textContent = digits[di++] || '';
    });
  }

  function recalcOnResize() {
    document.querySelectorAll<HTMLElement>('[data-odometer-element]').forEach((el) => {
      const hasRollers = el.querySelector('[data-odometer-part="roller"]');

      if (hasRollers) {
        // Pre-triggered: recalculate step-based inline styles
        const step = String(getLineHeightRatio(el));
        el.querySelectorAll<HTMLElement>('[data-odometer-part="mask"]').forEach((mask) => {
          mask.style.height = step + 'em';
          mask.style.lineHeight = step;
        });
        el.querySelectorAll<HTMLElement>('[data-odometer-part="roller"]').forEach((roller) => {
          roller.style.lineHeight = step;
        });
        el.querySelectorAll<HTMLElement>('[data-odometer-part="static"]').forEach((stat) => {
          stat.style.lineHeight = step;
        });
      }
      // Completed elements: width is em-based, scales automatically, don't touch
    });
    ScrollTrigger.refresh();
  }

  let resizeTimer: number | undefined;
  let lastWidth = window.innerWidth;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      recalcOnResize();
    }, 250);
  };
  window.addEventListener('resize', onResize, { signal: scope.signal });
  scope.add(() => clearTimeout(resizeTimer));
}
