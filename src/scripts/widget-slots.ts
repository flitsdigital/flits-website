import { TIME_ZONE } from '../lib/time';
import { candidates, inSeason, slotWidget, type Season, type WidgetId } from '../lib/slots';

const monthDay = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, month: 'numeric', day: 'numeric' });

/**
 * Picks what each unfixed widget slot shows on this visit: a random in-season widget from its pool.
 * Runs first in pageInits, so a widget swapped in from its <template> is started by its own init.
 */
export function initWidgetSlots() {
  const slots = document.querySelectorAll<HTMLElement>('[data-widget-slot]');
  if (!slots.length) return;
  const parts = Object.fromEntries(monthDay.formatToParts(new Date()).map((p) => [p.type, Number(p.value)]));
  slots.forEach((slot) => {
    const seasons: Partial<Record<WidgetId, Season>> = JSON.parse(slot.dataset.slotSeasons ?? '{}');
    const current = slot.dataset.slotCurrent as WidgetId | ''; // '' = nothing rendered yet (seasonal fallback)
    const fallback = slot.dataset.slotFallback as WidgetId;
    const options = [...slot.querySelectorAll<HTMLTemplateElement>('template[data-slot-option]')];
    const ids = [...(current ? [current] : []), ...options.map((o) => o.dataset.slotOption as WidgetId)];
    const fits = (w: WidgetId) => inSeason(seasons[w], parts.month, parts.day);
    const pick = slotWidget({ candidates: candidates(ids, fits), fallback, fallbackAvailable: fits(fallback), random: Math.random });
    if (pick === null) return slot.remove(); // nothing in season: no empty hole
    if (pick === current) return;
    const content = options.find((o) => o.dataset.slotOption === pick)!.content.cloneNode(true);
    if (current) slot.firstElementChild!.replaceWith(content);
    else slot.prepend(content);
    slot.dataset.slotCurrent = pick;
    slot.hidden = false;
  });
}
