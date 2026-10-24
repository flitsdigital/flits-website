import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Osmo "Number Odometer", unchanged except: GSAP from npm, typed, started per page view from app.ts
 * (Swup) with a cleanup (timelines and the resize listener), and the programmatic update add-on left
 * out (unused). Digits roll like a mechanical counter when a [data-odometer-group] scrolls into view.
 */
gsap.registerPlugin(ScrollTrigger);

type Segment = { type: 'digit' | 'static'; char: string; startDigit?: number; hidden?: boolean };

export function initNumberOdometer(): (() => void) | void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const initFlag = 'data-odometer-initialized';
  const timelines: gsap.core.Timeline[] = [];

  // Configuration
  const defaults = {
    duration: 1,
    ease: 'power3.out',
    elementStagger: 0.1,
    digitStagger: 0.04,
    revealDuration: 0.5,
    revealEase: 'power2.out',
    triggerStart: 'top 80%',
    staggerOrder: 'left',
    digitCycles: 2,
  };

  const groups = [...document.querySelectorAll<HTMLElement>('[data-odometer-group]')];
  if (!groups.length) return;

  // Scroll-triggered groups
  groups.forEach((group) => {
    if (group.hasAttribute(initFlag)) return;
    group.setAttribute(initFlag, '');

    const elements = Array.from(group.querySelectorAll<HTMLElement>('[data-odometer-element]'));
    if (!elements.length || prefersReducedMotion) return;

    const staggerOrder = group.getAttribute('data-odometer-stagger-order') || defaults.staggerOrder;
    const triggerStart = group.getAttribute('data-odometer-trigger-start') || defaults.triggerStart;
    const elementStagger = parseFloat(group.getAttribute('data-odometer-stagger')!) || defaults.elementStagger;

    const elementData = elements.map((el) => {
      const originalText = el.textContent!.trim();
      const hasExplicitStart = el.hasAttribute('data-odometer-start');
      const startValue = parseFloat(el.getAttribute('data-odometer-start')!) || 0;
      const duration = parseFloat(el.getAttribute('data-odometer-duration')!) || defaults.duration;
      const step = getLineHeightRatio(el);

      let segments = parseSegments(originalText);
      segments = mapStartDigits(segments, startValue);
      segments = markHiddenSegments(segments, startValue);

      const grow = shouldGrow(el, hasExplicitStart, startValue, segments);
      const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow);

      const fontSize = parseFloat(getComputedStyle(el).fontSize);
      const revealData = revealEls.map((revealEl) => {
        const widthEm = revealEl.offsetWidth / fontSize;
        gsap.set(revealEl, { width: 0, overflow: 'hidden' });
        return { el: revealEl, widthEm };
      });

      return { el, rollers, duration, step, revealData, originalText };
    });

    const ordered = applyStaggerOrder(elementData, staggerOrder);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: triggerStart,
        once: true,
      },
      onComplete() {
        elementData.forEach(({ el, originalText }) => {
          cleanupElement(el, originalText);
        });
      },
    });
    timelines.push(tl);

    ordered.forEach((data, orderIdx) => {
      const { rollers, duration, step, revealData } = data;
      const offset = orderIdx * elementStagger;

      revealData.forEach(({ el, widthEm }) => {
        tl.to(
          el,
          {
            width: widthEm + 'em',
            opacity: 1,
            duration: defaults.revealDuration,
            ease: defaults.revealEase,
          },
          offset,
        );
      });

      rollers.forEach(({ roller, targetPos }, digitIdx) => {
        const reversedIdx = rollers.length - 1 - digitIdx;
        tl.to(
          roller,
          {
            y: -targetPos * step + 'em',
            duration,
            ease: defaults.ease,
            force3D: true,
          },
          offset + reversedIdx * defaults.digitStagger,
        );
      });
    });
  });

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

  function mapStartDigits(segments: Segment[], startValue: number): Segment[] {
    const digitSlots = segments.filter((s) => s.type === 'digit');
    const padded = String(Math.floor(Math.abs(startValue)))
      .padStart(digitSlots.length, '0')
      .slice(-digitSlots.length);
    let di = 0;
    return segments.map((s) => (s.type === 'digit' ? { ...s, startDigit: parseInt(padded[di++], 10) } : s));
  }

  function markHiddenSegments(segments: Segment[], startValue: number): Segment[] {
    const totalDigits = segments.filter((s) => s.type === 'digit').length;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const leadingZeros = Math.max(0, totalDigits - startDigitCount);
    if (leadingZeros === 0) return segments;
    let digitsSeen = 0;
    let firstDigitSeen = false;
    let prevDigitHidden = false;
    return segments.map((seg) => {
      if (seg.type === 'digit') {
        firstDigitSeen = true;
        const hidden = digitsSeen < leadingZeros;
        prevDigitHidden = hidden;
        digitsSeen++;
        return { ...seg, hidden };
      }
      const hidden = firstDigitSeen && prevDigitHidden;
      return { ...seg, hidden };
    });
  }

  function shouldGrow(el: HTMLElement, hasExplicitStart: boolean, startValue: number, segments: Segment[]) {
    if (el.hasAttribute('data-odometer-grow')) {
      return el.getAttribute('data-odometer-grow') !== 'false';
    }
    if (!hasExplicitStart) return false;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const endDigitCount = segments.filter((s) => s.type === 'digit').length;
    return startDigitCount < endDigitCount;
  }

  function buildRollerDOM(el: HTMLElement, segments: Segment[], step: number, grow: boolean) {
    el.innerHTML = '';
    el.style.height = '';
    const rollers: { roller: HTMLElement; targetPos: number }[] = [];
    const revealEls: HTMLElement[] = [];
    const totalCells = 10 * defaults.digitCycles;
    segments.forEach((seg) => {
      if (seg.type === 'static') {
        const span = document.createElement('span');
        span.setAttribute('data-odometer-part', 'static');
        span.style.height = step + 'em';
        span.style.lineHeight = String(step);
        span.textContent = seg.char;
        el.appendChild(span);
        if (grow && seg.hidden) {
          gsap.set(span, { opacity: 0 });
          revealEls.push(span);
        }
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
      const startDigit = seg.startDigit || 0;
      const isReveal = grow && seg.hidden;
      gsap.set(roller, { y: isReveal ? step + 'em' : -startDigit * step + 'em' });
      const endDigit = parseInt(seg.char, 10);
      const targetPos = endDigit > startDigit ? endDigit : 10 + endDigit;
      rollers.push({ roller, targetPos });
      if (isReveal) revealEls.push(mask);
    });
    return { rollers, revealEls };
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
      mask.style.opacity = '';
      mask.style.overflow = '';
    });

    el.querySelectorAll<HTMLElement>('[data-odometer-part="static"]').forEach((stat) => {
      stat.style.opacity = '';
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
  window.addEventListener('resize', onResize);

  function applyStaggerOrder<T>(items: T[], order: string) {
    const arr = [...items];
    if (order === 'right') return arr.reverse();
    if (order === 'random') return shuffleArray(arr);
    return arr;
  }

  function shuffleArray<T>(arr: T[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  return () => {
    window.removeEventListener('resize', onResize);
    clearTimeout(resizeTimer);
    timelines.forEach((tl) => tl.scrollTrigger?.kill() ?? tl.kill());
    timelines.forEach((tl) => tl.kill());
  };
}
