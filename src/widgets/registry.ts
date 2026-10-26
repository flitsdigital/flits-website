import { getCollection, type CollectionKey } from 'astro:content';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';
import type { Season, SlotSize } from '../lib/slots';
import { pools, fixed } from '../data/widgets';

/**
 * Every widget is one folder in src/widgets/<id>/: Widget.astro (markup), init.ts (`export function init()`,
 * started per page by scripts/app.ts), logic.ts (+ test) for pure rules, meta.ts for the slot system.
 * A folder with a meta.ts can be placed in widget slots; this file finds them all, so adding a widget
 * means adding a folder (and choosing its pools in src/data/widgets.ts). Server-side only.
 */
export type WidgetMeta = {
  /** Name on /widgets. */
  title: string;
  /** Without a size the widget is only placed by hand (clock, map), never in a slot. */
  size?: SlotSize;
  /** Only offered in this window (checked in the browser on the day itself). */
  season?: Season;
  /** Left out of every slot while this collection is empty (no empty cards). */
  collection?: CollectionKey;
  /** Extra build-time condition (e.g. PageSpeed needs a real score). */
  available?: () => Promise<boolean>;
};

const metas = import.meta.glob<{ meta: WidgetMeta }>('./*/meta.ts', { eager: true });
const components = import.meta.glob<{ default: AstroComponentFactory }>('./*/Widget.astro', { eager: true });
const idOf = (path: string) => path.split('/')[1];

export const widgetMeta: Record<string, WidgetMeta> = Object.fromEntries(Object.entries(metas).map(([p, m]) => [idOf(p), m.meta]));
export const widgetComponent = (id: string) => components[`./${id}/Widget.astro`]?.default;

/** Whether a widget has something real to show at build time. */
export async function isAvailable(id: string) {
  const meta = widgetMeta[id];
  if (!meta?.size || !widgetComponent(id)) return false;
  if (meta.collection && !(await getCollection(meta.collection)).length) return false;
  return meta.available ? meta.available() : true;
}

// The pools and per-page choices in src/data/widgets.ts must name real widgets of the right size.
for (const [size, ids] of Object.entries(pools)) {
  for (const id of ids) if (widgetMeta[id]?.size !== size) throw new Error(`src/data/widgets.ts: "${id}" is not a ${size} widget (see src/widgets/)`);
}
for (const [page, slots] of Object.entries(fixed)) {
  for (const id of Object.values(slots)) if (!widgetMeta[id]) throw new Error(`src/data/widgets.ts: unknown widget "${id}" fixed on ${page}`);
}
