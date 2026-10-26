# Live widgets — design

Date: 2026-10-25 · Status: approved 2026-10-25 · Owner: Jordi (Flits Digital)

## Intent

The Flits site (Astro, static, `flitsdigital.nl`) already has a few small "widgets" next to the team and contact sections: live weather, an analog clock and a map. They make the site feel like a real studio in Emmen instead of a template. On the branch `feature/widget-ideas` we prototyped 100 widget ideas on a review canvas (`/widgets/ideeen`). Jordi picked eight of them to build for real, plus the Spotify and Christmas widgets that already exist on `main`.

The point is *personality and proof of life*: a visitor should feel that two real people work here right now, that the site is fast and well kept, and that they can leave something behind. It is not a dashboard and not a growth-hack.

## What gets built

| # | Widget | Real data from | Size |
|---|---|---|---|
| — | Spotify (exists, `SpotifyWidget.astro`) | Track list in the repo + Spotify oEmbed (D8) | 168×168 |
| — | Christmas countdown (exists, `ChristmasWidget.astro`) | Date + 24 office photos | 336×168 |
| 05 | Reviews | own reviews in the repo (D2) | 352×168 |
| 11 | PageSpeed | PageSpeed Insights API for flitsdigital.nl | 168×168 |
| 12 | Uptime | own Vercel Cron check + Supabase (D3) | 352×168 |
| 29 | Stories | own photos in the repo (D4) | 352×168 |
| 53 | Reacties (emoji reactions) | Supabase | 168×168 |
| 61 | Nu online | Supabase Realtime Presence | 168×168 |
| 71 | Kijk binnen (office view) | uploaded office photos (D5) | 352×168 |
| 74 | Bericht van de studio | posts Claude adds to the repo (D6) | 352×168 |

