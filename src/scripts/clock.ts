import { studioTime, everyTick, clockAngles, secondsSince } from '../lib/time';

/**
 * Osmo "Analog Clock" markup and look; driven once per second from the studio time
 * (no animation-frame loop: nothing runs between ticks, and a hidden tab can't make it drift).
 * Returns a cleanup for page transitions.
 */
export function initClocks(): (() => void) | void {
  const clocks = [...document.querySelectorAll<HTMLElement>('[data-analog-clock-init]')].map((clock) => ({
    hour: clock.querySelector<HTMLElement>('[data-analog-clock-hour]')!,
    minute: clock.querySelector<HTMLElement>('[data-analog-clock-minute]')!,
    second: clock.querySelector<HTMLElement>('[data-analog-clock-second]')!,
  }));
  if (!clocks.length) return;
  let lastSecond: number | undefined;
  let secondRotation = 0; // keeps growing, so 59 → 0 turns forward instead of spinning back

  return everyTick(() => {
    const t = studioTime();
    const angle = clockAngles(t);
    const first = lastSecond === undefined;
    secondRotation = first ? angle.second : secondRotation + secondsSince(lastSecond!, t.s) * 6;
    lastSecond = t.s;
    clocks.forEach((c) => {
      c.hour.style.transform = `rotate(${angle.hour}deg)`;
      c.minute.style.transform = `rotate(${angle.minute}deg)`;
      if (first) c.second.style.transition = 'none'; // no sweep from 12 on load
      c.second.style.transform = `rotate(${secondRotation}deg)`;
      if (first) requestAnimationFrame(() => (c.second.style.transition = ''));
    });
    document.querySelectorAll('[data-clock-time]').forEach((el) => (el.textContent = `${t.hh}:${t.mm} (${t.zone})`));
  }, 1000);
}
