# ANALYSE — Flits V2 website (Figma → Astro)

Bron: Figma `Flits-V2-Website-Handoff` (`UFqTVWWPaxVwCS6UQSJndT`), pagina `Page 1`.
Uitgelezen via de Figma MCP op 2026-10-23. Screenshots van alle schermen staan in [`docs/figma/`](docs/figma/). Ze zijn verkleind tot 4000px hoog en dienen als referentie voor de fidelity-check.

---

## 1. Schermen

Alle frames zijn **alleen desktop, 1440px breed**. Mobiel volgt later (afgesproken).

| # | Frame | Node | Hoogte | Route (voorstel) | Opmerking |
|---|---|---|---|---|---|
| 1 | Home | `1:1176` | 8633 | `/` | |
| 2 | wip over ons | `1:1637` | 7996 | `/over-ons` | Naam zegt "wip" |
| 3 | case overzicht | `1:2219` | 4315 | `/projecten` | Filter + sortering |
| 4 | case detail] | `1:3140` | 10018 | `/projecten/[slug]` | **Template**, gevuld vanuit een collectie |
| 5 | social media | `1:2397` | 9873 | `/diensten/social-media` | Dienstpagina |
| 6 | website laten maken | `1:2884` | 8543 | `/diensten/website-laten-maken` | Dienstpagina |

**Template-kandidaten**
- **Dienstpagina's (5 en 6)** hebben vrijwel dezelfde opbouw: dark hero met breadcrumb, intro, split-blok tekst + donker media-blok, projecten-grid, "Hoe gaan we te werk?", FAQ en contact. Dat wordt één template `/diensten/[slug]` dat secties uit data samenstelt.
- **Case detail (4)** wordt `/projecten/[slug]`. Elke case is een item in een collectie.

---

## 2. Design tokens (Figma Variables)

`get_variable_defs` levert **alleen kleuren** op. Er zijn geen variabelen voor typografie, spacing of radii, en er zijn **geen modes** (dus geen light/dark in Figma zelf).

### 2a. Kleuren — vastgelegd als variabelen

| Figma variable | Waarde | CSS token (voorstel) |
|---|---|---|
| `brand/500` | `#fff301` | `--color-brand-500` |
| `dark/900` | `#140218` | `--color-dark-900` |
| `dark/900-80` | `#140218cc` | `--color-dark-900-80` |
| `dark/900-60` | `#14021899` | `--color-dark-900-60` |
| `dark/800` | `#1d0c21` | `--color-dark-800` |
| `light/0` | `#ffffff` | `--color-light-0` |
| `light/100` | `#f4f4f4` | `--color-light-100` |
| `light/100-80` | `#f4f4f4cc` | `--color-light-100-80` |

### 2b. Kleuren die als losse waarde in het design staan, zonder variabele (⚠ flag)

| Waarde | Waar | Voorstel |
|---|---|---|
| `#edeeee` | knoppen "Vorige/Volgende" in het formulier, grote FLITS-wordmark in de footer | `--color-light-200` |
| `rgba(246,232,249,.8)` | gedempte tekst in de footer (paars getint wit) | `--color-light-muted-on-dark` |
| `rgba(31,4,37,.1)` | dunne borderlijnen (formulier-footer) | `--color-border-subtle` |
| `rgba(255,255,255,.6)` | outline-knop "Stuur een appje" | `--color-border-on-dark` |
| gradient `#f4f4f4 → #fff` (en `transparant → #fff`) | stat-cards, feature-cards | `--gradient-card` |
| gradient `161.7deg, dark/900 40% → 0%` | overlay op de afbeelding in de project card | `--gradient-image-overlay` |

### 2c. Typografie (afgeleid uit design context, niet uit variables)

Drie families:

| Rol | Font | Bestand |
|---|---|---|
| Display / koppen | **PP Right Grotesk Wide Black** | `PPRightGrotesk-WideBlack.otf` ✅ aangeleverd |
| UI / body (standaard) | **GT Standard L Semibold** | `GT-Standard-L-Standard-Semibold.otf` ✅ |
| Body (beschrijvingen) | **GT Standard L Medium** | `GT-Standard-L-Standard-Medium.otf` ✅ |
| Body (footer, review cards, formulier-subtitel) | **Modern Gothic *Trial*** Regular | ❌ niet aangeleverd, zie flag F1 |

Typeschaal zoals in het design gebruikt:

