# Contactformulier → n8n → Resend + Impact

Hoe een "Start een project"-aanvraag loopt, en wat er nog openstaat.

## De keten

1. **Website**: het formulier post naar `/api/contact` (`src/pages/api/contact.ts`).
   - Valideren en het honeypot-veld `website`: `src/lib/lead.ts`.
   - Een ingevulde honeypot krijgt een nep-succes en wordt nooit doorgestuurd.
   - Het doorsturen gebeurt in `src/lib/contact-route.ts`: een POST naar `N8N_FORM_WEBHOOK_URL`, met header `x-flits-secret: N8N_FORM_SECRET`.
   - Body: `{ name, email, phone, services[], message, source, receivedAt }`.
   - Faalt dat, dan opent de browser de mail-app (`src/scripts/send-lead.ts`).
2. **n8n**: workflow "Flits Digital — Contactformulier" (`K52gByc46aNBBkcV`), webhook `https://flitsdigital01.app.n8n.cloud/webhook/flits-contact`.
   - Controleert naam en e-mail.
   - Stuurt via Resend een melding naar `info@` (vanaf `noreply@`, met reply-to naar de lead).
   - Stuurt via Resend een bevestiging naar de lead (vanaf `info@`).
   - Post de lead naar Impact.
3. **Impact v3**: `POST https://impact.flitsdigital.nl/api/leads/inbound` met header `x-lead-secret` (flitsdigital/impact-v3#189).
   - Maakt een nieuwe lead in fase Nieuw, of zet de aanvraag bij een open lead met hetzelfde e-mailadres.

Resend: `flitsdigital.nl` is geverifieerd. De records staan bij Hostnet en botsen niet met Outlook/M365.
Op 2026-11-10 van begin tot eind getest via de webhook: beide mails zijn verstuurd en de lead is aangemaakt.

## Env vars (Vercel-project `flits-website`, Production)

| Naam | Status |
| --- | --- |
| `N8N_FORM_WEBHOOK_URL` | gezet op 2026-11-10 |
| `N8N_FORM_SECRET` | **nog zetten** (zie hieronder) |

## Nog te doen

1. [ ] **Secret voor de webhook.** Maak een secret (`openssl rand -hex 32`) en zet die als `N8N_FORM_SECRET` in Vercel (`flits-website`, Production).
   - In n8n: Header Auth-credential, naam `x-flits-secret`, waarde = dezelfde secret.
   - Zet daarna in de webhook-node Authentication op Header Auth, met die credential.
   - Tot die tijd neemt de webhook iedereen aan die de URL kent. Het honeypot-filter van de site helpt dan niet, want dat zit vóór n8n.
2. [ ] Optioneel:
   - De error workflow `5hrXRsNks0QxDFUe` instellen in de workflow-instellingen.
   - De Resend-key die in een chat stond vervangen.

## Om te weten

- `impact-orcin.vercel.app` is de oude Impact v2. De workflow "Flits CRM Assistent" (Telegram) praat daar nog mee.
- Als de CRM-stap faalt, gaan de mails en het antwoord aan de site gewoon door.
