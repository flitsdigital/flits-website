import { band, type PageSpeed } from './logic';
import { shortDate } from '../../lib/time';

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * PageSpeed widget: when it comes into view, asks /api/pagespeed for the latest score (cached a day on the CDN)
 * and counts the ring up to it; a stale answer keeps the score the page was built with. Mobiel/Desktop toggles.
 */
export function init(): (() => void) | void {
  const widgets = [...document.querySelectorAll<HTMLElement>('[data-pagespeed]')];
  if (!widgets.length) return;
  const frames = new Set<number>();
  const observers: IntersectionObserver[] = [];

  widgets.forEach((w) => {
    const gauge = w.querySelector<HTMLElement>('[data-speed-gauge]')!;
    const arc = w.querySelector<SVGCircleElement>('[data-speed-arc]')!;
    const num = w.querySelector<HTMLElement>('[data-speed-num]')!;
    const buttons = [...w.querySelectorAll<HTMLButtonElement>('[data-speed-device]')];
    let device: 'mobile' | 'desktop' = 'mobile';

    const set = (v: number) => {
      arc.style.strokeDashoffset = String(100 - v);
      num.textContent = String(Math.round(v));
      gauge.dataset.band = band(v);
    };
    const show = () => {
      const raw = w.dataset[device];
      if (!raw) return; // no score yet: keep "—"
      const to = Number(raw);
      gauge.setAttribute('aria-label', `PageSpeed-score ${to} van 100`);
      if (reduce()) return set(to);
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / 1400);
        set(to * (1 - (1 - t) ** 3));
        if (t < 1) frames.add(requestAnimationFrame(tick));
      };
      frames.add(requestAnimationFrame(tick));
    };

    buttons.forEach((b) =>
      b.addEventListener('click', () => {
        device = b.dataset.speedDevice as 'mobile' | 'desktop';
        buttons.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
        show();
      }),
    );

    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        fetch('/api/pagespeed')
          .then((r) => (r.ok ? (r.json() as Promise<PageSpeed>) : Promise.reject()))
          .then((r) => {
            if (r.stale) return;
            w.dataset.mobile = String(r.mobile ?? '');
            w.dataset.desktop = String(r.desktop ?? '');
            w.querySelector('[data-speed-when]')!.textContent = `gemeten op ${shortDate(new Date(r.measuredAt))}`;
          })
          .catch(() => {})
          .finally(show);
      },
      { threshold: 0.6 },
    );
    io.observe(w);
    observers.push(io);
  });

  return () => {
    observers.forEach((o) => o.disconnect());
    frames.forEach(cancelAnimationFrame);
  };
}
