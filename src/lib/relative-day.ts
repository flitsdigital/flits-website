import { TIME_ZONE } from './time.ts';

const ymd = (date: Date, timeZone: string) => new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
/** Calendar days between two dates in the given zone (b − a). */
const dayDiff = (a: Date, b: Date, timeZone: string) => Math.round((Date.parse(ymd(b, timeZone)) - Date.parse(ymd(a, timeZone))) / 864e5);

export const isToday = (date: Date, today: Date, timeZone = TIME_ZONE) => dayDiff(date, today, timeZone) <= 0;

/** "foto van vandaag", "foto van 3 dagen geleden", "foto van 3 okt". */
export const photoLabel = (date: Date, today: Date, timeZone = TIME_ZONE) => `foto van ${relativeDay(date, today, timeZone).replace(/^op /, '')}`;

/** "vandaag", "gisteren", "3 dagen geleden" (2–13 days), else "op 3 okt". A future date counts as today. */
export function relativeDay(date: Date, today: Date, timeZone = TIME_ZONE): string {
  const days = dayDiff(date, today, timeZone);
  if (days <= 0) return 'vandaag';
  if (days === 1) return 'gisteren';
  if (days < 14) return `${days} dagen geleden`;
  return `op ${new Intl.DateTimeFormat('nl-NL', { timeZone, day: 'numeric', month: 'short' }).format(date).replace('.', '')}`;
}
