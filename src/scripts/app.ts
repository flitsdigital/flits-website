import Swup from 'swup';
import SwupHeadPlugin from '@swup/head-plugin';
import SwupA11yPlugin from '@swup/a11y-plugin';
import SwupPreloadPlugin from '@swup/preload-plugin';
import { initWidgetSlots } from './widget-slots';
import { initRadialSliders } from './radial-slider';
import { initClocks } from './clock';
import { initProjectArchive } from './project-archive';
import { initProcessSteps } from './process-steps';
import { initLogoWallCycle } from './logo-wall';
import { initAccordions } from './accordion';
import { initQueuedScrollReveal } from './queued-reveal';
import { initNumberOdometer } from './odometer';
import { initAnimatedGrid } from './grid-overlay';
import { initRotatingImageTrail } from './image-trail';
import { initRotatingText } from './rotating-text';
import { initContactModal } from './contact-modal';
import { initWeather } from './weather';
import { initChristmas } from './christmas';
import { initSpotify } from './spotify';
import { initPageSpeed } from './pagespeed';
import { initReviewsWidget } from './reviews-widget';
import { initOfficeWidget } from './office-widget';
import { initStoriesWidget } from './stories-widget';
import { initStudioPosts } from './studio-posts';
import { initContactForms } from './contact-form';

/**
 * One script for every page. Swup swaps only #swup (the page content) and #nav-back; navbar and
 * footer stay. The swap itself is instant; motion.css animates the new hero's content in.
 * Scripts inside new content are not run by Swup, so everything that belongs to page content
 * starts here on each page view and is cleaned up before the content is replaced.
 */
const pageInits: (() => (() => void) | void)[] = [initWidgetSlots, initRadialSliders, initClocks, initProjectArchive, initProcessSteps, initLogoWallCycle, initAccordions, initQueuedScrollReveal, initNumberOdometer, initRotatingImageTrail, initRotatingText, initWeather, initChristmas, initSpotify, initPageSpeed, initReviewsWidget, initOfficeWidget, initStoriesWidget, initStudioPosts, initContactForms];

let cleanups: (() => void)[] = [];
// One init at a time: a section that throws must not stop the others or lose their cleanups.
const mount = () => {
  for (const init of pageInits) {
    try {
      const cleanup = init();
      if (cleanup) cleanups.push(cleanup);
    } catch (error) {
      console.error(error);
    }
  }
};
const unmount = () => {
  cleanups.forEach((fn) => fn());
  cleanups = [];
};

mount();
// Design grid (Shift+G) for us, not for visitors: dev server, or ?grid on any page
if (import.meta.env.DEV || new URLSearchParams(location.search).has('grid')) initAnimatedGrid(); // once: outside #swup
initContactModal(); // once: the modal sits outside #swup too

const swup = new Swup({
  containers: ['#swup', '#nav-back'],
  // No out/in animation on the page itself (it would expose the body background); see motion.css.
  animationSelector: false,
  // Review pages keep their own scripts: plain full page loads (as do links marked data-no-swup).
  // They have no #swup themselves, so links on them load normally too.
  ignoreVisit: (url, { el } = {}) =>
    !document.getElementById('swup') ||
    !!el?.closest('[data-no-swup]') ||
    ['/styleguide', '/components', '/sections', '/widgets'].some((p) => new URL(url, location.origin).pathname.startsWith(p)),
  plugins: [new SwupHeadPlugin({ awaitAssets: true }), new SwupA11yPlugin(), new SwupPreloadPlugin()],
});

swup.hooks.on('visit:start', () => {
  document.documentElement.removeAttribute('data-landing'); // the home entry animation is for the first load only
  document.dispatchEvent(new CustomEvent('flits:navigate')); // navbar closes its menus
});
swup.hooks.before('content:replace', unmount);
// Right after the swap (before paint): the new hero's content arrives, the yellow line flashes.
let arriving: number | undefined;
swup.hooks.on('content:replace', () => {
  const html = document.documentElement;
  html.classList.remove('is-arriving');
  void html.offsetWidth; // restart the animations on quick successive visits
  html.classList.add('is-arriving');
  clearTimeout(arriving);
  arriving = window.setTimeout(() => html.classList.remove('is-arriving'), 800);
});
swup.hooks.on('page:view', mount);
