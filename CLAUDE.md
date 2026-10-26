# Flits website: house rules

Astro 7 static site on Vercel (API routes opt out with `export const prerender = false`). Built from the Figma design on an atomic design system. Figma → component table: `COMPONENT_MAPPING.md`.

```bash
npm run dev     # http://localhost:4321
npm test        # node --test on src/**/*.test.ts
npm run check   # astro check: must stay at 0 errors
npm run build
```

## Layers

- **Tokens** in `src/styles/` (`tokens.css`, `motion.css`). No raw colours, sizes or easings in components; widths come from `--width-content`/`--width-narrow`/`--width-panel`.
- **Components** in `src/components/{atoms,molecules,sections}`. Sections own their own spacing (the Figma gaps), so a page is just a list of sections.
- **Pages** in `src/pages/` fetch content and pass it down as props. The page shell is `PageLayout` (BaseLayout + Navbar + `<main>` + Footer).
- **Logic without Astro** lives in `src/lib/` (and `logic.ts` in widget folders) so it can be tested with `node --test`. New non-trivial logic gets a `*.test.ts` next to it.

## Content

- All content comes in through content collections (`src/content.config.ts`). Pages read it with `getCollection`/`getEntry` or the helpers in `src/lib/content.ts` (`getCase`, `getFounders`, `getFounderAvatars`, …) and `src/lib/select.ts` (`projectsFor`, `faqsFor`). A CMS later only swaps the loader.
- `src/data/site.ts` holds site-wide settings only: nav, contact, rating, socials, legal, `serviceTicker`, `REVIEW_PAGES`.
- New case = one Markdown file in `src/content/projects/` with `caseStudy`. New service = one YAML in `src/content/services/`. FAQ = `faqs.json` (no `services` = everywhere).
- Home and over-ons are composed in the page itself on purpose, until there is a CMS.

## Widgets

- One folder per widget: `src/widgets/<id>/` with `Widget.astro`, `meta.ts` (title, size, season, collection, `available`), optional `init.ts` (`export function init()` returning a cleanup) and `logic.ts` + test.
- `src/widgets/registry.ts` finds them by glob; `app.ts` globs every `init.ts`. Adding a folder is all it takes; no list to update.
- Where widgets appear: `src/data/widgets.ts` (`pools`, `slots`, `fixed` per page). The registry rejects unknown ids.
- **Every widget and every variant is shown on `/widgets`** (it lists the folders automatically; add variants there by hand).
- How to add studio posts, office photos, stories and tracks: `docs/widgets-content.md`.

## Scripts and page transitions

- Swup swaps only `#swup` and `#nav-back`; navbar and footer stay. Swup does not run `<script>`s in new content, so components have no `<script>` tags.
- Page behaviour: an `init()` in `src/scripts/*.ts` that returns a cleanup, added to `pageInits` in `src/scripts/app.ts`. Behaviour of the shell (navbar, footer time, cursor marquee, contact modal) goes in `shellInits` and runs once.
- Only exception: the `is:inline` script in `HeroHome.astro` (it must run before first paint).
- Review pages (`REVIEW_PAGES`: `/styleguide`, `/components`, `/sections`, `/widgets`) load without Swup, are noindex and stay out of the sitemap.

## Forms

`/api/contact` validates (`src/lib/lead.ts`, honeypot field `website`) and forwards to the n8n webhook, which mails through Flits' own mail server. Without JS a post gets a 303 to `/contact#verzonden` or `#fout`, shown by CSS `:target` (the page stays static); on failure the form offers a mailto link.

## Environment (`.env.example`; set the same names in Vercel)

- `N8N_FORM_WEBHOOK_URL`, `N8N_FORM_SECRET`: contact forms.
- `PSI_API_KEY`, `SITE_URL`: PageSpeed widget, measured at build.

Weather comes from MET Norway through `/api/weather` (no key; CDN-cached 15 min).

## Git

Main work lives in the worktree `flits-website-v2-main`; new work on its own branch, merged through a PR.
