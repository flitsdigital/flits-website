import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { osmo } from './radial-slider';

gsap.registerPlugin(ScrollTrigger);

/**
 * The footer wordmark's letters rise in one after another once it scrolls into view. The footer sits
 * outside #swup, but this starts per page view so the trigger is measured against the new page's height.
 */
export function initFooterLogo(): (() => void) | void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const logo = document.querySelector<SVGSVGElement>('.footer__logo');
  if (!logo) return;
  // Left to right, so the bolt is the center letter (it is first in the SVG source)
  const letters = [...logo.querySelectorAll('path')].sort((a, b) => a.getBBox().x - b.getBBox().x);

  const tween = gsap.from(letters, {
    yPercent: 100,
    duration: 1.2,
    ease: osmo,
    stagger: { each: 0.08, from: 'center' }, // the bolt first, then outwards
    scrollTrigger: { trigger: logo, start: 'top 90%' },
  });
  return () => tween.revert();
}
