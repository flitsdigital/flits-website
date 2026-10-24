import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { radiusFor, arcPosition, wrapCentered, stepFor } from './radial-geometry';

/**
 * Radial Slider — items ride along a large circle and tilt with it.
 * Built on the Osmo "Radial Text Marquee" approach (GSAP, viewport pause, reduced motion),
 * adapted from text on a path to elements on an arc.
 *
 * [data-radial-slider-init]       wrapper
 *   -speed      px per second of drift while the mouse is over it (0 = none) default 0
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

gsap.registerPlugin(CustomEase);

/** A GSAP ease from CSS: `cubic-bezier(a, b, c, d)` becomes a CustomEase, anything else is a GSAP ease name. */
function easeFromCss(value: string) {
  const bezier = value.match(/cubic-bezier\(([^)]+)\)/);
  if (!bezier) return value || 'expo.out';
  const [a, b, c, d] = bezier[1].split(',').map(parseFloat);
  return CustomEase.create('radial-intro', `M0,0 C${a},${b} ${c},${d} 1,1`);
}

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
      const nextStep = stepFor(first.offsetWidth, first.offsetHeight, GAP, angle);
      if (prevStep && Math.abs(nextStep - prevStep) > 0.5) {
        // The spacing really changed: finish a running step (it aims at the old spacing) and
        // keep the same item centred. Same spacing (e.g. the observer's first call): leave tweens alone.
        stepping?.progress(1);
        state.offset = (state.offset / prevStep) * nextStep;
        target = Math.round(state.offset / nextStep) * nextStep;
      }
      step = nextStep;
      radius = radiusFor(step, angle);
      wrap.style.setProperty('--radial-slider-hand-x', `${first.offsetWidth / 2 + GAP / 2}px`);
      // Centre of the circle, relative to the track's middle, so CSS can rotate the whole fan along
      // its own arc (entry variant 12): below for arch (∩), above for valley (∪).
      if (Number.isFinite(radius)) track.style.setProperty('--radial-arc-origin', `${shape === 'arch' ? radius : -radius}px`);
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

    // Drift on the GSAP ticker only while the mouse is over the slider (nothing moves by itself, so
    // WCAG 2.2.2 needs no pause control); the speed eases up and down over ~0.3s instead of jumping.
    let hovered = false;
    let velocity = 0;
    if (speed > 0) {
      const drift = (_t: number, deltaMs: number) => {
        velocity += ((hovered && !stepping ? speed : 0) - velocity) * Math.min(1, deltaMs / 300);
        if (velocity < 0.5) return;
        state.offset -= (velocity * deltaMs) / 1000;
        render();
      };
      gsap.ticker.add(drift);
      cleanups.push(() => gsap.ticker.remove(drift));
      wrap.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && (hovered = true));
      wrap.addEventListener('pointerleave', () => (hovered = false));
    }

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
    // Entry intro, switched on from CSS (--radial-intro: <steps>): the items glide in along their own
    // arc from `steps` places further on, so they "roll" into the circle instead of popping in.
    const introSteps = parseFloat(getComputedStyle(wrap).getPropertyValue('--radial-intro')) || 0;
    if (introSteps && !reduceMotion) {
      const to = state.offset;
      state.offset = to + introSteps * step;
      render();
      stepping = gsap.to(state, {
        offset: to,
        duration: parseFloat(getComputedStyle(wrap).getPropertyValue('--radial-intro-duration')) || 1.6,
        delay: parseFloat(getComputedStyle(wrap).getPropertyValue('--radial-intro-delay')) || 0,
        ease: easeFromCss(getComputedStyle(wrap).getPropertyValue('--radial-intro-ease').trim()),
        onUpdate: render,
        onComplete: () => (stepping = null),
      });
    }
    const resize = new ResizeObserver(() => requestAnimationFrame(layout));
    resize.observe(wrap);
    document.fonts?.ready.then(layout); // card heights change once the web fonts arrive
    wrap.dataset.radialSliderReady = '';
    cleanups.push(() => {
      resize.disconnect();
      stepping?.kill();
    });
  });

  return () => cleanups.forEach((fn) => fn());
}
