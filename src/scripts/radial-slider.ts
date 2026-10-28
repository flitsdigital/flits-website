import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { radiusFor, arcPosition, wrapCentered, stepFor, rescaleOffset } from './radial-geometry';

/**
 * Radial Slider — items ride along a large circle and tilt with it.
 * Built on the Osmo "Radial Text Marquee" approach (GSAP, viewport pause, reduced motion),
 * adapted from text on a path to elements on an arc.
 *
 * [data-radial-slider-init]       wrapper
 *   -speed      px per second of drift: on hover with a mouse, always on touch    default 0
 *   -angle      tilt in degrees between neighbours (0 = straight row)     default 10
 *   -shape      arch (∩, sides drop) | valley (∪, sides rise)             default arch
 *   -equal      present: every item gets the height of the tallest one
 *   -scroll     degrees the whole fan turns while it scrolls through the viewport   default 0
 * [data-radial-slider-track]      direct children are the items, the first one starts in the centre
 *                                 (it is also the only one shown before the script runs); the centre one gets
 *                                 [data-radial-slider-active] (style it in the section)
 * [data-radial-slider-prev|next]  optional buttons: move one item, with easing; the wrapper gets
 *                                 --radial-slider-hand-x (centre of the gap beside the middle item)
 * --radial-slider-gap             optional CSS override of GAP in px, e.g. smaller on phones
 */
/** Visible space between neighbours, the same in every slider on the site (feedback 2026-10-24). */
const GAP = 96;

gsap.registerPlugin(CustomEase, ScrollTrigger);
/** The site's motion curve (--ease-osmo in tokens.css) */
export const osmo = CustomEase.create('osmo', 'M0,0 C0.625,0.05 0,1 1,1');

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
    const scrollTurn = reduceMotion ? 0 : num('scroll', 0);
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
      const gap = parseFloat(getComputedStyle(wrap).getPropertyValue('--radial-slider-gap')) || GAP;
      const prevStep = step;
      const nextStep = stepFor(first.offsetWidth, first.offsetHeight, gap, angle);
      if (prevStep && Math.abs(nextStep - prevStep) > 0.5) {
        // The spacing really changed: finish a running step (it aims at the old spacing) and
        // keep the same item centred. Same spacing (e.g. the observer's first call): leave tweens alone.
        stepping?.progress(1);
        ({ offset: state.offset, target } = rescaleOffset(state.offset, prevStep, nextStep));
      }
      step = nextStep;
      radius = radiusFor(step, angle);
      wrap.style.setProperty('--radial-slider-hand-x', `${first.offsetWidth / 2 + gap / 2}px`);
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
        // z-index in tenths of a step, not px: a per-frame change forces a repaint instead of a cheap transform
        gsap.set(el, { x, y, rotation, xPercent: -50, yPercent: -50, zIndex: 1000 - Math.round((Math.abs(s) / step) * 10) });
        el.toggleAttribute('data-radial-slider-active', Math.abs(s) < step / 2);
      });
    };

    // Drift on the GSAP ticker. With a mouse: only while hovering. Touch screens have no hover, so there
    // it drifts by itself while on screen, and a tap toggles a lasting pause (WCAG 2.2.2).
    // The speed eases up and down over ~0.3s instead of jumping.
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    let hovered = false;
    let paused = false;
    let inView = true;
    let velocity = 0;
    if (speed > 0) {
      const drift = (_t: number, deltaMs: number) => {
        const lowPower = document.documentElement.hasAttribute('data-low-power'); // set in app.ts
        const moving = (canHover ? hovered : inView && !paused) && !stepping && !lowPower;
        velocity += ((moving ? speed : 0) - velocity) * Math.min(1, deltaMs / 300);
        if (velocity < 0.5) return;
        state.offset -= (velocity * deltaMs) / 1000;
        render();
      };
      gsap.ticker.add(drift);
      cleanups.push(() => gsap.ticker.remove(drift));
      if (canHover) {
        wrap.addEventListener('pointerenter', () => (hovered = true));
        wrap.addEventListener('pointerleave', () => (hovered = false));
      } else {
        wrap.addEventListener('click', (e) => {
          if (!(e.target as Element).closest('button')) paused = !paused;
        });
        const visibility = new IntersectionObserver((e) => (inView = !!e[0]?.isIntersecting));
        visibility.observe(wrap);
        cleanups.push(() => visibility.disconnect());
      }
    }

    // Steps chain from the previous target, so two quick clicks move two items.
    const go = (dir: 1 | -1) => {
      if (!stepping) target = Math.round(state.offset / step) * step;
      target -= dir * step;
      stepping?.kill();
      stepping = gsap.to(state, {
        offset: target,
        duration: reduceMotion ? 0 : 0.8, // the curve starts slowly, so a touch longer than 0.7s
        ease: osmo,
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
    // Scroll: the whole fan turns as one around the centre of its own circle (--radial-arc-origin, see the
    // track's CSS), scrubbed (0.6s catch-up) on the Osmo curve; it keeps turning until the fan is a full
    // screen past the top, so the turn is spread over a long scroll
    if (scrollTurn) {
      const turn = gsap.to(track, {
        rotation: -scrollTurn,
        ease: osmo,
        scrollTrigger: { trigger: wrap, start: 'top bottom', end: 'bottom -100%', scrub: 0.6 },
      });
      cleanups.push(() => turn.scrollTrigger?.kill(), () => turn.kill());
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
