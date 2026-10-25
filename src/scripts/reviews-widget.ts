/** Reviews widget: a new quote every 5 s, the dots jump, hover or focus pauses. */
export function initReviewsWidget(): (() => void) | void {
  const widgets = [...document.querySelectorAll<HTMLElement>('[data-reviews-widget]')];
  if (!widgets.length) return;
  const timers = widgets.map((w) => {
    const quotes = [...w.querySelectorAll<HTMLElement>('[data-reviews-quote]')];
    const dots = [...w.querySelectorAll<HTMLButtonElement>('[data-reviews-dot]')];
    let at = 0;
    let paused = false;
    const show = (n: number) => {
      at = (n + quotes.length) % quotes.length;
      quotes.forEach((q, i) => {
        q.classList.toggle('is-active', i === at);
        q.toggleAttribute('aria-hidden', i !== at);
      });
      dots.forEach((d, i) => d.setAttribute('aria-pressed', String(i === at)));
    };
    dots.forEach((d, i) => d.addEventListener('click', () => show(i)));
    const pause = () => (paused = true);
    const resume = () => (paused = false);
    w.addEventListener('pointerenter', pause);
    w.addEventListener('pointerleave', resume);
    w.addEventListener('focusin', pause);
    w.addEventListener('focusout', resume);
    return quotes.length > 1 ? window.setInterval(() => !paused && show(at + 1), 5000) : 0;
  });
  return () => timers.forEach(clearInterval);
}
