import { gsap } from 'gsap';

/**
 * Osmo "Animated Grid Overlay (Columns)", unchanged except: GSAP from npm, typed, storage wrapped
 * (it can throw in private windows), and only the Shift+G shortcut (no toggle buttons on the site).
 * Added: while the grid is open, the hovered element gets a Figma-style box with its size.
 * Runs once: the overlay lives outside the Swup container.
 */
export function initAnimatedGrid() {
  const grid = document.querySelector('[data-animated-grid]');
  const cols = document.querySelectorAll('[data-animated-grid-col]');

  if (!grid || !cols.length) return;

  const storageKey = 'animatedGridState';
  const read = () => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };
  const write = (v: string) => {
    try {
      localStorage.setItem(storageKey, v);
    } catch {
      /* private window: the state just isn't remembered */
    }
  };
  let isOpen = read() === 'open';

  // Figma-style box around whatever the mouse is over, while the grid is open
  const inspect = document.querySelector<HTMLElement>('[data-grid-inspect]');
  const inspectSize = inspect?.querySelector<HTMLElement>('[data-grid-inspect-size]');
  let hovered: Element | null = null;
  function placeInspect() {
    if (!inspect || !inspectSize) return;
    const skip = !isOpen || !hovered || hovered === document.body || hovered === document.documentElement;
    inspect.hidden = skip;
    if (skip) return;
    const r = hovered!.getBoundingClientRect();
    Object.assign(inspect.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' });
    inspectSize.textContent = `${Math.round(r.width)} × ${Math.round(r.height)}`;
  }
  document.addEventListener('mouseover', (e) => {
    hovered = e.target as Element;
    placeInspect();
  });
  window.addEventListener('scroll', placeInspect, { passive: true });
  window.addEventListener('resize', placeInspect);

  gsap.set(grid, { display: 'block' });

  if (isOpen) {
    gsap.set(cols, { yPercent: 0 });
  } else {
    gsap.set(cols, { yPercent: 100 });
  }

  function openGrid() {
    isOpen = true;
    write('open');
    placeInspect();

    gsap.fromTo(
      cols,
      { yPercent: 100 },
      { yPercent: 0, duration: 1, ease: 'expo.inOut', stagger: { each: 0.03, from: 'start' }, overwrite: true },
    );
  }

  function closeGrid() {
    isOpen = false;
    write('closed');
    placeInspect();

    gsap.fromTo(
      cols,
      { yPercent: 0 },
      { yPercent: -100, duration: 1, ease: 'expo.inOut', stagger: { each: 0.03, from: 'start' }, overwrite: true },
    );
  }

  function toggleGrid() {
    if (isOpen) closeGrid();
    else openGrid();
  }

  function isTypingContext(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
  }

  window.addEventListener('keydown', (e) => {
    if (isTypingContext(e)) return;
    if (!(e.shiftKey && (e.key || '').toLowerCase() === 'g')) return;
    e.preventDefault();
    toggleGrid();
  });
}

/**
 * Dev only: window.__gridAudit() lists every block whose left or right edge sits in a gutter
 * (between column edges) instead of on a column line. Only the outermost box per problem is listed;
 * content-hugging UI (buttons, pills, eyebrows, inline boxes), media inside a box, tilted or
 * decorative pieces, the navbar and the footer are skipped; so is everything inside a card: the card
 * is what sits on the grid.
 */
if (import.meta.env.DEV) {
  (window as unknown as { __gridAudit: () => unknown }).__gridAudit = () => {
    const probe = (v: string) => {
      const d = document.createElement('div');
      d.style.cssText = `position:absolute;visibility:hidden;width:${v}`;
      document.body.append(d);
      const w = d.getBoundingClientRect().width;
      d.remove();
      return w;
    };
    const gw = probe('var(--grid-width)');
    const col = probe('var(--grid-col)');
    const gap = probe('var(--grid-gap)');
    const n = +getComputedStyle(document.documentElement).getPropertyValue('--grid-columns');
    const left0 = (document.documentElement.clientWidth - gw) / 2;
    const edges: number[] = [];
    for (let i = 0; i < n; i++) edges.push(left0 + i * (col + gap), left0 + i * (col + gap) + col);
    const onEdge = (x: number) => x <= left0 + 1.5 || x >= left0 + gw - 1.5 || edges.some((e) => Math.abs(e - x) < 1.5);
    const off = (x: number) => Math.round(x - edges.reduce((a, b) => (Math.abs(b - x) < Math.abs(a - x) ? b : a)));
    const label = (el: Element) => {
      const cls = [...el.classList].filter((c) => !c.startsWith('astro-')).slice(0, 2).join('.');
      return cls ? '.' + cls : el.tagName.toLowerCase();
    };
    const skip =
      '[data-animated-grid],[data-grid-inspect],.bg-shapes,.progressive-blur,[aria-hidden="true"],.nav,.radial-slider,.fan,[data-trail-collection],.cursor-marquee,footer,.footer,' +
      // content-hugging UI: like a button, it sits inside a block that is on the grid
      '.btn,.pill,.eyebrow,.breadcrumb,.reviews__rating,.case-hero__meta,.case-intro__services,.archive__filters,.archive__sort';
    const cards =
      '.project-card,.service-card,.team-card,.stat-card,.feature-card,.step-card,.review-card,.faq-item,.contact-form,.weather,.clock,.map,.logo-grid__tiles > li';
    const bad = (el: Element) => {
      if (el.closest(skip)) return null;
      if (el.parentElement?.closest(cards)) return null;
      const st = getComputedStyle(el);
      if (/^inline/.test(st.display) || st.display === 'none' || st.display === 'contents' || st.position === 'fixed' || st.position === 'absolute') return null;
      if (/^(IMG|PICTURE|VIDEO|SVG|SOURCE)$/i.test(el.tagName)) return null;
      if (st.transform !== 'none' || st.rotate !== 'none') return null; // tilted things can't sit on columns
      const r = el.getBoundingClientRect();
      if (r.width < 100 || r.height < 8) return null;
      if (r.left <= left0 + 1.5 && r.right >= left0 + gw - 1.5) return null;
      const l = onEdge(r.left);
      const rr = onEdge(r.right);
      return l && rr ? null : { r, l, rr };
    };
    const out: string[] = [];
    document.querySelectorAll('body *').forEach((el) => {
      const b = bad(el);
      if (!b) return;
      // only the outermost box with this problem: skip when the parent is off on the same edge
      const p = el.parentElement && bad(el.parentElement);
      if (p && (!b.l ? Math.abs(p.r.left - b.r.left) < 1.5 : true) && (!b.rr ? Math.abs(p.r.right - b.r.right) < 1.5 : true)) return;
      out.push(`${label(el.parentElement!)} > ${label(el)} ${Math.round(b.r.width)}w${b.l ? '' : ' L' + off(b.r.left)}${b.rr ? '' : ' R' + off(b.r.right)}`);
    });
    return { page: location.pathname, width: document.documentElement.clientWidth, grid: [Math.round(col), Math.round(gap), n], off: [...new Set(out)] };
  };
}
