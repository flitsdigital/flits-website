# Live widgets, plan 1 (infra + widgets without a backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the Vercel adapter in place and ship the widget slots, the general Spotify player, the Christmas widget's placement, and widgets 05, 11, 29, 71 and 74 with real data, all without a database, before 1 December.

**Architecture:** Pages stay prerendered; the `@astrojs/vercel` adapter only enables one on-demand API route (`/api/pagespeed`). Content that the studio controls (tracks, stories, office photos, studio posts) lives in Astro content collections in the repo; Claude adds entries when Jordi sends them. A `WidgetSlot` component renders a fixed widget per page or picks one at random from a pool on each visit.

**Tech Stack:** Astro 7.4, `@astrojs/vercel` 11, TypeScript, plain CSS with tokens, `node --test` for pure logic.

**Spec:** `docs/superpowers/specs/2026-10-25-live-widgets-design.md` (read it first). Plans 2 (Supabase: 53, 61) and 3 (uptime 12) follow after this one.

## Global Constraints

- Branch: `feature/live-widgets` from `main`, worked in the worktree `/Users/jordiklavers/Documents/Coding/flits-website-v2-main`. Check `git branch --show-current` before every commit (other sessions share the main checkout).
- Visual reference for 05, 11, 29, 71, 74: the prototypes on branch `feature/widget-ideas` — read with `git show feature/widget-ideas:src/components/ideas/<File>.astro` (05 in `IdeasStudio`, 11 in `IdeasWeb`, 29 in `IdeasContent`, 71 and 74 in `IdeasKantoor`). Port the look; drop every simulated or invented number.
- Widget sizes: square **168×168** (`width: 10.5rem; aspect-ratio: 1`), wide **336×168** (`width: 21rem; aspect-ratio: 2`), radius `var(--radius-md)`, tokens only.
- Every widget follows the existing pattern: build-time HTML that already looks right, a script in `src/scripts/` added to `pageInits` in `src/scripts/app.ts` and returning a cleanup for Swup, and its own block (all states) on `src/pages/widgets.astro`.
- Nothing fake: no LIVE/REC labels, no made-up visitor counts, reviews, scores or dates.
- No new dependencies besides `@astrojs/vercel`. No secrets in client code; `PSI_API_KEY` only in the API route and the build.
- Dutch copy, short. Times and dates in `Europe/Amsterdam` (`TIME_ZONE`, `studioTime` in `src/lib/time.ts`).
- `npm test` and `npx astro build` pass after every task.

## Review Focus

1. **Slot with an empty pool or a pool whose only widgets are out of season** (e.g. only Christmas in November) → the slot falls back to its `fallback` widget, never an empty hole. Test in Task 2.
2. **Spotify link variants** (`?si=…`, `intl-nl/` paths, `spotify:track:` URIs) and a non-track link (album/playlist) → id extracted or the entry rejected at build with a clear error. Test in Task 3.
3. **PageSpeed API down, slow or quota exceeded** → `/api/pagespeed` answers 200 with `{ mobile: null, desktop: null, stale: true }` within 10 s and the widget keeps the score it was built with ("gemeten op <datum>"). Test in Task 5.
4. **Office photo dated in the future or many weeks old** → relative label never says "over 2 dagen"; old photos say "op 3 okt" instead of "47 dagen geleden". Test in Task 7.
5. **Empty collections** (no stories / no studio posts yet) → the widget is left out of every pool instead of rendering an empty card. Test in Task 2 (`isAvailable`) and checked per widget.

---

### Task 1: Vercel adapter and env

**Files:**
- Modify: `astro.config.mjs`, `package.json`, `.gitignore`
- Create: `.env.example`

