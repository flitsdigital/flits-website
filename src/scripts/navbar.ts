/**
 * Navbar (shell, outside #swup): mobile panel, Diensten dropdown (hover on desktop, click/tap/Enter,
 * Escape), close on page change (flits:navigate) and a background once the page scrolls. Runs once.
 */
export function initNavbar() {
  const header = document.querySelector<HTMLElement>('[data-nav-status]');
  if (!header) return;
  const mobile = window.matchMedia('(max-width: 991px)');
  const toggle = header.querySelector<HTMLButtonElement>('[data-nav-control="toggle"]')!;

  const setNav = (open: boolean) => {
    header.dataset.navStatus = open ? 'active' : 'not-active';
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Sluit navigatie' : 'Open navigatie');
  };
  toggle.addEventListener('click', () => setNav(header.dataset.navStatus !== 'active'));
  header.querySelectorAll('[data-nav-control="close"]').forEach((el) => el.addEventListener('click', () => setNav(false)));

  // Sub-dropdowns: hover opens on desktop (mouse); click/tap/Enter toggles; Escape closes.
  header.querySelectorAll<HTMLElement>('[data-nav-sub-status]').forEach((item) => {
    const control = item.querySelector<HTMLButtonElement>('[data-nav-sub-control="toggle"]')!;
    const setSub = (open: boolean) => {
      item.dataset.navSubStatus = open ? 'active' : 'not-active';
      control.setAttribute('aria-expanded', String(open));
    };
    item.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && !mobile.matches && setSub(true));
    item.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && !mobile.matches && setSub(false));
    // Older Safari reports no pointerType on click events, so remember it from pointerdown.
    let lastPointer = '';
    control.addEventListener('pointerdown', (e) => (lastPointer = e.pointerType));
    control.addEventListener('click', () => {
      // On desktop a mouse click lands on a menu that hover already opened.
      if (!mobile.matches && lastPointer === 'mouse') return;
      setSub(item.dataset.navSubStatus !== 'active');
    });
    item.addEventListener('focusout', (e) => {
      if (!mobile.matches && !item.contains(e.relatedTarget as Node)) setSub(false);
    });
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && item.dataset.navSubStatus === 'active') {
        e.stopPropagation();
        setSub(false);
        control.focus();
      }
    });
    // An accordion opened on mobile must not stay open as a desktop dropdown (and vice versa)
    mobile.addEventListener('change', () => setSub(false));
  });

  header.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.dataset.navStatus === 'active') {
      setNav(false);
      toggle.focus();
    }
  });
  // Crossing the breakpoint closes the panel so desktop never shows a stale state.
  mobile.addEventListener('change', () => setNav(false));
  // Page transition (src/scripts/app.ts): close the mobile panel and any dropdown.
  document.addEventListener('flits:navigate', () => {
    setNav(false);
    header.querySelectorAll<HTMLElement>('[data-nav-sub-status]').forEach((item) => {
      item.dataset.navSubStatus = 'not-active';
      item.querySelector('[data-nav-sub-control]')?.setAttribute('aria-expanded', 'false');
    });
  });

  // Bar gets a background once the page scrolls away from the dark hero.
  const onScroll = () => header.toggleAttribute('data-nav-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
