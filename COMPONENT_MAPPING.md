# COMPONENT_MAPPING — Figma → Astro

Figma-bestand `UFqTVWWPaxVwCS6UQSJndT`. De node-ids zijn voorbeeld-instances, zodat je ze in Figma terugvindt. Bij **Status** staat ✅ als het component gebouwd is en ⏳ als het later volgt.

## Architectuurregels (na review, 2026-10-23)

- **Content komt alleen binnen via content collections** (`src/content.config.ts`). Pagina's halen content op met `getCollection`/`getEntry` of met de gesorteerde helpers in `src/lib/content.ts`, en geven die als props door aan secties. Een overstap naar Sanity verandert alleen de loader.
- **`src/data/site.ts`** bevat alleen site-brede instellingen: nav, contact, rating, socials, legal en de ticker.
- **De paginaschil is `PageLayout`**: BaseLayout + Navbar + `<main>` + Footer. De navbar ligt over de eerste (donkere) sectie heen. Die sectie begint haar content op `var(--page-top)`.
- **Secties bepalen hun eigen ruimte** (de Figma-afstanden). Een pagina is daardoor gewoon een lijst secties.
- **Breedtes komen uit tokens**: `--width-content` (1248), `--width-narrow` (817) en `--width-panel` (1344). Die past de mobiele fase op één plek aan.
- **Paginaovergangen (Swup, `src/scripts/app.ts`)**: Swup wisselt alleen `#swup` (de pagina-inhoud) en `#nav-back`; navbar en footer blijven staan. Gedrag van pagina-inhoud staat in `src/scripts/*.ts` als `init()` die een opruimfunctie teruggeeft; `app.ts` start die bij elke pagina en ruimt ze op vóór de wissel. Een nieuw interactief component = een init-functie toevoegen aan `pageInits`, geen `<script>` in het component (Swup voert scripts in nieuwe inhoud niet uit). Animaties: `src/styles/motion.css`.

## Content collections — `src/content/`