- [ ] **Step 1:** `git switch -c feature/live-widgets main` in the worktree; `npm install @astrojs/vercel@^11.0.16`.
- [ ] **Step 2:** In `astro.config.mjs` add `adapter: vercel()` (import from `@astrojs/vercel`), keep `output` at its default (static) and `site: 'https://flitsdigital.nl'`.
- [ ] **Step 3:** Create `.env.example` with `PSI_API_KEY=` and `SITE_URL=` (comment: "deployed URL until the domain moves; then https://flitsdigital.nl"). Make sure `.env` is in `.gitignore`.
- [ ] **Step 4:** Run `npx astro build`. Expected: `Complete!` and a `.vercel/output` folder; all pages prerendered.
- [ ] **Step 5:** Commit `chore: Vercel adapter and env example`.

### Task 2: Widget slots

**Files:**
- Create: `src/lib/slots.ts`, `src/lib/slots.test.ts`, `src/data/widgets.ts`, `src/components/molecules/WidgetSlot.astro`, `src/scripts/widget-slots.ts`
- Modify: `src/components/sections/TeamSection.astro` (replace `<WeatherWidget />`), `src/components/sections/ContactSection.astro` (replace `<WeatherWidget />`, add a wide slot under `.contact__widgets`), `src/scripts/app.ts`, `src/pages/widgets.astro`

**Interfaces:**
- Produces:
  - `type WidgetId = 'weather' | 'spotify' | 'pagespeed' | 'christmas' | 'reviews' | 'stories' | 'office' | 'studio-post'`
  - `type SlotSize = 'square' | 'wide'`
  - `src/data/widgets.ts`: `export const widgets: Record<WidgetId, { size: SlotSize; season?: { from: [month, day]; to: [month, day] } }>`, `export const pools: Record<SlotSize, WidgetId[]>`, `export const fixed: Record<string /* page path */, Record<string /* slot id */, WidgetId>>`. Christmas has `season: { from: [12, 1], to: [12, 26] }`.
  - `src/lib/slots.ts`: `inSeason(season, month, day): boolean`, `candidates(pool: WidgetId[], isAvailable: (id) => boolean): WidgetId[]`, `pickSlot(opts: { fixed?: WidgetId; candidates: WidgetId[]; fallback: WidgetId; random: () => number }): WidgetId`.
  - `<WidgetSlot id="team" size="square" fallback="weather" today?="2026-12-04" />` — renders the fixed widget for `Astro.url.pathname` + `id` if set; otherwise renders the fallback visibly and every other available candidate inside `<template data-slot-option="<id>">`, with `data-widget-slot` on the wrapper. `today` (ISO date) pins the date and turns off the random pick — only `/widgets` uses it.
  - Availability, computed inside `WidgetSlot`: in season (build date; the browser re-checks) and, for `reviews`, `stories`, `office` and `studio-post`, the matching collection has at least one entry (`(await getCollection(name)).length > 0`).
  - `initWidgetSlots()` in `src/scripts/widget-slots.ts`, **first** in `pageInits`: for unfixed slots, picks with `pickSlot` (Amsterdam month/day for the season check, `Math.random`), and if the pick differs from the rendered fallback swaps in the template content. Other inits run after it, so swapped-in widgets start normally.
- Consumes: every widget component from Tasks 3–8 (import them in `WidgetSlot.astro` via a `WidgetId → component` map; add each as its task lands — start with `weather` only).

- [ ] **Step 1: Write failing tests** in `src/lib/slots.test.ts`:
  - `inSeason({ from: [12, 1], to: [12, 26] }, 11, 30) === false`, `(12, 1) === true`, `(12, 26) === true`, `(12, 27) === false`; a season that wraps the year (`from: [12, 15], to: [1, 6]`) is true on `(1, 3)`.
  - `pickSlot({ fixed: 'spotify', candidates: ['weather'], fallback: 'weather', random: () => 0 }) === 'spotify'`
  - `pickSlot({ candidates: [], fallback: 'weather', random: () => 0.5 }) === 'weather'` (Review Focus 1)
  - `pickSlot({ candidates: ['weather', 'spotify', 'pagespeed'], fallback: 'weather', random: () => 0.99 }) === 'pagespeed'`
  - `candidates(['christmas', 'stories'], (id) => id !== 'stories')` equals `['christmas']` (Review Focus 5).
