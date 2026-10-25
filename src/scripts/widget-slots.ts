import { TIME_ZONE } from '../lib/time';
import { candidates, inSeason, pickSlot, type Season, type WidgetId } from '../lib/slots';

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
    const current = slot.dataset.slotCurrent as WidgetId;
    const options = [...slot.querySelectorAll<HTMLTemplateElement>('template[data-slot-option]')];
    const ids = [current, ...options.map((o) => o.dataset.slotOption as WidgetId)];
    const pick = pickSlot({ candidates: candidates(ids, (w) => inSeason(seasons[w], parts.month, parts.day)), fallback: current, random: Math.random });
    if (pick === current) return;
    const shown = slot.firstElementChild!;
    shown.replaceWith(options.find((o) => o.dataset.slotOption === pick)!.content.cloneNode(true));
    slot.dataset.slotCurrent = pick;
  });
}
