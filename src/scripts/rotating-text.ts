import { gsap } from 'gsap';
import { osmo } from './radial-slider';

/**
 * Osmo "Rotating Text", adapted to the home hero's yellow bar: no SplitText line mask (the word box
 * masks instead, see HeroHome), the first word keeps the letter spans the entry animation uses,
 * widths are measured once the fonts are in, the site's Osmo curve instead of power4.inOut, per page
 * view with a cleanup (Swup), and it stays on the first word with reduced motion. Each word rolls
 * up out of the bar while the next rolls in.
 */
export function initRotatingText(): (() => void) | void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const spans = [...document.querySelectorAll<HTMLElement>('[data-rotating-words]')];
  if (!spans.length) return;
  let stopped = false;
  const calls: gsap.core.Tween[] = [];
  const targets: Element[] = [];

  spans.forEach((rotatingSpan) => {
    const stepDuration = parseFloat(rotatingSpan.getAttribute('data-step-duration') || '1.75');

    const rawWords = rotatingSpan.getAttribute('data-rotating-words') || '';
    const words = rawWords
      .split(',')
      .map((w) => w.trim())
      .filter(Boolean);

    if (words.length < 2) return;

    // Build inner wrapper with stacked words
    const wrapper = document.createElement('span');
    wrapper.className = 'rotating-text__inner';

    const wordEls = words.map((word, i) => {
      const el = document.createElement('span');
      el.className = 'rotating-text__word';
      // The first word is what's on screen: keep its letter spans (home entry animation)
      if (i === 0) el.append(...rotatingSpan.childNodes);
      else el.textContent = word;
      wrapper.appendChild(el);
      return el;
    });

    // Replace the original content of the highlight span
    rotatingSpan.textContent = '';
    rotatingSpan.appendChild(wrapper);
    targets.push(wrapper, ...wordEls);

    document.fonts.ready.then(() => {
      if (stopped) return;

      // Define duration of your in + out movement
      const inDuration = 0.75;
      const outDuration = 0.6;

      // Initial state: everyone hidden below
      gsap.set(wordEls, { yPercent: 150, autoAlpha: 0 });

      // Show first word immediately
      let activeIndex = 0;
      const firstWord = wordEls[activeIndex];
      gsap.set(firstWord, { yPercent: 0, autoAlpha: 1 });

      // Set initial width to first word
      const firstWidth = firstWord.getBoundingClientRect().width;
      wrapper.style.width = firstWidth + 'px';

      function showNext() {
        const nextIndex = (activeIndex + 1) % wordEls.length;
        const prev = wordEls[activeIndex];
        const current = wordEls[nextIndex];

        const targetWidth = current.getBoundingClientRect().width;

        // Animate wrapper width to match new word
        gsap.to(wrapper, {
          width: targetWidth,
          duration: inDuration,
          ease: osmo,
        });

        // Move old word out
        if (prev && prev !== current) {
          gsap.to(prev, {
            yPercent: -150,
            autoAlpha: 0,
            duration: outDuration,
            ease: osmo,
          });
        }

        // Reveal new word
        gsap.fromTo(
          current,
          { yPercent: 150, autoAlpha: 0 },
          {
            yPercent: 0,
            autoAlpha: 1,
            duration: inDuration,
            ease: osmo,
          },
        );

        activeIndex = nextIndex;

        calls.push(gsap.delayedCall(stepDuration, showNext));
      }

      // First word is already visible, start rotating after a full step
      calls.push(gsap.delayedCall(stepDuration, showNext));
    });
  });

  return () => {
    stopped = true;
    calls.forEach((c) => c.kill());
    gsap.killTweensOf(targets);
  };
}
