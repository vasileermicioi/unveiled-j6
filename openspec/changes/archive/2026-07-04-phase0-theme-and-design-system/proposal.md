## Why

Phase 0 step 02 delivered a bare HonoX + React SSR scaffold with no styling — the page renders unstyled HTML on a default browser background. Before locale routing, navbar, and marketing pages land in step 04, the Unveiled brand must be applied globally so every subsequent page inherits the yellow page backdrop, Work Sans typography, HeroUI component tokens, and neo-brutalist shape utilities from day one.

## What Changes

- Install HeroUI v3 (`@heroui/react`, `@heroui/styles`), Tailwind CSS v4 (`tailwindcss`, `@tailwindcss/vite`), and `tailwind-variants` in `apps/web`.
- Add PostCSS/Tailwind v4 integration via `@tailwindcss/vite` in `vite.config.ts`.
- Create global stylesheet (`apps/web/app/styles/globals.css`) with Tailwind `@import`, HeroUI styles, brand `@theme` tokens, Uber preset color overrides, and utility classes (`.unveiled-shadow`, `.unveiled-card-hover`, display heading rules).
- Load Work Sans variable font (100–900) via Google Fonts; set as sole `--font-sans`. Do **not** load or reference EK Notice Sans.
- Set app-wide page background to `brand-yellow` (`#FAFF86`); override HeroUI semantic color slots per `design-tokens.md`.
- Set radius tokens toward zero globally; preserve `rounded-full` for pills/badges only.
- Import global CSS in `_renderer.tsx`; update scaffold route with test HeroUI Button/Card to verify theme.
- Apply selection colors, reduced-motion baseline, and a11y focus preservation per `design-tokens.md` §3.
- **Out of scope:** navbar, footer, Logo component, locale routing, favicon/logos, `@better-auth-ui/heroui`, dark mode toggle, marketing layouts, client islands.

## Capabilities

### New Capabilities

<!-- None — all requirements extend the existing platform-foundation spec. -->

### Modified Capabilities

- `platform-foundation`: Add requirements for app-wide yellow page background, HeroUI Uber theme reskin with brand token mapping, Work Sans single-font typography, and neo-brutalist shape utilities.

## Impact

- **Modified files:** `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/app/routes/_renderer.tsx`, `apps/web/app/routes/index.tsx`.
- **New files:** `apps/web/app/styles/globals.css` (or equivalent), optional `postcss.config.mjs` if not using Vite Tailwind plugin exclusively.
- **Dependencies added:** `@heroui/react`, `@heroui/styles`, `tailwindcss`, `@tailwindcss/vite`, `tailwind-variants`.
- **Downstream:** `phase0-foundation-04-locale-routing-and-shell` consumes themed layout; Phase 2 auth UI uses `@better-auth-ui/heroui` on top of this foundation.
- **Branch:** `phase-0-foundation-03` or parent `phase-0-foundation` per iteration convention.
