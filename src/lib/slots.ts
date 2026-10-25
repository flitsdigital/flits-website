export type WidgetId = 'weather' | 'spotify' | 'pagespeed' | 'christmas' | 'reviews' | 'stories' | 'office' | 'studio-post';
export type SlotSize = 'square' | 'wide';
/** [month, day], inclusive on both ends; `to` before `from` wraps the new year. */
export type Season = { from: readonly [number, number]; to: readonly [number, number] };

const ord = ([m, d]: readonly [number, number]) => m * 100 + d;

/** Whether a month/day falls in the season; no season means always. */
export function inSeason(season: Season | undefined, month: number, day: number) {
  if (!season) return true;
  const today = month * 100 + day;
  const from = ord(season.from);
  const to = ord(season.to);
  return from <= to ? today >= from && today <= to : today >= from || today <= to;
}

export const candidates = (pool: WidgetId[], isAvailable: (id: WidgetId) => boolean) => pool.filter(isAvailable);

/** Like pickSlot, but null when nothing fits (e.g. only Christmas in the pool, in November): the slot is then left out. */
export function slotWidget(opts: { fixed?: WidgetId; candidates: WidgetId[]; fallback: WidgetId; fallbackAvailable: boolean; random: () => number }): WidgetId | null {
  if (!opts.fixed && !opts.candidates.length && !opts.fallbackAvailable) return null;
  return pickSlot(opts);
}

/** The widget a slot shows: the page's fixed choice, else a random candidate, else the fallback. */
export function pickSlot({ fixed, candidates, fallback, random }: { fixed?: WidgetId; candidates: WidgetId[]; fallback: WidgetId; random: () => number }): WidgetId {
  if (fixed) return fixed;
  if (!candidates.length) return fallback;
  return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))];
}
