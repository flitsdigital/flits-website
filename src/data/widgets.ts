import type { WidgetId, SlotSize } from '../lib/slots';

// Widget slots (src/components/molecules/WidgetSlot.astro). Jordi decides what goes where:
// - `pools`: what a slot may show; without a fixed choice it picks one at random on each visit.
// - `fixed`: per page path and slot id, the one widget that slot always shows.
// The widgets themselves (size, season, content they need) live in src/widgets/<id>/meta.ts;
// src/widgets/registry.ts checks that every id here exists and has the right size.

export const pools: Record<SlotSize, WidgetId[]> = {
  square: ['weather', 'spotify', 'pagespeed'],
  wide: ['reviews', 'office', 'stories', 'studio-post'],
};

/** The slots on the site, for the overview on /widgets. */
export const slots: { id: string; size: SlotSize; where: string }[] = [
  { id: 'team', size: 'square', where: 'TeamSection (home, over ons), naast de eerste teamfoto' },
  { id: 'contact', size: 'square', where: 'ContactSection (contact, diensten), naast de klok' },
  { id: 'contact-wide', size: 'wide', where: 'ContactSection, onder de klok (alleen als er iets in seizoen is)' },
];

/** e.g. `'/contact': { contact: 'weather' }` */
export const fixed: Record<string, Record<string, WidgetId>> = {};