The prototypes live in `src/components/ideas/Ideas*.astro` (numbers above) and are the visual reference. Production widgets become regular molecules in `src/components/molecules/` and follow the existing widget conventions (WeatherWidget: build-time defaults, a script in `src/scripts/` started from `app.ts`'s `pageInits` with a cleanup for Swup, tokens only).

## Goals

- Every widget shows **real** data or real visitor actions; nothing fake is presented as real. The prototype's simulated visitors and invented numbers go.
- The site stays fast: widgets render a sensible static state in the HTML and hydrate with a small script. No framework added.
- Nothing third-party (Spotify, Supabase realtime, Google) loads before it is needed; anything that sets cookies or tracks loads only after a visitor action.
- Every widget degrades: API down → a calm fallback state, never an error or empty card.
- Every widget appears on `/widgets` (all states) as well as on the live page.

## Non-goals

- No visitor-written text in this round (no guestbook, chat, post-its). Reactions (53) are emoji only, so no moderation queue is needed.
- No user accounts, no admin dashboard, no CMS.
- No analytics product; "Nu online" (61) is a live count only, nothing is stored.

## Anti-goals (would be a failure even if it works)

- Fake liveness: inflated visitor counts, made-up reviews or uptime.
- A widget that makes the page slower or jumpy (layout shift when data arrives).
- Recording or showing people in the office without their consent (71).
- Secrets (Spotify secret, Google/PSI keys, Supabase service key) in the browser bundle.

## Architecture

- **Hosting:** Vercel (decided). Add `@astrojs/vercel`. Pages stay prerendered (`output: 'static'`); only API routes opt out with `export const prerender = false`.
- **Server endpoints** in `src/pages/api/*.ts`, each with CDN caching (`Cache-Control: s-maxage=…, stale-while-revalidate=…`) so third-party APIs are hit rarely and quotas are safe:
  - `/api/pagespeed` — PSI mobile + desktop performance score for `https://flitsdigital.nl`, cache 24 h.
  - `/api/uptime` — reads the cron results (D3) from Supabase, cache 5 min, returns only the aggregate percentage and day bars.
  - `/api/cron/uptime` — the Vercel Cron job of D3, protected by Vercel's `CRON_SECRET`.
- **Realtime:** Supabase (decided), browser client with the anon key.
  - 53: table `reactions (page text, emoji text, count int)`; increments only through an RPC `react(page, emoji)` (RLS: no direct writes); a soft per-visitor limit in the client (e.g. 10 per emoji per day in localStorage) plus a server-side rate limit in the RPC if cheap. Live updates through Realtime on that table.
  - 61: Realtime Presence on one channel `site`; each tab tracks `{ page }` only. Count = presence state size. No IDs, names or IPs stored.
  - Supabase loads lazily: 61 connects when the widget is in view; 53 when in view or on first click.
- **Env vars** (Vercel project + local `.env`, never committed): `PSI_API_KEY` (free Google key), `SITE_URL`, `UPTIME_URLS` (D3, private list), `SUPABASE_SERVICE_ROLE_KEY` (cron only), `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`. Add `.env.example`.

## Widget details (decided parts)

**Spotify.** Plays any track, not only Christmas: the widget shows the current track from the track list with the previous and next covers left/right; arrows or the side covers switch track; playback through the existing hidden iFrame API controller (`loadUri`). Logged-out visitors hear Spotify's 30 s preview — accepted. Artwork comes from Spotify oEmbed at build time and links back to Spotify (their attribution rule). Changing the music = a new entry in `tracks.json` (D8). If oEmbed fails at build, the track keeps a stored cover URL so the build never breaks. Known risk, accepted: Spotify wants its embed visible; we hide it behind our own design.

**Christmas.** Existing widget; the 24 final photos come later (see "Christmas photos later"), temporary test photos until then.

**11 PageSpeed.** Real PSI score; the ring animates to it. If PSI fails, show the last known score baked in at build time with "gemeten op <datum>".

**53 Reacties.** Five emoji (⚡ 🔥 😍 👏 🤯), counts per page path. Counts start at 0 — no seeding.

**61 Nu online.** "N bezoekers nu" including the viewer, counted **site-wide** (Jordi asked for "nu 3 actieve bezoekers" on the website). Every page joins the presence channel after the page is idle (`requestIdleCallback`), so it never competes with page load; only the widget displays the number. Presence is keyed by a random per-browser id in localStorage, so two tabs of one visitor count once. With 1 (just you): a friendly line ("Jij bent er nu als enige 👋"), not a lonely "1". *(Builder's call, from the builder check.)*

**Consent switch.** All Supabase connections go through one `canConnect()` gate. Today it returns true (see Privacy). If the privacy check says consent is needed, it reads a consent flag instead and 53/61 show their static state until then — no rebuild of the widgets. *(Builder's call.)*

**Christmas photos later.** Jordi will take a good office photo himself first; the 24 photos (12 stages × day/night, generated from that photo with Higgsfield, each stage building on the previous, sign-off at stage 6 and 12) are made after that. Until then the widget uses the three temporary test photos (`dag-00`, `dag-06`, `dag-12`) and its fallback to the nearest earlier stage. The widget and its placement still ship before 1 December. *(Jordi, 2026-10-25.)*

**Supabase project** in an EU region (Frankfurt). *(Builder's call.)*

## Privacy

- Spotify: as today, nothing loads before play.
- Supabase Realtime opens a websocket but sets no cookies and stores no personal data; presence is ephemeral. My reading is that this needs no consent banner, but this is not legal advice — check before launch.
- 71 office view: see D5; people in frame must agree, no audio, office hours only.

## Build order

1. Infra: Vercel adapter, env handling, `.env.example`, deploy a preview.
2. No-backend widgets: Christmas placement, widget slots (D1), Spotify (track list), 11, 05, 29, 71, 74.
3. Supabase project + 53 and 61.
4. 12 (own uptime cron + Supabase).

Each step ships on its own branch/PR with its `/widgets` entries.

## Decisions (Jordi, 2026-10-25)

- **D0 Go-live:** not live yet; the domain moves to Vercel in about a month (late November). Until then everything runs on the Vercel deployment. PageSpeed (11) measures the deployed site via a `SITE_URL` env var, switched to `https://flitsdigital.nl` at launch. The Christmas widget must be in that launch (it starts 1 December).
- **D7 Accounts:** Vercel paid plan exists. Supabase project: to be created (free tier to start). Spotify developer app: see D8.
- **D1 Placement:** widgets appear in **widget slots**. A slot either shows a random widget from a pool on each visit, or a fixed widget that Jordi sets per page. Jordi decides the per-page choices; the builder makes this a single data file (pool + per-page overrides) so changing it is one edit.
- **D2 Reviews (05):** our own reviews from `src/content/reviews.json` and the score in `src/data/site.ts`. No Google API.
- **D3 Uptime (12):** no monitor service exists. *Builder's call:* our own check — a Vercel Cron job (every 10 min) requests a private list of client URLs (env var, never in the bundle) and stores up/down per day in Supabase; the widget shows only the aggregate ("alle klantsites", %, 30 day bars). **No client names, ever.**
- **D4 Stories (29):** looks like stories, but shows our own content: a content collection of photos (and short clips if light enough) that we add to the repo. No Instagram API.
- **D5 Office view (71):** no camera. Jordi uploads an office photo now and then; the widget shows the newest one with its real date ("vandaag", "3 dagen geleden"). *Builder's call:* no "LIVE"/"REC" label — that would be fake liveness; at most a "vers" badge when the photo is from today.
- **D6 Studio posts (74):** Jordi sends the text (and photo) to Claude in chat; Claude adds it as an entry in a content collection (`src/content/studio-posts`) and commits it. No form or CMS.
- **D8 Spotify:** no developer app for now. Tracks live in a list in the repo (`src/content/tracks.json`): Jordi sends Spotify links, Claude adds them with the artist typed in. Cover art and title come from Spotify oEmbed at build time (no key). Switching to a playlist via the Web API later stays possible without changing the widget.

## Left to the builder

Exact copy, animation details, cache durations within reason, component and file names, fallback visuals, test approach (unit tests for pure logic like the existing `lib/*.test.ts`).
