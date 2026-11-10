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

  function show(s: number | 'done') {
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

  function open() {
    if (!dialog!.open) dialog!.showModal();
  }

  function close() {
    dialog!.close();
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
  // Sent: start fresh next time
  dialog.addEventListener('close', () => {
    if (step !== 'done') return;
    form.reset();
    show(0);
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

  show(0);
}
