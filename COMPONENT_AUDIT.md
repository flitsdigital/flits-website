# Component Audit — Flits website v2

_Scanned 78 component files (`src/components`, `src/pages`, `src/layouts`) on 24 okt 2026.
Script thresholds: duplicates ≥ 0.75, inline ≥ 0.75, plus a looser pass at 0.60 and a manual
pass over CSS/markup patterns (the script recognises Astro component tags poorly, so most
findings below come from the manual pass). Every finding was checked in the files._

## Summary

> **Status 24 okt 2026:** findings 1–8 are fixed (PhotoBackdrop, LogoTile `size`, Text `as="h3"`, ProjectGrid, Panel `wide`, Prose, Pill `size`, merged CaseHero rule). The service pages wait for fase 4.
- **4 duplicate pairs**, **4 missed-reuse spots**, **0 real reinvented primitives** (the one the
  script flagged is a false positive), plus 1 known page duplicate that belongs to fase 4.
- Headline: the atomic structure holds. There are no copy-pasted components. What remains are
  small "same shape, separately styled" pairs, mostly in the case and service sections built
  last. Fixing all of them is roughly half a day, with no visual change; most of it is one new
  small atom or one extra prop on an existing one.

## Duplicate components

### 1. `CaseHero` / `HeroPhoto` — the photo backdrop (≈ 0.8, manual)
- **Files:** `src/components/sections/CaseHero.astro:18-60`, `src/components/sections/HeroPhoto.astro:20-66`
- **Same:**
  - a full-bleed photo with `object-fit: cover`
  - a veil in `::before` at z-index 1, with `BgShapes` on the same layer
  - content at z-index 2
  - `isolation: isolate` and `overflow: hidden`
- **Differs:**
  - veil colour: black 40% vs dark-800 50%
  - HeroPhoto's photo bleeds 108px left and right and 55px up
  - CaseHero shows only the right bolt
  - the content itself is completely different
- **Suggestion:** add a `PhotoBackdrop` atom (`image`, `veil`, `bleed?`) that owns the photo, veil
  and layering, and keep both heroes as separate sections around it. About 20 lines saved
  per hero, and the stacking fix from today lives in one place instead of two.
- **Risk:** low. Don't merge the two heroes themselves; their content and layout really differ.

### 2. `BrandTile` / `LogoTile` — a logo centred in a rounded tile (manual)
- **Files:** `src/components/molecules/BrandTile.astro`, `src/components/molecules/LogoTile.astro`
- **Same:** a centred logo inside a rounded rectangle (`radius-sm`, `overflow: hidden`, grid `place-items: center`).
- **Differs:**
  - size: strip 204×83 vs wall 276×216
  - background: the client's brand colour vs white
  - BrandTile uses an explicit logo box from `clients.json`; LogoTile uses the SVG's own size
  - LogoTile also has the yellow CTA variant
  - BrandTile has `decorative` for the looped copies
- **Suggestion:** fold BrandTile into `LogoTile` with `size: 'strip' | 'wall'`, an optional
  `background` and optional `logoWidth`/`logoHeight`. Then replace the one call site in `IntroLogos`.
- **Risk:** low, but it's only one call site. Worth doing when you touch the logo strip anyway,
  for example when the real logos arrive.

### 3. `FeatureCard` / `StepCard` — the title + text block (manual, identical CSS)
- **Files:** `src/components/molecules/FeatureCard.astro:35-45`, `src/components/molecules/StepCard.astro:60-71`
- **Same:** an `h3` at `--text-body-l`, a `p` at `--text-body-desc` with `--tracking-desc`, and a 6px gap. These are byte-for-byte the same rules.
- **Differs:** StepCard's block has `padding-right: 32px`, because the text box is 350 of 384px wide.
- **Suggestion:** a tiny `CardText` molecule (`title`, `text`), or give the `Text` atom an
  `as="h3"` option and use `<Text as="h3" size="l">` + `<Text size="desc">` in both. The second
  option needs no new file.

### 4. `ProjectsGrid` / `ProjectArchive` — the staggered two-column project grid (manual)
- **Files:** `src/components/sections/ProjectsGrid.astro:31-44`, `src/components/sections/ProjectArchive.astro:155-164`
- **Same:** two equal columns of `ProjectCard`, a 48px column gap, and every second card pushed down.
- **Differs:**
  - offset: 48px (home panel) vs 100px (archive)
  - row gap: 48 vs 71
  - the stagger: CSS `:nth-child(even)` on home vs the JS `is-offset` class on the archive (needed because filtering hides cards)
