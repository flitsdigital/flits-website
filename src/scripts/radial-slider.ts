import { gsap } from 'gsap';
import { radiusFor, arcPosition, wrapCentered, stepFor } from './radial-geometry';

/**
 * Radial Slider — items ride along a large circle and tilt with it.
 * Built on the Osmo "Radial Text Marquee" approach (GSAP, viewport pause, reduced motion),
 * adapted from text on a path to elements on an arc.
 *
 * [data-radial-slider-init]       wrapper
 *   -speed      px per second of autoplay drift (0 = no autoplay)        default 0
 *   -angle      tilt in degrees between neighbours (0 = straight row)     default 10
 *   -shape      arch (∩, sides drop) | valley (∪, sides rise)             default arch
 *   -equal      present: every item gets the height of the tallest one
 * [data-radial-slider-track]      direct children are the items, the first one starts in the centre
 *                                 (it is also the only one shown before the script runs); the centre one gets
 *                                 [data-radial-slider-active] (style it in the section)
 * [data-radial-slider-prev|next]  optional buttons: move one item, with easing; the wrapper gets
 *                                 --radial-slider-hand-x (centre of the gap beside the middle item)
 */
/** Visible space between neighbours, the same in every slider on the site (feedback 2026-10-24). */
const GAP = 96;

/** Starts every slider on the page; returns a cleanup for page transitions (ticker, observers, tweens). */
export function initRadialSliders(): () => void {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cleanups: (() => void)[] = [];

  document.querySelectorAll<HTMLElement>('[data-radial-slider-init]').forEach((wrap) => {
    const track = wrap.querySelector<HTMLElement>('[data-radial-slider-track]');
    if (!track || !track.children.length) return;

    const num = (name: string, fallback: number) => Number(wrap.getAttribute(`data-radial-slider-${name}`) ?? fallback);
    const speed = reduceMotion ? 0 : num('speed', 0);
    const angle = num('angle', 10);
    const shape = wrap.getAttribute('data-radial-slider-shape') === 'valley' ? 'valley' : 'arch';

    const originals = Array.from(track.children) as HTMLElement[];
    let items = [...originals];
    let step = 0;
    let radius = 1;
    let loop = 1;
    const state = { offset: 0 };
    let target = 0;
    let stepping: gsap.core.Tween | null = null;

    // Clone the set until the loop is comfortably wider than the visible area, so nothing pops in.
    const equal = wrap.hasAttribute('data-radial-slider-equal');

    const layout = () => {
      if (equal) {
        // Reset first so a resize can shrink them again, then match the tallest.
        originals.forEach((el) => (el.style.minHeight = ''));
        const tallest = Math.max(...originals.map((el) => el.offsetHeight));
        items.forEach((el) => (el.style.minHeight = `${tallest}px`));
      }
      const first = originals[0];
      const prevStep = step;
      stepping?.progress(1); // finish a running step so it doesn't aim at the old spacing
      step = stepFor(first.offsetWidth, first.offsetHeight, GAP, angle);
      // Keep the same item centred when the step changes size
      if (prevStep) state.offset = (state.offset / prevStep) * step;
      target = Math.round(state.offset / step) * step;
      radius = radiusFor(step, angle);
      wrap.style.setProperty('--radial-slider-hand-x', `${first.offsetWidth / 2 + GAP / 2}px`);
      while (items.length * step < wrap.clientWidth + 4 * step) {
        originals.forEach((el) => {
          const clone = el.cloneNode(true) as HTMLElement;
          clone.setAttribute('aria-hidden', 'true');
          clone.inert = true;
          track.appendChild(clone);
          items.push(clone);
        });
      }
      loop = items.length * step;
      render();
    };

    const render = () => {
      items.forEach((el, i) => {
        const s = wrapCentered(i * step + state.offset, loop);
        const { x, y, rotation } = arcPosition(s, radius, shape);
        gsap.set(el, { x, y, rotation, xPercent: -50, yPercent: -50, zIndex: Math.round(1000 - Math.abs(s)) });
        el.toggleAttribute('data-radial-slider-active', Math.abs(s) < step / 2);
      });
    };

    // Autoplay drift on the GSAP ticker; paused off-screen, on hover/focus and while stepping.
    // WCAG 2.2.2: a tap toggles a lasting pause (touch has no hover), and the slider is focusable
    // so keyboard users can pause it by tabbing to it.
    let inView = true;
    let held = false;
    let paused = false;
    if (speed > 0) {
      const drift = (_t: number, deltaMs: number) => {
        if (!inView || held || paused || stepping) return;
        state.offset -= (speed * deltaMs) / 1000;
        render();
      };
      gsap.ticker.add(drift);
      cleanups.push(() => gsap.ticker.remove(drift));
      wrap.tabIndex = 0;
      wrap.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && (held = true));
      wrap.addEventListener('pointerleave', () => (held = false));
      wrap.addEventListener('focusin', () => (held = true));
      wrap.addEventListener('focusout', () => (held = false));
      wrap.addEventListener('click', (e) => {
        if (!(e.target as Element).closest('button')) paused = !paused;
      });
    }
    const visibility = new IntersectionObserver((e) => (inView = !!e[0]?.isIntersecting));
    visibility.observe(wrap);

    // Steps chain from the previous target, so two quick clicks move two items.
    const go = (dir: 1 | -1) => {
      if (!stepping) target = Math.round(state.offset / step) * step;
      target -= dir * step;
      stepping?.kill();
      stepping = gsap.to(state, {
        offset: target,
        duration: reduceMotion ? 0 : 0.7,
        ease: 'power3.out',
        onUpdate: render,
        onComplete: () => (stepping = null),
      });
    };
    wrap.querySelector('[data-radial-slider-prev]')?.addEventListener('click', () => go(-1));
    wrap.querySelector('[data-radial-slider-next]')?.addEventListener('click', () => go(1));

    layout();
    const resize = new ResizeObserver(() => requestAnimationFrame(layout));
    resize.observe(wrap);
    document.fonts?.ready.then(layout); // card heights change once the web fonts arrive
    wrap.dataset.radialSliderReady = '';
    cleanups.push(() => {
      visibility.disconnect();
      resize.disconnect();
      stepping?.kill();
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