| Collectie | Bron | Velden |
|---|---|---|
| `projects` | `projects/*.md` (1 bestand per case) | client, title, date (ook het jaartal), tags, badge?, types, sector, cover, **caseStudy?** (hero, intro, video's, galerij, resultaten, stats, testimonial) + Markdown-body = intro-tekst van de case |
| `reviews` | `reviews.json` | logo, logoAlt, logoHeight, quote[], author, avatar |
| `clients` | `clients.json` | name, logo, background?, logoWidth, logoHeight (tegels in de logostrip) |
| `logowall` | `logowall.json` | name, logo, row, column (cel in de 4-koloms logowall; lege cellen zijn bewust) |
| `behindTheScenes` | `behind-the-scenes.json` | image, year, caption, tilt (polaroids, volgorde = slidervolgorde) |
| `team` | `team.json` | name, order, role, photo, avatar |
| `services` | `services/*.yaml` | order, label, teaser*, `page` (breadcrumb, title, intro, description, heroMedia, blocks[]) — voedt nav, footer, teaser en `/diensten/[slug]` |
| `faqs` | `faqs.json` | question, answer, services? |
| `legal` | `legal/*.md` | title, draft + Markdown-body |

**Helpers** (`src/lib/content.ts`): `getCase(id)` levert een complete, gecontroleerde case (fout met bestandsnaam bij ontbrekende `caseStudy` of onbekende review-id), `getCaseSlugs()` voor `/projecten/[slug]`, `hasCase()`, `getFounders()` + `avatarsOf()` (volgorde via `order` in team.json). Het jaartal komt uit `date`.

**Een nieuwe case toevoegen** = één `.md` in `src/content/projects/` met `caseStudy` in de frontmatter (zie `de-koffiekoets.md` als voorbeeld). Zonder `caseStudy` verschijnt het project alleen als kaart.

## Atoms — `src/components/atoms/`

| Figma | Astro | Props | Status | Node |
|---|---|---|---|---|
| `Button` Primary/Secondary, "Stuur een appje", "VORIGE/VOLGENDE" | `Button.astro` | `variant` primary/secondary/outline/step, `href?`, `icon?`, `iconPosition?`, `disabled?` | ✅ | `1:245`, `1:263`, `1:2840` |
| `Pill` | `Pill.astro` | `variant` outline/solid/filter, `size` s/m, `active?`, plus overige HTML-attributen (`data-*`) | ✅ | `1:299` |
| Teksten in Right Grotesk | `Heading.astro` | `as`, `size` '116'/'96'/'76'/'64'/'48'/'36'/'24'/'16' (px uit Figma), `id?` | ✅ | `1:1330` |
| Teksten in GT Standard | `Text.astro` | `as` (incl. `h3` voor kaarttitels), `size` xl/l/m/base/ui/s/caption/desc, `tone` default/secondary/muted | ✅ | `1:1333` |
| Gele balk "IMPACT" | `Highlight.astro` | `rotate?` | ✅ | `1:1331` |
| Iconen | `Icon.astro` | `name` (lijst in `design-system/icons.ts`), `size?`, `label?` | ✅ | `1:240`, `1:812` |
| Gele icon-tegel | `IconTile.astro` | `icon` | ✅ | `1:2500` |
| Pijl-tegel | `ArrowTile.astro` | — | ✅ | `I1:1544;936:7705` |
| FLITS-logo | `Logo.astro` | `variant` nav/footer | ✅ | `1:250`, `1:1592` |
| Ronde foto's | `Avatar.astro`, `AvatarStack.astro` | `src`, `size?`, `ring?`, `loading?` | ✅ | `1:1325` |
| Formulierveld | `Label.astro`, `Input.astro` | `for`/`required` · alle input-attributen | ✅ | `1:2850` |
| Bliksemvormen | `BgShapes.astro` | `leftTop?`, `rightTop?`, `leftX?`, `rightX?`, `tone` dark/light, `rightOnly?` | ✅ | `1:1320` |
| Media over de hero-rand | `HeroMedia.astro` (via de `media`-slot van HeroHome/HeroPhoto/HeroPage, prop `mediaOverlap`) | `overlap` | ✅ | `1:1337`, `1:2570`, `1:2955` |
| 👉-knop (123px rond) | `HandButton.astro` | `direction` prev/next, `tone` dark/light, `label`, plus `data-*` | ✅ | `1:2561`, `1:1669` |
| Afgerond blok van 1344px | `Panel.astro` | `theme` surface/dark, `as`, `width` default/wide (1380) | ✅ | `1:1542`, `1:3202` |
| Lopende tekst (alinea's) | `Prose.astro` | `paragraphs` of slot (Markdown), `size` l/m, `medium?`, `tone?`, `opacity?` | ✅ | `1:1750`, `1:3196`, `1:2773` |
| Foto + waas achter een hero | `PhotoBackdrop.astro` | `image`, `veil` dark/brand, `bleed?` | ✅ | `1:1739`, `1:3145` |

## Molecules — `src/components/molecules/`

| Figma | Astro | Props | Status | Node |
|---|---|---|---|---|
| Cirkelslider (Osmo Radial-basis, GSAP) | `RadialSlider.astro` + `scripts/radial-slider.ts` | `speed` (px/s, 0 = alleen knoppen), `angle` (0 = rechte rij), `shape` arch/valley, `start`, `equalHeight`, `hands` (👈 👉 in de gaten naast het middelste item), `label`; **één vaste zichtbare tussenruimte (96px, kanteling meegerekend) voor alle sliders**; middelste item krijgt `data-radial-slider-active` | ✅ (foto-fan, reviews, video-fan, logo-fan, polaroids) | `1:1337`, `1:1251`, `1:2570`, `1:1641` |
| Gele/witte ⚡-balk | `Ticker.astro` | `items`, `variant` brand/light/pill, `size` s/m, `decorative?` | ✅ | `1:1551`, `1:3186` |
| Avatars + tekst | `Eyebrow.astro` | `avatars`, `size` l/m/s, `tone` muted/default, `loading?` | ✅ | `1:1324`, `1:1752`, `1:2766` |
| Ticker/eyebrow + titel + lead + knoppen (alle sectiekoppen) | `SectionHeader.astro` | `title`, `ticker?`, `lead?`, `softLead?`, `width?`, `gap?` 16/24/28, `align` center/start, `spaced?`, slots `eyebrow` en `actions` | ✅ | `1:1549`, `1:2493`, `1:1752` |
| `Project Card` | `ProjectCard.astro` | `project` (collection entry), `showYear?` | ✅ | `1:1544` |
| `Review Card` | `ReviewCard.astro` | velden uit `reviews` | ✅ | `1:1305` |
| Dienst-teaser | `ServiceCard.astro` | `href`, `image`, `label` | ✅ | `1:1586` |
| Teamlid | `TeamCard.astro` | `image`, `name`, `role`, `tagSide?` | ✅ | `1:1229` |
| Weer / klok / kaart | `WeatherWidget`, `ClockWidget` (`layout` stack/wide), `MapWidget` | standaardwaarden uit `site.ts` | ✅ | `1:1178`, `1:1194`, `1:2804`, `1:1218` |
| Stat-card | `StatCard.astro` | `label`, `value` | ✅ | `1:1761`, `1:3247` |
| Feature-/pijnpunt-card | `FeatureCard.astro` | `icon`, `title`, `text` | ✅ | `1:2523`, `1:3062` |
| Proces-stap | `StepCard.astro` | `step`, `image`, `title`, `text` | ✅ | `1:2539` |
| FAQ-rij | `FaqItem.astro` (native `<details>`) | `question`, `name?`, slot = antwoord | ✅ | `1:2462` |
| Logo-tegel (logowall, logo-fan, logostrip) | `LogoTile.astro` | `logo`, `name`, `size` wall/strip, `background?`, `logoWidth/Height?`, `decorative?` — zonder logo: gele CTA-tegel (slot) | ✅ | `1:1772`, `1:1855`, `1:1371` |
| Projectengrid (2 kolommen, verspringend) | `ProjectGrid.astro` | `projects`, `offset`, `rowGap`, `showYear?`, `titleAs?` (+ data-* voor het archief) | ✅ | `1:1542`, (in `1:2219`) |
| Polaroid | `PolaroidCard.astro` | `image`, `year`, `caption`, `tilt` | ✅ | `1:1641` |
| Filterchip | `Pill.astro` variant `filter` (alle filter/sorteer/verspring-logica getest in `scripts/project-filter.ts` → `archiveView()`) | `active`, `data-filter-*` | ✅ | (in `1:2219`) |
| Breadcrumb | `Breadcrumb.astro` | `items` | ✅ | (in `1:2220`) |
| Telefoonmockup | `PhoneMockup.astro` | `screen`, `device` right/left, `x`, `y`, `width` | ✅ | `1:2973`, `1:2964` |
| Contactformulier (stap "Start") | `ContactForm.astro` | — (stappen 01–03 nog niet ontworpen) | ✅ / ⏳ stappen | `1:2828` |

## Sections — `src/components/sections/`

| Figma | Astro | Status | Node(s) |
|---|---|---|---|
| Navbar (+ Diensten-dropdown 6:852) | `Navbar.astro` | ✅ | `1:1334`, `6:852` |
| Footer | `Footer.astro` | ✅ | `1:1589` |
| Hero home | `HeroHome.astro` | ✅ | `1:1319` |
| 3 gedraaide foto's | `ImageFan.astro` (`variant` home/about) | ✅ | `1:1337`–`1:1339` |
| "Wij zijn Joery en Jordi" + logostrip | `IntroLogos.astro` | ✅ | `1:1340` |
| Projecten in een paneel | `ProjectsGrid.astro` | ✅ | `1:1542` |
| Reviews | `ReviewsCarousel.astro` (`ticker?` i.p.v. Google-score) | ✅ | `1:1239`, `1:2094` |
| Dienst-teasers | `ServicesTeaser.astro` | ✅ | `1:1568` |
| Wie zijn wij + widgets | `TeamSection.astro` (`theme` surface/light) | ✅ | `1:1177`, `1:1673` |
| Telefoon met "Een kijkje achter de schermen" | `Showreel.astro` | ✅ | `1:1617` |
| Dark hero met breadcrumb | `HeroPage.astro` (`size` l/m) | ✅ | `1:2220`, `1:2885` |
| Foto-hero over ons | `HeroPhoto.astro` | ✅ | `1:1738`, `1:1770` |
| Polaroid-slider | `BehindTheScenes.astro` | ✅ | `1:1638` |
| Grote kop + tekst | `TextBlock.astro` | ✅ | `1:1749` |
| Stats-paneel (over ons + case) | `StatsPanel.astro` | ✅ | `1:1751`, `1:3234` |
| Logowall | `ClientLogoGrid.astro` | ✅ | `1:1737` |
| Pijnpunten / features (één patroon) | `FeatureGrid.astro` (`variant` pains/services) | ✅ | `1:2493`, `1:3056` |
| Video-fan | `VideoFan.astro` (`straddle?`) | ✅ | `1:2564`, `1:3172` |
| Logo-fan + CTA | `LogoFan.astro` | ✅ | `1:2576`–`1:2697` |
| Tekst + donker mediablok | `SplitMedia.astro` (`mediaSide`, slots eyebrow/actions/media) | ✅ | `1:2754`, `1:2956`, `1:2962` |
| Foto + telefoon onder de hero | `PhotoPhone.astro` | ✅ | `1:2955`, `1:2973` |
| Hoe gaan we te werk | `ProcessSteps.astro` | ✅ | `1:2492`, `1:2990` |
| FAQ | `FaqSection.astro` | ✅ | `1:2452` |
| Contact + formulier | `ContactSection.astro` | ✅ | `1:2801`, `1:2828` |
| Filter + projectenlijst | `ProjectArchive.astro` | ✅ | (in `1:2219`) |
| Case: hero / intro / galerij / resultaten / testimonial | `CaseHero`, `CaseIntro`, `CaseGallery`, `CaseResults`, `CaseTestimonial` | ✅ | `1:3146`, `1:3185`, `1:3202`, `1:3221`, `1:3243` |

Showcase per pagina: `/sections` (home), `/sections/over-ons`, `/sections/projecten`, `/sections/social-media`, `/sections/website`, `/sections/case`.

## Pages — `src/pages`

| Figma | Route | Bron |
|---|---|---|
| Home `1:1176` | `index.astro` | samenstelling in de pagina |
| Over ons `1:1637` | `over-ons.astro` | samenstelling in de pagina; logowall/polaroids uit collecties |
| Case overzicht `1:2219` | `projecten/index.astro` | collectie `projects` |
| Case detail `1:3140` | `projecten/[slug].astro` | alleen projecten met `caseStudy` (`getCaseSlugs`/`getCase`); kaarten zonder case linken niet |
| Social media `1:2397`, Website `1:2884` | `diensten/[slug].astro` | `content/services/<slug>.yaml`: hero + `blocks` (features, logoFan, behindTheScenes, split, steps, projects, faq, contact) |
| — (afgeleid) | `diensten/grafische-vormgeving`, `diensten/foto-en-video` | zelfde template, placeholder-copy |
| — (afgeleid) | `contact.astro` | HeroPage + ContactSection |
| — (afgeleid) | `[legal].astro` | `content/legal/*.md` (`draft: true` = noindex) |
| — (afgeleid) | `404.astro` | HeroPage + ProjectsGrid |
| review | `/styleguide`, `/components`, `/sections` (overzicht pagina → secties) | |

**Nieuwe dienst** = één YAML-bestand in `src/content/services/`. **Nieuwe case** = één Markdown in `src/content/projects/` met `caseStudy`. **FAQ** = `src/content/faqs.json` (`services` leeg = overal).