| Token (voorstel) | Font | Size / line-height / tracking | Voorbeeld |
|---|---|---|---|
| `display-xl` | Right Grotesk | 116px / 0.9 / -1% | "WIJ MAKEN IMPACT", "ONS WERK" |
| `display-l` | Right Grotesk | 64px / 0.9 / -1% | Sectietitels, footer-nav, stat "50+" |
| `display-m` | Right Grotesk | 36px / 1.1 / -1% | "OM TE BEGINNEN" (formulier) |
| `display-s` | Right Grotesk | 16px / 0.9 / -1% | "VORIGE / VOLGENDE" |
| `body-xl` | GT Semibold | 32px / 1.3 | Hero-intro |
| `body-l` | GT Semibold | 24px / 1.3 | Lead-teksten, FAQ-vraag, titels van feature-cards, eyebrow in de hero |
| `body-m` | GT Semibold | 20px / 1.3 | Titel van de project card |
| `body` | GT Semibold | 16px / 1.3 | Labels, metadata |
| `ui` | GT Semibold | 16px / **0.9** | Knoppen, nav-links |
| `body-s` | GT Semibold | 14px / 1.3 | Ticker-tekst |
| `caption` | GT Semibold | 12px / 1.3 | Pills / tags |
| `body-desc` | GT Medium | 16px / 1.3 / +1% | Beschrijving in feature-cards |

Koppen staan in **hoofdletters**. Soms is dat letterlijk zo getypt, soms via `uppercase` in Figma. In code doe ik het altijd met `text-transform`.

### 2d. Spacing, layout en radii (afgeleid)

- **Grid:** frame 1440, content **1248px** met **96px** marge. Smalle tekstkolom **817px** (gecentreerd, start op x=312).
- **Panels:** witte en donkere "kaart-secties" van **1344px** breed (48px marge) met radius **48px**.
- **Spacing-schaal in gebruik:** 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 36, 48, 64, 84, 96 → tokens `--space-1 … --space-12`.
- **Sectie-padding:** 84px verticaal bij sectiekoppen, 96–128px tussen secties.
- **Radii:** 4 (pijl-tegel, FAQ-chevron), 8 (inputs, FAQ-rij, stat-card, icon-tegel), 16 (cards, afbeeldingen), 48 (panels), 1000 (pill/knop).

---

## 3. Themaplan

Figma heeft geen modes. Het design werkt wel met **drie ondergronden** die steeds terugkomen:

| Thema | Achtergrond | Tekst | Gebruik |
|---|---|---|---|
| `dark` | `dark/900` (+ bliksem-vormen in `dark/800`) | `light/0`, gedempt `light/100-80` | Hero's, FAQ-panel, footer, "Een kijkje achter de schermen" |
| `light` | `light/100` | `dark/900`, `dark/800` | Standaard pagina-achtergrond |
| `surface` | `light/0` (panel, radius 48) | `dark/900` | Projecten-panel, stats, procesblok |

Voorstel: `[data-theme="dark" | "light" | "surface"]` op **sectieniveau**, met semantische tokens (`--color-bg`, `--color-text`, `--color-text-muted`, `--color-border`). Componenten zoals Button en Pill passen zich dan automatisch aan hun ondergrond aan. Dit is **geen** site-brede dark mode.

---

## 4. Atomic component tree

> In het bestand staan **geen lokale Figma-componenten**, alleen 91 *instances* uit een externe library: `Button`, `Pill`, `Project Card`, `Review Card`, `Frame 60` (navbar), `chevron-bottom`, plus iconen en logo's. De rest is losse frames ("Frame 333", "Rectangle 155") met veel absolute positionering. Daardoor is de opbouw hieronder deels afgeleid.

### Atoms
- **Button**: `primary` (geel), `secondary` (light/100), `outline` (rand wit 60% + icoon, op dark), `nav` (Vorige/Volgende, display-s + 👉). Radius pill, padding 10/12.
- **Pill**: `outline` (wit op afbeelding), `solid` (wit, "Nieuw!"), `filter` (wit / actief geel, groter: 16px).
- **Heading**: niveau (`h1`–`h4`) los van `size` (display-xl/l/m/s).
- **Text**: size (`xl`/`l`/`m`/`base`/`s`/`caption`), weight (`semibold`/`medium`), `muted`.
- **HighlightText**: gele balk achter tekst, licht gedraaid (-1.64°), zoals in "IMPACT".
- **Icon**: whatsapp, arrow-up-right, chevron-bottom, quote, bolt (⚡), home, instagram/facebook/tiktok/linkedin, brush, map-pin, expand.
- **IconTile**: gele tegel van 48×48 met icoon.
- **ArrowTile**: donkere tegel van 4px met arrow-up-right (project card).
- **Logo**: FLITS-wordmark (klein voor de nav, groot voor de footer).
- **Avatar** / **AvatarStack**: ronde foto's van 32px, overlappend.
- **Input** / **Label**: veld met achtergrond `light/100` en radius 8.
- **Image**: Astro `<Image>` met radius.
- **BgShapes**: decoratieve bliksemvormen (Vector 14/15) op donkere secties.

