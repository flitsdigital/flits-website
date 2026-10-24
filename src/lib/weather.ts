/** Open-Meteo "current" for the studio in Emmen; free, no key, CORS-enabled. */
export const WEATHER_URL =
  'https://api.open-meteo.com/v1/forecast?latitude=52.78&longitude=6.91&current=temperature_2m,weather_code,is_day&timezone=Europe%2FAmsterdam';

export type Season = 'lente' | 'zomer' | 'herfst' | 'winter';
export type Daypart = 'ochtend' | 'middag' | 'avond' | 'nacht';
export type Sky = 'helder' | 'halfbewolkt' | 'bewolkt' | 'regen' | 'onweer' | 'sneeuw' | 'mist' | 'vorst';

export const seasons: Season[] = ['lente', 'zomer', 'herfst', 'winter'];
export const dayparts: Daypart[] = ['ochtend', 'middag', 'avond', 'nacht'];

// What the trees in Emmen look like: blossom/young leaf Apr–May, full leaf Jun–Sep, colour Oct–Nov, bare Dec–Mar.
const seasonByMonth: Season[] = ['winter', 'winter', 'winter', 'lente', 'lente', 'zomer', 'zomer', 'zomer', 'zomer', 'herfst', 'herfst', 'winter'];

/** Snow and frost only exist as winter photos, thunder only as summer ones. */
const fixedSeason: Partial<Record<Sky, Season>> = { sneeuw: 'winter', vorst: 'winter', onweer: 'zomer' };

const labels: Record<Sky, string | Partial<Record<Daypart, string>> & { default: string }> = {
  helder: { default: 'Lekker zonnetje', ochtend: 'Zonnige start', avond: 'Gouden avond', nacht: 'Heldere nacht' },
  halfbewolkt: { default: 'Af en toe zon', nacht: 'Wolkjes en sterren' },
  bewolkt: 'Grijs, maar droog',
  regen: 'Paraplu mee',
  onweer: 'Donder en bliksem',
  sneeuw: 'Witte wereld',
  mist: 'Mistig in Emmen',
  vorst: { default: 'Het vriest', ochtend: 'Ruiten krabben' },
};

/** WMO weather code (+ temperature for frost) → one of the photo skies. */
export function skyFor(code: number, temperature = 10): Sky {
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'sneeuw';
  if (code >= 95) return 'onweer';
  if (code === 45 || code === 48) return 'mist';
  if (code > 3) return 'regen';
  if (temperature <= 0) return 'vorst';
  return code <= 1 ? 'helder' : code === 2 ? 'halfbewolkt' : 'bewolkt';
}

/** Daylight first (Open-Meteo's is_day), then the studio hour. */
export const daypartFor = (isDay: boolean, hour: number): Daypart =>
  !isDay ? 'nacht' : hour < 12 ? 'ochtend' : hour < 18 ? 'middag' : 'avond';

export const seasonFor = (month: number): Season => seasonByMonth[month - 1];

/** Photo key ("herfst-ochtend-regen") and label for one combination. */
export function scene(season: Season, daypart: Daypart, sky: Sky) {
  const l = labels[sky];
  return {
    key: `${fixedSeason[sky] ?? season}-${daypart}-${sky}`,
    label: typeof l === 'string' ? l : (l[daypart] ?? l.default),
  };
}

/** Every photo the widget can show, in display order (season rows first, then the fixed-season skies). */
export const allScenes = () => [
  ...seasons.flatMap((s) => (['helder', 'halfbewolkt', 'bewolkt', 'regen', 'mist'] as Sky[]).flatMap((k) => dayparts.map((d) => ({ season: s, daypart: d, sky: k, ...scene(s, d, k) })))),
  ...(['sneeuw', 'vorst', 'onweer'] as Sky[]).flatMap((k) => dayparts.map((d) => ({ season: fixedSeason[k]!, daypart: d, sky: k, ...scene(fixedSeason[k]!, d, k) }))),
];

/** Scene for the live weather. `hour` and `month` are studio (Amsterdam) time. */
export const weatherScene = (code: number, temperature: number, isDay: boolean, hour: number, month: number) =>
  scene(seasonFor(month), daypartFor(isDay, hour), skyFor(code, temperature));
