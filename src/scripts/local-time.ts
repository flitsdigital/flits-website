import { studioTime, everyTick } from '../lib/time';

/** "17:45 in Drenthe" in the footer (shell, outside #swup), ticking with every other clock on the page. Runs once. */
export function initLocalTime() {
  everyTick(() => {
    const { hh, mm } = studioTime();
    document.querySelectorAll<HTMLElement>('[data-local-time]').forEach((el) => {
      el.textContent = `${hh}:${mm} in ${el.dataset.region}`;
    });
  }, 1000);
}