- [ ] **Step 2:** `npm test` → the new tests fail (module missing).
- [ ] **Step 3:** Implement `src/lib/slots.ts`, `src/data/widgets.ts` (pools: square `['weather']`, wide `[]` for now; `fixed: {}`), `WidgetSlot.astro`, `widget-slots.ts`; replace the two `<WeatherWidget />` uses with `<WidgetSlot id="team" size="square" fallback="weather" />` and `<WidgetSlot id="contact" size="square" fallback="weather" />`. (The wide slot comes in Task 4.)
- [ ] **Step 4:** `npm test` → pass. `npx astro build` → pass. In the browser (`/` and `/contact`) the weather widget still shows exactly as before (only candidate).
- [ ] **Step 5:** Add a "Widgetplekken" block to `/widgets` that lists every slot id, its pool and the per-page fixed choices (read from `src/data/widgets.ts`).
- [ ] **Step 6:** Commit `feat: widget slots (random pool or fixed per page)`.

### Task 3: Spotify plays a track list

**Files:**
- Create: `src/content/tracks.json`, `src/lib/spotify.ts`, `src/lib/spotify.test.ts`
- Modify: `src/content.config.ts` (collection `tracks`), `src/components/molecules/SpotifyWidget.astro`, `src/scripts/spotify.ts`, `src/data/widgets.ts`, `src/components/molecules/WidgetSlot.astro`, `src/pages/widgets.astro`

**Interfaces:**
- Produces:
  - Collection `tracks` (file loader on `tracks.json`), entry: `{ id: string; url: string; artist: string; title?: string; cover?: string }` — `title`/`cover` are stored fallbacks.
  - `trackId(urlOrUri: string): string | null` and `neighbours(i: number, n: number): { prev: number; next: number }` in `src/lib/spotify.ts`.
  - `getTracks(): Promise<{ id; uri; href; title; artist; cover }[]>` in `src/lib/spotify.ts`: reads the collection, fetches `https://open.spotify.com/oembed?url=<url>` per track at build (5 s timeout), uses oEmbed `title` and `thumbnail_url`, falls back to the stored `title`/`cover`, and throws a build error naming the entry when neither exists.
  - `SpotifyWidget` renders the first track plus its neighbours' covers; `data-spotify-tracks` holds the list as JSON.
- Consumes: the existing iFrame API controller in `src/scripts/spotify.ts` (`createController`, `togglePlay`, `play`).

- [ ] **Step 1: Write failing tests** in `src/lib/spotify.test.ts`:
  - `trackId('https://open.spotify.com/track/0bYg9bo50gSsH3LtXe2SQn?si=abc') === '0bYg9bo50gSsH3LtXe2SQn'`
  - `trackId('https://open.spotify.com/intl-nl/track/0bYg9bo50gSsH3LtXe2SQn') === '0bYg9bo50gSsH3LtXe2SQn'`
  - `trackId('spotify:track:0bYg9bo50gSsH3LtXe2SQn') === '0bYg9bo50gSsH3LtXe2SQn'`
  - `trackId('https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX') === null` (Review Focus 2)
  - `neighbours(0, 3)` equals `{ prev: 2, next: 1 }`; `neighbours(2, 3)` equals `{ prev: 1, next: 0 }`; `neighbours(0, 1)` equals `{ prev: 0, next: 0 }`.
