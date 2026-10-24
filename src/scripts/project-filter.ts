/** A project as the archive sees it (read from the card's data-attributes). */
export interface ArchiveItem {
  types: string[];
  sector: string;
  /** ms since epoch */
  date: number;
}

export interface ArchiveSelection {
  types: Set<string>;
  sectors: Set<string>;
  order: 'new' | 'old';
}

/**
 * Everything the /projecten archive shows for a selection, so the page script only applies it.
 * Filters: OR within a group, AND across groups ("Websites + Webshops" shows either; adding
 * "Horeca" narrows that to Horeca). An empty group does not filter.
 */
export function archiveView(items: ArchiveItem[], sel: ArchiveSelection) {
  const matches = (p: ArchiveItem) =>
    (sel.types.size === 0 || p.types.some((t) => sel.types.has(t))) && (sel.sectors.size === 0 || sel.sectors.has(p.sector));
  const dir = sel.order === 'old' ? 1 : -1;
  /** Item indexes in display order (hidden ones included, so the DOM keeps every card). */
  const order = items.map((_, i) => i).sort((a, b) => dir * (items[a].date - items[b].date));
  const visible = items.map(matches);
  // Every second *visible* card drops down, so the two columns stay staggered after filtering.
  const offset = items.map(() => false);
  order.filter((i) => visible[i]).forEach((i, n) => (offset[i] = n % 2 === 1));
  return {
    order,
    visible,
    offset,
    empty: !visible.some(Boolean),
    /** "Alles" is pressed when nothing narrows the list. */
    all: sel.types.size === 0 && sel.sectors.size === 0,
  };
}
