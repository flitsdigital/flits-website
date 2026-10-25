import type { WidgetId, SlotSize, Season } from '../lib/slots';

// Widget slots (src/components/molecules/WidgetSlot.astro). Jordi decides what goes where:
// - `pools`: what a slot may show; without a fixed choice it picks one at random on each visit.
// - `fixed`: per page path and slot id, the one widget that slot always shows.

export const widgets: Record<WidgetId, { size: SlotSize; season?: Season }> = {
  weather: { size: 'square' },
  spotify: { size: 'square' },
  pagespeed: { size: 'square' },
  christmas: { size: 'wide', season: { from: [12, 1], to: [12, 26] } },
  reviews: { size: 'wide' },
  stories: { size: 'wide' },
  office: { size: 'wide' },
  'studio-post': { size: 'wide' },
};

export const pools: Record<SlotSize, WidgetId[]> = {
  square: ['weather'],
  wide: [],
};

/** The slots on the site, for the overview on /widgets. */
export const slots: { id: string; size: SlotSize; where: string }[] = [
  { id: 'team', size: 'square', where: 'TeamSection (home, over ons), naast de eerste teamfoto' },
  { id: 'contact', size: 'square', where: 'ContactSection (contact, diensten), naast de klok' },
];

/** e.g. `'/contact': { contact: 'weather' }` */
export const fixed: Record<string, Record<string, WidgetId>> = {};
