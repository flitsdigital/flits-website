/** The studio in Emmen. */
const EMMEN = { lat: 52.78, lon: 6.91 };

/**
 * MET Norway locationforecast (free, also commercially, CC BY 4.0: "Weerdata: MET Norway"). Called only by
 * /api/weather, with an identifying User-Agent as their terms ask; the browser never talks to them.
 */
export const MET_URL = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${EMMEN.lat}&lon=${EMMEN.lon}`;

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

/** MET Norway symbol code ("partlycloudy_day", "lightrain", …) + temperature for frost → one of the photo skies. */
export function skyFor(symbol: string, temperature = 10): Sky {
  const s = symbol.replace(/_(day|night|polartwilight)$/, '');
  if (s.includes('thunder')) return 'onweer';
  if (s.includes('snow')) return 'sneeuw';
  if (s.includes('rain') || s.includes('sleet')) return 'regen'; // sleet: wet, reads as rain in NL
  if (s === 'fog') return 'mist';
  if (temperature <= 0) return 'vorst';
  return s === 'clearsky' || s === 'fair' ? 'helder' : s === 'partlycloudy' ? 'halfbewolkt' : 'bewolkt';
}

/** Is the sun up (incl. refraction) at this moment in Emmen? NOAA's short solar-position formulas. */
export function isDaylight(date: Date, { lat, lon } = EMMEN) {
  const rad = Math.PI / 180;
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const g = ((2 * Math.PI) / 365) * (Math.floor((date.getTime() - start) / 864e5) + (hours - 12) / 24);
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const hourAngle = ((hours * 60 + eqTime + 4 * lon) / 4 - 180) * rad;
  const cosZenith = Math.sin(lat * rad) * Math.sin(decl) + Math.cos(lat * rad) * Math.cos(decl) * Math.cos(hourAngle);
  return 90 - Math.acos(cosZenith) / rad > -0.833;
}

export type CurrentWeather = { temperature: number; symbol: string; isDay: boolean };

/** Now from a MET Norway response: the first time step; day/night from the symbol's suffix, else from the sun. */
export function currentFromMet(json: unknown, now: Date): CurrentWeather | null {
  type Step = { data?: { instant?: { details?: { air_temperature?: number } }; next_1_hours?: { summary?: { symbol_code?: string } } } };
  const step = (json as { properties?: { timeseries?: Step[] } })?.properties?.timeseries?.[0];
  const temperature = step?.data?.instant?.details?.air_temperature;
  const symbol = step?.data?.next_1_hours?.summary?.symbol_code;
  if (typeof temperature !== 'number' || !symbol) return null;
  const suffix = symbol.match(/_(day|night|polartwilight)$/)?.[1];
  return { temperature, symbol, isDay: suffix ? suffix !== 'night' : isDaylight(now) };
}

/** Daylight first, then the studio hour. */
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
export const weatherScene = (symbol: string, temperature: number, isDay: boolean, hour: number, month: number) =>
  scene(seasonFor(month), daypartFor(isDay, hour), skyFor(symbol, temperature));