### Molecules
- **NavLinks** / **NavDropdown** ("Diensten +")
- **Breadcrumb** (Home / Diensten / …)
- **Eyebrow**: AvatarStack + tekst ("Wij zijn Joery en Jordi", "Marketingbureau Emmen")
- **Ticker / Marquee**: gele balk met ⚡-gescheiden diensten
- **SectionHeader**: Ticker + Heading + (lead) + ButtonGroup
- **ProjectCard**: afbeelding, tags, badge, pijl-tegel, klant + titel
- **ReviewCard**: klantlogo, quote, avatar + naam
- **StatCard**: label + groot getal
- **FeatureCard**: IconTile + titel + beschrijving (pijnpunten en diensten)
- **StepCard**: foto met "Stap n"-pill, titel, tekst
- **FaqItem**: accordion-rij (witte rij van 72px met gele chevron-tegel)
- **LogoTile**: wit vlak van 276×216 met klantlogo, plus variant "Jouw logo ook hier?" (geel)
- **PolaroidCard**: foto, jaar-pill en bijschrift, gedraaid
- **ServiceCard**: afbeelding met label-balk ("CONTENT & SOCIAL")
- **TeamCard**: portret, naam en rol-tag
- **Widgets**: WeatherWidget, ClockWidget (analoog), MapWidget
- **FilterChips** + **SortSelect**
- **FormField** (Label + Input) en **StepIndicator** (Start · 01 · 02 · 03)
- **TiltedImage**: gedraaide foto (de 3-foto-waaier)

