import type { PageScope } from './page-scope';

/**
 * Osmo "Check Section Theme on Scroll", unchanged except: typed, started per page view from app.ts
 * (Swup: new sections every page) with a cleanup, and a fallback: where no [data-theme-section]
 * is under the nav, the theme is "light" (the page background), so only dark sections need marking.
 */
export function initCheckSectionThemeScroll(scope: PageScope) {
  let ticking = false;
  let currentTheme: string | null = null;

  // Get detection offset, in this case the navbar
  const navBarHeight = document.querySelector<HTMLElement>('[data-nav-bar-height]');
  const themeObserverOffset = navBarHeight ? navBarHeight.offsetHeight / 2 : 0;

  const themeSections = document.querySelectorAll('[data-theme-section]');
  const themeNavElements = document.querySelectorAll('[data-theme-nav]');

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

        if (themeSectionActive !== currentTheme) {
          updateElements(themeNavElements, 'data-theme-nav', themeSectionActive);
          currentTheme = themeSectionActive;
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
      scope.frame(checkThemeSection);
    }
  };
  window.addEventListener('scroll', onChange, { passive: true, signal: scope.signal });
  window.addEventListener('resize', onChange, { signal: scope.signal });

  checkThemeSection();
}
