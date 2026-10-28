/**
 * Osmo "Check Section Theme on Scroll", unchanged except: typed, started per page view from app.ts
 * (Swup: new sections every page) with a cleanup, and a fallback: where no [data-theme-section]
 * is under the nav, the theme is "light" (the page background), so only dark sections need marking.
 */
export function initCheckSectionThemeScroll(): () => void {
  let ticking = false;
  let currentTheme: string | null = null;
  let currentBg: string | null = null;

  // Get detection offset, in this case the navbar
  const navBarHeight = document.querySelector<HTMLElement>('[data-nav-bar-height]');
  const themeObserverOffset = navBarHeight ? navBarHeight.offsetHeight / 2 : 0;

  const themeSections = document.querySelectorAll('[data-theme-section]');
  const themeNavElements = document.querySelectorAll('[data-theme-nav]');
  const bgNavElements = document.querySelectorAll('[data-bg-nav]');

  function updateElements(elements: NodeListOf<Element>, attribute: string, value: string) {
    elements.forEach((el) => {
      el.setAttribute(attribute, value);
    });
  }

  function checkThemeSection() {
    let found = false;
    for (const themeSection of themeSections) {
      const rect = themeSection.getBoundingClientRect();
      const themeSectionTop = rect.top;
      const themeSectionBottom = rect.bottom;

      // If the offset is between the top & bottom of the current section
      if (themeSectionTop <= themeObserverOffset && themeSectionBottom >= themeObserverOffset) {
        const themeSectionActive = themeSection.getAttribute('data-theme-section')!;
        const bgSectionActive = themeSection.getAttribute('data-bg-section');

        if (themeSectionActive !== currentTheme) {
          updateElements(themeNavElements, 'data-theme-nav', themeSectionActive);
          currentTheme = themeSectionActive;
        }

        if (bgSectionActive && bgSectionActive !== currentBg) {
          updateElements(bgNavElements, 'data-bg-nav', bgSectionActive);
          currentBg = bgSectionActive;
        }

        found = true;
        break;
      }
    }

    if (!found && currentTheme !== 'light') {
      updateElements(themeNavElements, 'data-theme-nav', 'light');
      currentTheme = 'light';
    }

    ticking = false;
  }

  const onChange = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(checkThemeSection);
    }
  };
  window.addEventListener('scroll', onChange, { passive: true });
  window.addEventListener('resize', onChange);

  checkThemeSection();

  return () => {
    window.removeEventListener('scroll', onChange);
    window.removeEventListener('resize', onChange);
  };
}
