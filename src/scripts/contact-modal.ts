import { reducedMotion } from './media';
import { easeOut } from './motion';
import { sendLead } from './send-lead';

/**
 * The "Start een project" modal (ContactModal.astro): every link to /contact opens it instead of the
 * page ("Klik dan hier" and links marked data-no-modal still go there). Start (name, e-mail) → 01
 * services → 02 the project → 03 phone (optional); VOLGENDE stays off on 01 until a service is
 * chosen, and on Start the browser checks the required fields.
 * Versturen posts to /api/contact (send-lead.ts); only when that fails does the mail app open.
 * Runs once: the modal lives outside the Swup container.
 */
export function initContactModal() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-contact-modal]');
  if (!dialog) return;
  const form = dialog.querySelector('form')!;
  const panels = [...dialog.querySelectorAll<HTMLElement>('[data-step]')];
  const dots = [...dialog.querySelectorAll('[data-step-indicator] li')];
  const prev = dialog.querySelector<HTMLButtonElement>('[data-contact-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-contact-next]')!;
  const nextLabel = next.querySelector('.btn__label')!;
  const last = 3;
  let step: number | 'done' = 0;

  const panel = (s: number | 'done') => panels.find((p) => p.dataset.step === String(s))!;

  function update() {
    const chose = !!form.querySelector('[name="services"]:checked');
    prev.disabled = step === 0 || step === 'done';
    next.disabled = step === 1 && !chose;
    nextLabel.textContent = step === 'done' ? 'Sluiten' : step === last ? 'Versturen' : 'Volgende';
  }

  // Forward steps come in from the right, back steps from the left (ContactModal.astro); the first view and a reset have no side.
  const order = (s: number | 'done') => (s === 'done' ? last + 1 : s);
  function show(s: number | 'done', directed = true) {
    if (directed) form.dataset.dir = order(s) > order(step) ? 'next' : 'prev';
    else delete form.dataset.dir;
    step = s;
    panels.forEach((p) => (p.hidden = p.dataset.step !== String(s)));
    dots.forEach((d, i) => (i === s ? d.setAttribute('aria-current', 'step') : d.removeAttribute('aria-current')));
    dialog!.setAttribute('aria-labelledby', `cm-title-${s}`);
    update();
  }

  async function send() {
    next.disabled = true; // one request per click
    const outcome = await sendLead(form, dialog!.dataset.email!);
    panel('done').querySelectorAll<HTMLElement>('[data-done]').forEach((d) => (d.hidden = d.dataset.done !== outcome));
    show('done');
    if (outcome === 'mail-app') dialog!.setAttribute('aria-labelledby', 'cm-title-mail');
  }

  // Closing leaves the way it came in (CSS: rises in on desktop, slides up as a sheet on phones), then
  // really closes. Opening again mid-way just cancels the exit.
  let exit: Animation[] = [];
  function stopExit() {
    exit.forEach((a) => a.cancel());
    exit = [];
  }

  function open() {
    stopExit();
    if (!dialog!.open) dialog!.showModal();
  }

  function close() {
    if (!dialog!.open || exit.length) return;
    const sheet = matchMedia('(max-width: 767px)').matches;
    const card = reducedMotion()
      ? [{ opacity: 1 }, { opacity: 0 }]
      : sheet
        ? [{ transform: 'none' }, { transform: 'translateY(100%)' }]
        : [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(0.75rem) scale(0.98)' }];
    const timing = { duration: sheet ? 240 : 180, easing: easeOut(), fill: 'forwards' as const };
    exit = [dialog!.animate(card, timing), dialog!.animate([{ opacity: 1 }, { opacity: 0 }], { ...timing, duration: 150, pseudoElement: '::backdrop' })];
    exit[0].finished.then(
      () => {
        dialog!.close();
        stopExit(); // drop the faded-out end state, so the next open's CSS entrance shows
      },
      () => {},
    );
  }

  next.addEventListener('click', () => {
    if (step === 'done') return close();
    // Required fields of this step first (03: name, e-mail, phone)
    const invalid = [...panel(step).querySelectorAll<HTMLInputElement>('input, textarea')].find((f) => !f.checkValidity());
    if (invalid) return invalid.reportValidity();
    if (step === last) return send();
    show(step + 1);
  });
  prev.addEventListener('click', () => typeof step === 'number' && step > 0 && show(step - 1));
  form.addEventListener('change', update);
  form.addEventListener('submit', (e) => e.preventDefault()); // Enter in a field: the buttons drive the steps

  dialog.querySelector('[data-contact-modal-close]')!.addEventListener('click', close);
  // A click on the backdrop lands on the dialog itself, outside the card
  dialog.addEventListener('click', (e) => e.target === dialog && close());
  // Escape: animate out too, instead of the browser's instant close
  dialog.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  // Sent: start fresh next time
  dialog.addEventListener('close', () => {
    if (step !== 'done') return;
    form.reset();
    show(0, false);
  });
  // A page change (e.g. "Klik dan hier") closes it; the dialog itself stays across Swup visits
  document.addEventListener('flits:navigate', close);

  // Capture phase, before Swup's link handling sees the click
  document.addEventListener(
    'click',
    (e) => {
      const link = (e.target as Element).closest?.<HTMLAnchorElement>('a[href]');
      // Also /contact/ and /contact#…, not only the exact href
      if (!link || link.hasAttribute('data-no-modal') || link.origin !== location.origin || link.pathname.replace(/\/$/, '') !== '/contact') return;
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // new tab etc. still works
      e.preventDefault();
      e.stopPropagation();
      open();
    },
    true,
  );

  show(0, false);
}
