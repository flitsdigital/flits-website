import { studioNow } from '../lib/time';
import { candidates, inSeason, pickSlot, type Season, type WidgetId } from '../lib/slots';

/**
 * Picks what each unfixed widget slot shows on this visit: a random in-season widget from its pool.
 * Runs first in pageInits, so a widget swapped in from its <template> is started by its own init.
 */
export function initWidgetSlots() {
  const slots = document.querySelectorAll<HTMLElement>('[data-widget-slot]');
  if (!slots.length) return;
  const parts = studioNow();
  slots.forEach((slot) => {
    const seasons: Partial<Record<WidgetId, Season>> = JSON.parse(slot.dataset.slotSeasons ?? '{}');
    const current = slot.dataset.slotCurrent as WidgetId | ''; // '' = only seasonal widgets, nothing rendered yet
    const options = [...slot.querySelectorAll<HTMLTemplateElement>('template[data-slot-option]')];
    const ids = [...(current ? [current] : []), ...options.map((o) => o.dataset.slotOption as WidgetId)];
    const fit = candidates(ids, (w) => inSeason(seasons[w], parts.month, parts.day));
    if (!fit.length) return slot.remove(); // nothing in season: no empty hole
    const pick = pickSlot({ candidates: fit, fallback: fit[0], random: Math.random });
    if (pick === current) return;
    const content = options.find((o) => o.dataset.slotOption === pick)!.content.cloneNode(true);
    if (current) slot.firstElementChild!.replaceWith(content);
    else slot.prepend(content);
    slot.dataset.slotCurrent = pick;
    slot.hidden = false;
  });
}