- **Suggestion:** a `ProjectGrid` molecule with `offset` and `rowGap` props. It always staggers
  via the `is-offset` class, which the archive script already sets and which home sets at build time.
  Filtering stays in `ProjectArchive`.
- **Risk:** medium-low. The archive's stagger is driven by `archiveView()`, so keep the class
  contract, not `:nth-child`.

### (known) `pages/sections/social-media.astro` / `pages/sections/website.astro` (script: 0.68)
- This is the architecture finding B2: two service pages, about 70% the same structure with the same FAQ.
- Solved by the `/diensten/[slug]` template in **fase 4**, not here.

## Missed reuse — inline re-implementations

### 5. `CaseGallery` re-implements `Panel`
- **Where:** `src/components/sections/CaseGallery.astro:38-44`. It has a white background, `radius-lg` and a centred width.
  That is Panel, except 1380px wide instead of 1344.
- **Suggestion:** give Panel `width?: 'default' | 'wide'` (wide = 1380, 30px margins). Then render
  `<Panel as="section" width="wide"><div class="case-gallery">…</div></Panel>`.
  This removes the hand-rolled background, radius and width.

### 6. Four sections hand-roll the same paragraph stack
- **Where:**
  - `TextBlock.astro:29-32`: 24px semibold, secondary
  - `SplitMedia.astro:51-58`: 20px semibold, 90%
  - `CaseResults.astro:58-63`: 24px medium, 80%
  - `CaseIntro.astro:43-48`: 24px medium
- Each one repeats `display: grid; gap: 1.3em` + font + colour around `body.map(p => <p>)`.
- **Suggestion:** a `Prose` atom (`paragraphs`, `size: 'l' | 'm'`, `weight?: 'medium'`, `soft?: boolean`)
  rendering the paragraphs with the "empty line" gap. Before → after:
  `<div class="split__body">{body.map(p => <p>{p}</p>)}</div>` + 8 lines CSS → `<Prose paragraphs={body} size="m" soft />`.
- **Note:** the Markdown body in CaseIntro can't use it directly (it's a rendered `<Content />`).
  Keep that one as a slot wrapper, or let `Prose` accept a slot as well.

### 7. `StepCard` hand-rolls a `Pill`
- **Where:** `src/components/molecules/StepCard.astro:50-58`. The "Stap n" pill is white, `radius-pill`, with padding 4/8.
- **Difference from `Pill variant="solid"`:** it uses 16px text and 4/8 padding, where the pill uses 12px and 4/10.
- **Suggestion:** add `size?: 's' | 'm'` to `Pill` and use `<Pill variant="solid" size="m">` here.
  This is the same move as the Polaroid year pill fixed this morning.

### 8. (lean) `CaseHero` declares `.case-hero__text` twice
- **Where:** `src/components/sections/CaseHero.astro`. One block sets position/z-index, the next sets the layout.
- **Suggestion:** merge them into one rule. This disappears anyway with finding 1.

## Missed reuse — reinvented primitives
- **No real findings.** The script flagged 3 raw `<button>` in `Navbar.astro`:
  - the hamburger
  - the Diensten toggle
  - the overlay close
- These are menu controls with their own ARIA wiring, not the `Button` or `HandButton` look. Leave them.
- The other hand-styled controls are deliberate one-offs with no atom to reuse:
  - the archive `<select>`
  - the review rating badge
  - the services pill list in CaseIntro
  - the form step indicator
- Make an atom for one of them only if it shows up a second time.

## Script candidates that were false positives
- `TextBlock` "inside" `components.astro`, `SectionHeader` and `IntroLogos`: they only share a Heading followed by text. These are not re-implementations.
- `Eyebrow` "inside" `FaqSection`: this is the "Nog vragen? + button" row, not an eyebrow.
- `FeatureGrid` "inside" `TeamSection`: both now use `SectionHeader`, which is the shared part.

## Suggested order of work
1. **#5 Panel `wide`** (10 min): removes an inline copy of an atom.
2. **#3 card text** (15 min): identical CSS in two molecules; use `Text as="h3"`.
3. **#7 Pill `size`** (10 min): same pattern as this morning's Polaroid fix.
4. **#6 `Prose` atom** (30 min): 4 call sites, and the place future case/blog copy will go through.
5. **#1 `PhotoBackdrop`** (30 min): one place for photo, veil and layering.
6. **#4 `ProjectGrid`** (30 min): do it when wiring `/projecten` in fase 4.
7. **#2 logo tiles** (20 min): do it when the real logos arrive.
8. **Service pages**: fase 4 (`/diensten/[slug]`).