### Sections (organisms)
| Section | Komt voor op |
|---|---|
| **Navbar** | alle pagina's |
| **Footer** | alle pagina's |
| **HeroHome** (eyebrow, display-xl + highlight, intro) | home |
| **HeroPage** (dark, breadcrumb, titel, intro) | projecten, diensten |
| **HeroPhoto** (fullbleed foto + diagonale vorm) | over ons, case detail |
| **ImageFan** (3 gedraaide foto's over de hero-rand) | home, over ons, social, case |
| **IntroLogos** ("Wij zijn Joery en Jordi" + logo-marquee) | home |
| **ProjectsGrid** (2 kolommen, verspringend, in een surface-panel) | home, diensten, case detail |
| **ReviewsCarousel** | home, over ons, case detail |
| **ServicesTeaser** (2 ServiceCards) | home |
| **TeamSection** (Wie zijn wij + widgets) | home, over ons |
| **BehindTheScenes** (polaroid-slider, dark + geel) | home, over ons, social, case |
| **TextBlock** (grote kop + lopende tekst) | over ons, case |
| **StatsPanel** | over ons, case detail |
| **ClientLogoGrid** | over ons |
| **PainPoints** ("Misschien herken je dit wel…") | social |
| **FeatureGrid** ("Wat houdt een samenwerking in") | website |
| **SplitMedia** (tekst + donker mediablok) | social, website, case |
| **ProcessSteps** ("Hoe gaan we te werk?") | social, website |
| **FaqSection** | social, website |
| **ContactSection** (meerstapsformulier + widgets) | social |
| **ProjectFilter** + grid | projecten |
| **CaseIntro** / **CaseGallery** / **CaseTestimonial** | case detail |

---

## 5. Content en CMS

Herhalende, bewerkbare content die als collectie geschikt is:

| Collectie | Velden (afgeleid) | Gebruikt in |
|---|---|---|
| **projecten** (cases) | titel, klant, slug, jaar, tags (diensten), branche, uitgelicht/nieuw, coverbeeld, galerij, resultaten (stats), testimonial, body | home, projecten, diensten, case detail |
| **diensten** | titel, slug, hero-tekst, secties | social, website (+ later meer) |
| **reviews** | quote, naam, bedrijf, logo, avatar | carousel |
| **faq** | vraag, antwoord, dienst | dienstpagina's |
| **klanten** (logo's) | naam, logo | logo-grid, marquee |
| **blog** | (staat nog niet in het design) | later |

**CMS-advies (beslissing pas in fase 4):** Astro content collections (Markdown in de repo). Claude kan daar direct nieuwe cases en blogs in schrijven, zonder extra infrastructuur. Sanity blijft een optie als anderen dan jij content moeten beheren.

---

## 6. Fonts en assets

- **Fonts:** de drie OTF-bestanden staan op je Desktop. In fase 1 zet ik ze om naar `woff2` in `public/fonts/`.
  - ⚠ GT Standard en PP Right Grotesk zijn **commerciële fonts**. Check of je licentie **webgebruik** dekt.
- **Afbeeldingen:** projectfoto's, portretten, mockups en klantlogo's worden per sectie gedownload via de MCP. De asset-URL's verlopen na 7 dagen, dus ik download ze op het moment dat ik de sectie bouw.
- **SVG's:** FLITS-wordmark (klein en groot), bliksemvormen, iconen en klantlogo's (als SVG-groepen).

---

## 7. Interacties (af te leiden)

| Interactie | Waar | Aanname |
|---|---|---|
| Diensten-dropdown ("Diensten +") | Navbar | Hover/klik opent een menu met dienstpagina's. **Het menu zelf staat niet in het design.** |
| Ticker / marquee | Sectiekoppen, logo's | Doorlopende horizontale scroll (CSS) |
| Reviews-carousel | 👉-knoppen | Vorige/volgende, met gedraaide zijkaarten |
| Behind-the-scenes slider | Polaroids | Horizontaal schuiven |
| Projectfilter + sortering | /projecten | Multi-select chips (geel = actief), sorteer-dropdown |
| FAQ-accordion | Dienstpagina's | Eén open tegelijk? Het open-state staat niet in het design. |
| Meerstapsformulier | Contact | Start → 01 → 02 → 03. **Stap 02/03 en de verzendlogica staan niet in het design.** |
| Klok / "17:45 in Drenthe" | Footer, widgets | Live tijd via een klein script |
| Weer-widget (24°) | Team, contact | Statisch of live API? |
| Kaart-widget | Team | Statische afbeelding met link naar Google Maps |
| Video-afspeelknoppen | Social, case | Inline video / modal? |
| Hover-states | Knoppen, cards | **Staan niet in het design** |

---

## 8. ⚠ Inference flags

### Besluiten (checkpoint 0, 2026-10-23)
- **F1 →** Modern Gothic wordt **altijd** vervangen door GT Standard L (Medium voor lopende tekst).
- **F3 →** De lege band op Home vervalt.
- **F4 →** Er komt één Navbar (de versie van Home). Varianten op basis van de achtergrondkleur volgen later.
- **Licentie** voor webgebruik van de fonts is aanwezig.

### Oorspronkelijke flags

**F1. Modern Gothic *Trial*.** De footer, review cards en de subtitel van het formulier gebruiken `Modern Gothic Trial Regular`. Dat is een trial-font en het is niet aangeleverd.
→ **Voorstel:** vervangen door **GT Standard L Medium**, het font dat je wel hebt aangeleverd.

**F2. Alleen desktop (1440).** Ik bouw het eerst desktop-getrouw, met vloeiende containers zodat niets breekt. Echte mobiele layouts komen later. Elke responsive aanname markeer ik.

**F3. Lege grijze band op Home** (y≈6000–6500, tussen "Wie zijn wij" en "Een kijkje achter de schermen"). In de render is dit leeg. Er staat een frame met een iPhone-home-screen (`1:1617`) dat niet zichtbaar rendert.
→ Is hier een sectie bedoeld (bijv. een telefoon-mockup), of moet de ruimte weg?

**F4. Navbar is niet consistent.** Home, over ons en social gebruiken "Stuur een appje" (outline) + "Start een project". Website laten maken gebruikt "Contact opnemen" zonder outline. Case detail gebruikt "CONTACT".
→ **Voorstel:** één Navbar, de versie van Home.

**F5. Kleuren buiten de variables** (§2b). Ik voeg ze toe als tokens.

**F6. Placeholder-copy.** Teksten als "Hier komt een leuke korte tekst…", zes keer dezelfde FAQ-vraag en drie keer "50+ Tevreden opdrachtgevers" neem ik over als placeholder.

**F7. Rommelige laagstructuur.** Er zijn geen lokale componenten, er is veel absolute positionering en lagen heten "Frame 333". Spacing en layout leid ik af uit posities en screenshots, niet uit Auto Layout.

**F8. Ontbrekende states.** Hover, focus, open-FAQ, de vervolgstappen van het formulier en het dienstenmenu ontwerp ik zelf, in lijn met de stijl. Ze worden gemarkeerd in `FIDELITY.md`.
