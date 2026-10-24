/**
 * Osmo "Accordion CSS Animation": the script only flips data-accordion-status (plus aria-expanded
 * on the button); the CSS animates grid-template-rows 0fr → 1fr. With
 * [data-accordion-close-siblings="true"] opening one item closes the others.
 * Returns a cleanup for page transitions.
 */
export function initAccordions(): (() => void) | void {
  const accordions = [...document.querySelectorAll<HTMLElement>('[data-accordion-css-init]')];
  if (!accordions.length) return;

  const setStatus = (item: Element, active: boolean) => {
    item.setAttribute('data-accordion-status', active ? 'active' : 'not-active');
    item.querySelector('[data-accordion-toggle]')?.setAttribute('aria-expanded', String(active));
  };

  const onClick = (event: MouseEvent) => {
    const accordion = event.currentTarget as HTMLElement;
    const toggle = (event.target as Element).closest('[data-accordion-toggle]');
    if (!toggle) return;
    const item = toggle.closest('[data-accordion-status]');
    if (!item) return;

    const isActive = item.getAttribute('data-accordion-status') === 'active';
    setStatus(item, !isActive);

    if (accordion.getAttribute('data-accordion-close-siblings') === 'true' && !isActive) {
      accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
        if (sibling !== item) setStatus(sibling, false);
      });
    }
  };

  accordions.forEach((a) => a.addEventListener('click', onClick));
  return () => accordions.forEach((a) => a.removeEventListener('click', onClick));
}
