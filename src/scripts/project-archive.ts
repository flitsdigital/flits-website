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

    const apply = () => {
      sel.order = sort.value === 'old' ? 'old' : 'new'; // read every time: Firefox restores the select on reload
      const view = archiveView(items, sel);
      grid.append(...view.order.map((i) => cards[i]));
      cards.forEach((li, i) => {
        li.hidden = !view.visible[i];
        li.classList.toggle('is-offset', view.offset[i]);
      });
      empty.hidden = !view.empty;
      press(all, view.all);
      chips.forEach((c) => press(c, c.dataset.filterType ? sel.types.has(c.dataset.filterType) : sel.sectors.has(c.dataset.filterSector!)));
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
