# flits-website

Website van Flits (Emmen), gebouwd met Astro vanuit het Figma-ontwerp op een atomic design system.

```bash
npm install
npm run dev     # http://localhost:4321
npm run build
npm test
```

- **Content** staat in `src/content/` (projecten/cases als Markdown, diensten als YAML, reviews, FAQ, logowall). Een nieuwe case of dienst is één bestand. Huisregels: `CLAUDE.md`; Figma → component: `COMPONENT_MAPPING.md`.
- **Design system**: tokens in `src/styles/`, componenten in `src/components/{atoms,molecules,sections}`. Review-pagina's: `/styleguide`, `/components`, `/sections`, `/widgets`.
- **Paginaovergangen**: Swup via `src/scripts/app.ts`, animaties in `src/styles/motion.css`.
