# Review fixes (ponytail + architecture) — plan

Branch `feature/review-fixes` from `main` (`e99721a`, PR #1 merged), worktree `flits-website-v2-main`. One commit per item group, PR at the end.

Sources (on their own branches, not merged):
- `claude/review-ponytail-03d408:docs/reviews/2026-10-26-ponytail-review.md` (P1–P19)
- `claude/review-architecture-74f37a:docs/reviews/2026-10-26-architecture-review.md` (A1–A9 + small items)

## Decisions (Jordi, 2026-10-26)
- Forms → **n8n** with their own mail server. The site posts to its own route `/api/contact`, which forwards to `N8N_FORM_WEBHOOK_URL` (env, server-only) with `N8N_FORM_SECRET` as a header. Webhook URL and workflow come from Jordi (or are built once the n8n connection is available).
- Weather → **MET Norway** (`api.met.no` locationforecast/compact) through our own cached route `/api/weather` (User-Agent with contact, `s-maxage=900`), attribution "Weerdata: MET Norway". Replaces the browser → Open-Meteo call (also removes the visitor IP going to a third party).
- Texts (placeholders, privacy, terms, real review/links) → **Jordi supplies**. Until then nothing fake stays visible: the copied Thijs review is not shown, `example.com` and `#` social links are removed.
- PR #1 merged first (done).

## Round 1 — leads and weather (must-fix)
1. **Lead request as pure, tested logic** (P10): `src/lib/lead.ts` — `leadFrom(data)` (fields → `{ name, email, phone, services, message, source }`), `validateLead()` (required, lengths, e-mail shape, honeypot), `mailtoFor(lead, to)` (fallback). Tests.
2. **`/api/contact`** (P1, P2): validates with the same functions, forwards to n8n, 400 on bad input, 503 when not configured; never echoes input.
3. **Modal** (P2): `send()` POSTs to `/api/contact`, "Bedankt" only after 2xx, error state with the mailto fallback.
4. **Contact form on /contact** (P1): a real form (message field + "Versturen" submit) through the same route; works without JS (303 to `/contact?verzonden=1` for a non-JS post), privacy line under the button.
5. **Weather via MET Norway** (P7, P14): `src/lib/weather.ts` maps MET `symbol_code` → our skies (`skyForSymbol`), day/night from the symbol suffix or the sun (pure, tested); `/api/weather`; `scripts/weather.ts` reads it. On failure the widget hides temperature/condition instead of showing the design's "24° Lekker zonnetje". Attribution in the widget.

## Round 2 — ponytail should-fix / nice-to-have
- P3 fake content: case testimonial optional (no review shown until Thijs sends his own), drop `website: https://example.com`, filter socials without a real URL, review avatar optional (no placeholder photos).
- P6 logo wall respects reduced motion; P11 dead odometer options and logo-wall shuffle branch removed, double kill fixed.
- P8 `@astrojs/check` + `typescript` dev deps, `npm run check` clean (starts with `straddle`).
- P9 `@astrojs/sitemap` (review pages filtered) + `public/robots.txt`.
- P12 ServiceCard dim only on hover devices; P13 grid overlay only in dev or `?grid`; P15 Safari pointer type in the nav click; P16 `data-landing` only on home; P17 trail images lazy; P18 small cleanups; P19 typos.
- P4/P5 (privacy, terms, placeholder copy) wait for Jordi's texts; listed in the PR.

## Round 3 — architecture
- A3 `CLAUDE.md` with the house rules (incl. "every widget on /widgets", content how-tos), old analyses → `docs/archive/`.
- A2 `studioNow()` in `lib/time.ts` (date parts in Amsterdam) used by every script and build-time date (fixes the UTC build date in ChristmasWidget).
- A1 + A7 one folder per widget `src/widgets/<id>/{Widget.astro, init.ts, logic.ts, meta.ts}`, discovered with `import.meta.glob`; `init(root)` per widget so slot order rules disappear; shared photo-set helper.
- A4 page selection rules → `lib/select.ts` (tested); A5 shell behaviour in `scripts/` started once from `shellInits` (no `<script>` in components, one clock tick); A6 one client list (`clients`) + wall positions, no dedupe; A8 `REVIEW_PAGES` in one place.
- Small: `IntroLogos` takes `members`, `serviceTicker` default, `getFounderAvatars()`.
- A9 (home/over-ons as content blocks) stays for when a CMS comes — noted, not done.

## Verification per round
`npm test`, `npm run check`, `npx astro build`, browser check of the touched pages (desktop + phone), `/widgets` still shows every widget. End: fresh whole-branch review, then PR.
