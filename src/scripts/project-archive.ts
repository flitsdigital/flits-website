import { gsap, ScrollTrigger } from './gsap';
import { reducedMotion } from './media';
import { easeInOut, easeOut } from './motion';
import { archiveView, type ArchiveSelection } from './project-filter';

/** DOM adapter for /projecten: reads the cards once, keeps the selection, applies archiveView(). */
export function initProjectArchive() {
  document.querySelectorAll<HTMLElement>('[data-project-archive]').forEach((root) => {
    const grid = root.querySelector<HTMLElement>('[data-archive-grid]')!;
    const empty = root.querySelector<HTMLElement>('[data-archive-empty]')!;
    const all = root.querySelector<HTMLButtonElement>('[data-filter-all]')!;
    const sort = root.querySelector<HTMLSelectElement>('[data-sort]')!;
    const chips = [...root.querySelectorAll<HTMLButtonElement>('[data-filter-type], [data-filter-sector]')];
    const cards = [...grid.children] as HTMLElement[];
    const items = cards.map((li) => ({
      types: li.dataset.types!.split(','),
      sector: li.dataset.sector!,
      date: Number(li.dataset.date),
    }));
    const sel: ArchiveSelection = { types: new Set(), sectors: new Set(), order: 'new' };
    const press = (btn: HTMLButtonElement, on: boolean) => {
      btn.setAttribute('aria-pressed', String(on));
      btn.classList.toggle('is-active', on);
    };

    // After a filter or sort: cards that stay glide from their old spot to the new one (250 ms), and only cards
    // that were hidden fade up, one after another (40 ms apart, at most 6 steps). Fading cards that never left
    // would make them blink. Cards the scroll reveal still owns (hidden, or mid-tween) are left to it.
    const moves = new Map<HTMLElement, Animation>();
    const measure = () => new Map(cards.map((li) => [li, li.hidden ? null : li.getBoundingClientRect()]));
    const settle = (before: Map<HTMLElement, DOMRect | null>) => {
      const still = reducedMotion();
      let n = 0;
      cards
        .filter((li) => !li.hidden && li.style.visibility !== 'hidden' && !gsap.isTweening(li))
        .sort((a, b) => a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
        .forEach((li) => {
          const was = before.get(li);
          if (!was) {
            const frames = still ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 0, transform: 'translateY(0.5rem)' }, { opacity: 1, transform: 'none' }];
            li.animate(frames, { duration: 200, delay: Math.min(n++, 6) * 40, easing: easeOut(), fill: 'backwards' });
            return;
          }
          const now = li.getBoundingClientRect();
          const dx = was.left - now.left;
          const dy = was.top - now.top;
          if (still || Math.abs(dx) + Math.abs(dy) < 1) return;
          moves.set(li, li.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 250, easing: easeInOut() }));
        });
    };

    let first = true;
    const apply = () => {
      sel.order = sort.value === 'old' ? 'old' : 'new'; // read every time: Firefox restores the select on reload
      const view = archiveView(items, sel);
      const before = measure(); // where each card is on screen now, mid-glide included
      moves.forEach((a) => a.cancel());
      moves.clear();
      grid.append(...view.order.map((i) => cards[i]));
      cards.forEach((li, i) => {
        li.hidden = !view.visible[i];
        li.classList.toggle('is-offset', view.offset[i]);
      });
      const wasEmpty = empty.hidden === false;
      empty.hidden = !view.empty;
      if (!first) {
        settle(before);
        if (view.empty && !wasEmpty) empty.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: easeOut() });
      }
      first = false;
      press(all, view.all);
      chips.forEach((c) => press(c, c.dataset.filterType ? sel.types.has(c.dataset.filterType) : sel.sectors.has(c.dataset.filterSector!)));
      ScrollTrigger.refresh(); // cards moved: the queued reveal re-measures where each one enters
    };

    chips.forEach((btn) =>
      btn.addEventListener('click', () => {
        const [set, value] = btn.dataset.filterType ? [sel.types, btn.dataset.filterType] : [sel.sectors, btn.dataset.filterSector!];
        set.has(value) ? set.delete(value) : set.add(value);
        apply();
      }),
    );
    all.addEventListener('click', () => {
      sel.types.clear();
      sel.sectors.clear();
      apply();
    });
    sort.addEventListener('change', apply);
    apply();
  });
}
