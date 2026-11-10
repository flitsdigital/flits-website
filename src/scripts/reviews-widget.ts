import { reducedMotion } from './media';
import type { PageScope } from './page-scope';
import { showOnly } from './show-only';

/** Reviews widget: a new quote every 5 s (not with reduced motion), the dots jump, hover or focus pauses. */
export function initReviewsWidget(scope: PageScope) {
  const widgets = [...document.querySelectorAll<HTMLElement>('[data-reviews-widget]')];
  if (!widgets.length) return;
  const rotate = !reducedMotion();
  widgets.forEach((w) => {
    const quotes = [...w.querySelectorAll<HTMLElement>('[data-reviews-quote]')];
    const dots = [...w.querySelectorAll<HTMLButtonElement>('[data-reviews-dot]')];
    let at = 0;
    let paused = false;
    const show = (n: number) => {
      at = (n + quotes.length) % quotes.length;
      showOnly(quotes, at);
      dots.forEach((d, i) => d.setAttribute('aria-pressed', String(i === at)));
    };
    dots.forEach((d, i) => d.addEventListener('click', () => show(i)));
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    w.addEventListener('pointerenter', pause);
    w.addEventListener('pointerleave', resume);
    w.addEventListener('focusin', pause);
    w.addEventListener('focusout', resume);
    if (!rotate || quotes.length < 2) return;
    const timer = window.setInterval(() => !paused && show(at + 1), 5000);
    scope.add(() => clearInterval(timer));
  });
}
