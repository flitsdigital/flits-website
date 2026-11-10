import { reducedMotion } from './media';

/** Small WAAPI helpers shared by the widgets. Curves come from tokens.css; reduced motion keeps the fades, drops the movement. */
const token = (name: string, fallback: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
export const easeOut = () => token('--ease-out', 'ease-out');
export const easeInOut = () => token('--ease-in-out', 'ease-in-out'); /* things moving on screen */

/**
 * Fades `el` in from `from` (a transform) in 240 ms. A second call while one runs simply starts over on
 * top, so fast clicks never queue up.
 */
export function enter(el: HTMLElement, from: string, delay = 0, duration = 240) {
  const move = !reducedMotion();
  el.animate(
    [move ? { opacity: 0, transform: from } : { opacity: 0 }, move ? { opacity: 1, transform: 'none' } : { opacity: 1 }],
    { duration, delay, easing: easeOut(), fill: 'backwards' },
  );
}

/**
 * Swaps an image without a flash: the new picture loads first, then a copy of the old one fades out on
 * top of it. Fading the new one in from 0 would show whatever is behind it (a white card) for a moment.
 */
export function crossfade(img: HTMLImageElement, src: string) {
  if (img.src === new URL(src, location.href).href) return;
  img.dataset.want = src;
  const next = new Image();
  next.src = src;
  next
    .decode()
    .catch(() => {})
    .then(() => {
      if (img.dataset.want !== src) return; // a newer swap came in while this one loaded
      const old = img.cloneNode() as HTMLImageElement;
      Object.keys(old.dataset).forEach((k) => delete old.dataset[k]);
      img.after(old);
      img.src = src;
      old.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, easing: easeOut() }).finished.finally(() => old.remove());
    });
}
