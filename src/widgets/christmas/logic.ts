/** Whole days from the studio date (Amsterdam) to Christmas Day; 0 on 25 and 26 Dec, then next year's. */
export function daysUntilChristmas(year: number, month: number, day: number) {
  const today = Date.UTC(year, month - 1, day);
  if (month === 12 && day >= 25) return day <= 26 ? 0 : (Date.UTC(year + 1, 11, 25) - today) / 864e5;
  return (Date.UTC(year, 11, 25) - today) / 864e5;
}

/** Office photo stage 0–12: empty before December, one step every two days, full from 23 Dec. */
export const christmasStage = (month: number, day: number) => (month !== 12 ? 0 : Math.min(12, Math.ceil(day / 2)));

/** December evenings: dark before 8:00 and from 17:00. */
export const isDark = (hour: number) => hour < 8 || hour >= 17;

export const christmasLabel = (days: number) => (days === 0 ? 'Vrolijk kerstfeest' : days === 1 ? 'Dag tot kerst' : 'Dagen tot kerst');

/**
 * Photo key for a stage ("nacht-06"), falling back to the nearest earlier stage and then to daylight
 * while not every photo exists yet. `available` holds the keys of the photos that do.
 */
export function christmasPhoto(stage: number, dark: boolean, available: Set<string>) {
  for (const time of dark ? ['nacht', 'dag'] : ['dag']) {
    for (let s = stage; s >= 0; s--) {
      const key = `${time}-${String(s).padStart(2, '0')}`;
      if (available.has(key)) return key;
    }
  }
  return undefined;
}