- [ ] **Step 2:** `npm test` → fail.
- [ ] **Step 3:** Implement `src/lib/spotify.ts` and the `tracks` collection. Seed `tracks.json` with the three tracks the widget has today (ids `0bYg9bo50gSsH3LtXe2SQn` Mariah Carey, `2FRnf9qhLbvw8fu4IBXx78` Wham!, `5a1iz510sv2W9Dt1MvFd5R` Michael Bublé), each with its current cover URL as stored fallback.
- [ ] **Step 4:** Update `SpotifyWidget.astro` to render from `getTracks()`; the side covers become `<button>`s ("Vorig nummer" / "Volgend nummer"). In `src/scripts/spotify.ts`: switching updates title, artist, the three covers, the glow and the Spotify link, resets the progress bar, and if a controller exists calls `loadUri(uri)` then `play()` when it was playing. Before the first play nothing from Spotify loads (as today).
- [ ] **Step 5:** `npm test` and `npx astro build` pass. In the browser on `/widgets`: next/prev cycles all three tracks; play, switch, the new track plays and the bar restarts at 0.
- [ ] **Step 6:** Register `spotify` (square) in `src/data/widgets.ts` and `WidgetSlot.astro`; add it to the square pool.
- [ ] **Step 7:** Commit `feat: Spotify widget plays a track list from the repo`.

### Task 4: Christmas widget in the slots

**Files:**
- Modify: `src/data/widgets.ts`, `src/components/molecules/WidgetSlot.astro`, `src/components/sections/ContactSection.astro`, `src/pages/widgets.astro`

- [ ] **Step 1:** Register `christmas` (wide, `season: { from: [12, 1], to: [12, 26] }`) and add `<WidgetSlot id="contact-wide" size="wide" fallback="christmas" />` under `.contact__widgets` in `ContactSection.astro`, hidden (not rendered at all) when no wide candidate is available (Review Focus 1 for wide slots: no fallback in season → no slot).
- [ ] **Step 2:** Add a test to `src/lib/slots.test.ts`: with `candidates([], …)` and an out-of-season fallback, `WidgetSlot`'s helper `slotWidget(...)` returns `null` (define `slotWidget(opts & { fallbackAvailable: boolean }): WidgetId | null` in `src/lib/slots.ts`). Run → fail → implement → pass.
- [ ] **Step 3:** On `/widgets` render the `contact-wide` slot twice, with `today="2026-12-04"` and `today="2026-11-30"`: the first shows Christmas, the second renders nothing. On `/contact` today (October) there is no wide slot.
- [ ] **Step 4:** Commit `feat: Christmas widget in the wide slot from 1 to 26 December`.

### Task 5: PageSpeed (11)

**Files:**
- Create: `src/lib/pagespeed.ts`, `src/lib/pagespeed.test.ts`, `src/lib/fixtures/psi.json` (trimmed real PSI response), `src/pages/api/pagespeed.ts`, `src/components/molecules/PageSpeedWidget.astro`, `src/scripts/pagespeed.ts`
- Modify: `src/data/widgets.ts`, `WidgetSlot.astro`, `src/scripts/app.ts`, `src/pages/widgets.astro`

**Interfaces:**
- Produces: `parsePsi(json: unknown): number | null` (performance score 0–100 from `lighthouseResult.categories.performance.score`), `type PageSpeed = { mobile: number | null; desktop: number | null; measuredAt: string; stale: boolean }`, `measure(siteUrl: string, key: string, opts?: { fetch?: typeof fetch; timeoutMs?: number /* 10000 */ }): Promise<PageSpeed>` (never throws: any failure → `{ mobile: null, desktop: null, measuredAt: now, stale: true }`), and `measureAtBuild(): Promise<PageSpeed>` — memoised so one build calls PSI once no matter how many pages render the widget.
- `GET /api/pagespeed` (`export const prerender = false`): returns `measure(SITE_URL, PSI_API_KEY)` as JSON with `Cache-Control: public, s-maxage=86400, stale-while-revalidate=86400`, always status 200.
- `PageSpeedWidget` renders the build-time score from `measureAtBuild()` (no score → the ring shows "—" and "meting volgt"); the script fetches `/api/pagespeed` when in view and animates the ring to the new number, but keeps the built score when the answer is `stale`. Mobiel/Desktop toggle from the prototype.

