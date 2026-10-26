import { leadFrom, mailtoFor } from '../lib/lead';

/**
 * The contact form on /contact (ContactForm.astro): sends through /api/contact without leaving the page
 * and shows the outcome in place. Without JavaScript the form posts normally and the route redirects
 * back with ?verzonden=1 / ?fout=1, which this also shows.
 */
export function initContactForms() {
  const forms = document.querySelectorAll<HTMLFormElement>('[data-contact-form]');
  if (!forms.length) return;
  const params = new URLSearchParams(location.search);

  const offs = [...forms].map((form) => {
    const status = form.querySelector<HTMLElement>('[data-contact-form-status]')!;
    const submit = form.querySelector<HTMLButtonElement>('[data-contact-form-submit]')!;
    const label = submit.querySelector('.btn__label')!;
    const say = (tone: 'ok' | 'error', html: string) => {
      status.dataset.tone = tone;
      status.innerHTML = html;
      status.hidden = false;
    };
    const failed = (data: FormData) => {
      say('error', 'Versturen lukte niet. <a>Mail je bericht</a> of probeer het zo nog eens.');
      status.querySelector('a')!.href = mailtoFor(leadFrom(data), form.dataset.email!);
    };

    if (params.has('verzonden')) say('ok', 'Bedankt! We hebben je bericht ontvangen en nemen snel contact met je op.');
    if (params.has('fout')) failed(new FormData(form));

    const onSubmit = async (e: SubmitEvent) => {
      e.preventDefault();
      if (!form.reportValidity()) return;
      const data = new FormData(form);
      submit.disabled = true;
      label.textContent = 'Versturen…';
      try {
        const res = await fetch(form.action, { method: 'POST', body: data, headers: { accept: 'application/json' } });
        if (!res.ok) throw new Error(`contact ${res.status}`);
        form.reset();
        say('ok', 'Bedankt! We hebben je bericht ontvangen en nemen snel contact met je op.');
      } catch {
        failed(data);
      } finally {
        submit.disabled = false;
        label.textContent = 'Versturen';
      }
    };
    form.addEventListener('submit', onSubmit);
    return () => form.removeEventListener('submit', onSubmit);
  });

  return () => offs.forEach((off) => off());
}
