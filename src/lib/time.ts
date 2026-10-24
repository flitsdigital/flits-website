/** The studio is in Emmen; all live clocks show Dutch time. */
export const TIME_ZONE = 'Europe/Amsterdam';

// One formatter for every live clock on the site (footer, clock widget). Runs in the browser.
const formatter = new Intl.DateTimeFormat('nl-NL', {
  timeZone: TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  timeZoneName: 'short',
});

/** Local time parts for the studio's time zone, e.g. { hh: '09', mm: '05', h: 9, m: 5, s: 30, zone: 'CEST' }. */
export function studioTime(date = new Date()) {
  const parts = Object.fromEntries(formatter.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    hh: parts.hour,
    mm: parts.minute,
    h: Number(parts.hour),
    m: Number(parts.minute),
    s: Number(parts.second),
    zone: parts.timeZoneName,
  };
}

/**
 * Calls `fn` now and then on every whole multiple of `ms` (whole seconds for 1000), so every clock on
 * the page changes at the same moment and a tick never lands twice in one second. Returns a stop function.
 */
export function everyTick(fn: () => void, ms: number) {
  let id: ReturnType<typeof setTimeout>;
  const tick = () => {
    fn();
    id = setTimeout(tick, ms - (Date.now() % ms));
  };
  tick();
  return () => clearTimeout(id);
}

/** Rotation in degrees for each hand of an analog clock. */
export const clockAngles = ({ h, m, s }: { h: number; m: number; s: number }) => ({
  hour: ((h % 12) + m / 60) * 30,
  minute: (m + s / 60) * 6,
  second: s * 6,
});

/** Seconds from `prev` to `now` on a 0–59 dial (59 → 0 is 1; a 30 s pause is 30). */
export const secondsSince = (prev: number, now: number) => (now - prev + 60) % 60;