- [ ] **Step 1: Write failing tests:** `parsePsi(fixture)` equals the fixture's score ×100 rounded; `parsePsi({}) === null`; `parsePsi({ lighthouseResult: { categories: { performance: { score: 0.734 } } } }) === 73`; `measure('https://x', 'k', { fetch: () => Promise.reject(new Error('down')) })` resolves to `stale: true` with both scores `null` (Review Focus 3); a fetch that never resolves with `timeoutMs: 50` resolves the same way.
- [ ] **Step 2:** `npm test` → fail.
- [ ] **Step 3:** Implement `src/lib/pagespeed.ts`, the API route and the widget (port the prototype ring; colour thresholds 0–49 red, 50–89 orange, 90–100 green like Lighthouse). Date shown as "gemeten op 25 okt".
- [ ] **Step 4:** `npm test`, `npx astro build` pass. `npx astro preview` is not a Vercel runtime — verify the route on a Vercel preview deploy (`vercel` CLI or push the branch) with `curl -s <preview>/api/pagespeed` → JSON with two numbers. Without `PSI_API_KEY` set the endpoint returns `stale: true`.
- [ ] **Step 5:** Register `pagespeed` (square), add to the square pool, add all states (score, stale, no score) to `/widgets`.
- [ ] **Step 6:** Commit `feat: PageSpeed widget with real PSI scores`.

### Task 6: Reviews (05)

**Files:**
- Create: `src/components/molecules/ReviewsWidget.astro`, `src/scripts/reviews-widget.ts`, `src/lib/quotes.ts`, `src/lib/quotes.test.ts`
- Modify: `src/data/widgets.ts`, `WidgetSlot.astro`, `src/scripts/app.ts`, `src/pages/widgets.astro`

**Interfaces:**
- Produces: `shortQuote(paragraphs: string[], max = 90): string` — the first sentence of the first paragraph, cut at a word boundary with "…" if longer than `max`; `firstName(author: string): string` ("Rik, Kaasloods28" → "Rik").
- `ReviewsWidget` (wide): score and count from `rating` in `src/data/site.ts` (`4.9` → shown "4,9"), stars, and the quotes from the `reviews` collection rotating every 5 s (pause on hover/focus, dots as buttons), as in prototype 05.

- [ ] **Step 1: Write failing tests:** `shortQuote(['De mannen van Flits hebben een super mooie site voor mijn winkel Kaasloods 28 gebouwd. Super blij mee.'])` equals `'De mannen van Flits hebben een super mooie site voor mijn winkel Kaasloods 28 gebouwd.'`; a 200-char single sentence ends in `…` and is ≤ 91 chars; `firstName('Rik, Kaasloods28') === 'Rik'`.
- [ ] **Step 2:** `npm test` → fail. **Step 3:** implement + port the widget. **Step 4:** tests and build pass; browser check on `/widgets`.
- [ ] **Step 5:** Register `reviews` (wide), add to the wide pool. Commit `feat: reviews widget from our own reviews`.

### Task 7: Kijk binnen (71) and stories (29)

Both show studio photos from the repo, so they share the date helper.

**Files:**
- Create: `src/content/office-photos.json`, `src/content/stories.json`, `src/lib/relative-day.ts`, `src/lib/relative-day.test.ts`, `src/components/molecules/OfficeWidget.astro`, `src/components/molecules/StoriesWidget.astro`, `src/scripts/stories-widget.ts`
- Modify: `src/content.config.ts` (collections `officePhotos`, `stories`), `src/data/widgets.ts`, `WidgetSlot.astro`, `src/scripts/app.ts`, `src/pages/widgets.astro`

**Interfaces:**
- Produces:
  - Collections: `officePhotos` entries `{ id; image: image(); date: date }`; `stories` entries `{ id; image: image(); caption: string; date: date }`. Register both names in `WidgetSlot`'s availability check (Task 2).
  - `relativeDay(date: Date, today: Date, timeZone = TIME_ZONE): string` → `'vandaag'`, `'gisteren'`, `'3 dagen geleden'` (2–13 days), otherwise `'op 3 okt'`; a future date returns `'vandaag'` (Review Focus 4). `isToday(date, today): boolean`.
  - `OfficeWidget` (wide): newest office photo, label with `relativeDay`, "vers" badge only when `isToday`; dates are recomputed in the browser so a cached page stays right. No LIVE/REC.
  - `StoriesWidget` (wide): story rings from `stories` (newest first, max 5), click plays a 5 s progress bar and shows the photo and caption, as prototype 29 — without the avatars of fake people.
- [ ] **Step 1: Write failing tests** for `relativeDay` with `today = 2026-10-25T12:00+01:00`: same day → `'vandaag'`; `2026-10-24` → `'gisteren'`; `2026-10-22` → `'3 dagen geleden'`; `2026-10-03` → `'op 3 okt'`; `2026-10-27` → `'vandaag'`.
- [ ] **Step 2:** fail → **Step 3:** implement helpers, collections and both widgets. Seed `office-photos.json` with `dag-00.jpg` (dated 2026-10-25, Jordi's photo) and `stories.json` with three existing studio photos from `src/assets/images` (captions from Jordi later — mark them `// shortcut: placeholder captions until Jordi sends real ones`).
- [ ] **Step 4:** tests and build pass; browser check on `/widgets` (states: today, old photo, stories playing).
- [ ] **Step 5:** Register `office` and `stories` (wide), add to the wide pool. Commit `feat: office view and stories from our own photos`.

### Task 8: Bericht van de studio (74)

**Files:**
- Create: `src/content/studio-posts.json`, `src/components/molecules/StudioPostWidget.astro`, `src/scripts/studio-posts.ts`
- Modify: `src/content.config.ts` (collection `studioPosts`), `src/data/widgets.ts`, `WidgetSlot.astro`, `src/scripts/app.ts`, `src/pages/widgets.astro`, `CLAUDE.md` or `docs/` (one paragraph: how to add a post when Jordi sends one)

**Interfaces:**
- Consumes: `relativeDay` from Task 7.
- Produces: collection `studioPosts` entries `{ id; author: 'jordi' | 'joery'; date: date; text: string (max 140); image?: image() }`, registered in `WidgetSlot`'s availability check. Widget (wide): newest post first with the author's avatar (`src/assets/images/avatars/<author>.png`), date via `relativeDay`, optional photo, arrow buttons to older posts, as prototype 74.
- [ ] **Step 1:** Add a schema test via the build: an entry with `text` over 140 chars must fail `npx astro build` with a clear message (zod `max(140)`). Verify by temporarily adding one, then remove it.
- [ ] **Step 2:** Implement collection and widget; start with **no** entries (`[]`) so the widget is out of every pool until Jordi sends the first post (Review Focus 5); `/widgets` shows it with a sample entry passed as a prop.
- [ ] **Step 3:** tests and build pass; browser check.
- [ ] **Step 4:** Register `studio-post` (wide). Commit `feat: studio post widget (posts added from chat)`.

### Task 9: Final check

- [ ] **Step 1:** `npm test`, `npx astro build` pass; deploy a Vercel preview of the branch.
- [ ] **Step 2:** On the preview: `/`, `/over-ons`, `/contact` show the slots without layout shift and without console errors; reload a few times to see the random picks; `/widgets` shows every widget and state; `/api/pagespeed` returns JSON.
- [ ] **Step 3:** Open a PR to `main` listing what Jordi still has to provide: `PSI_API_KEY` and `SITE_URL` in Vercel, tracks, story captions, office photos, the per-page `fixed` choices in `src/data/widgets.ts`, the final Christmas photos.
