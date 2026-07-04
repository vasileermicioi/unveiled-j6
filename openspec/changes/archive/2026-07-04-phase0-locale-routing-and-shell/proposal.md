## Why

Phase 0 step 03 applied the Unveiled brand globally (yellow backdrop, HeroUI, Work Sans), but the app still serves a single unlocalized scaffold at `/` with no persistent chrome. Before Phase 1 marketing pages ship, the URL-based locale model and guest app shell (navbar + footer) must wrap every page so staging demos match the product spec: `/` redirects to `/de` or `/en`, all routes live under `/:locale/*`, and language switching navigates between locale prefixes rather than mutating client state.

## What Changes

- **BREAKING:** Replace the step 02 scaffold route at `/` with a `302` redirect to `/:locale` based on `Accept-Language` (fallback `de`).
- Add `[locale]` layout route validating `locale ∈ {de, en}`; invalid locale → 404.
- Add placeholder home at `/:locale` — Unveiled logo + one CTA ("Entdecken" / "Discover" → `/:locale/discover`).
- Build guest-only app shell components: sticky Navbar (desktop links + mobile HeroUI drawer, language toggle via navigation), Footer (verbatim DE/EN copy + legal links column), Logo (`tone?: 'black' | 'white' | 'yellow'`).
- Add locale helpers for path generation (language toggle, localized links).
- Add server-rendered 404 page with `<meta name="robots" content="noindex">` for unknown routes and invalid locales.
- Update `_renderer.tsx` to set `<html lang>` from locale where available.
- **Out of scope:** marketing page content, cookie banner, auth/session navbar variants, SEO hreflang/canonical, logo SVG asset copy (step 05 — Logo references expected paths; inline placeholder acceptable until assets land).

## Capabilities

### New Capabilities

<!-- None — all requirements extend the existing platform-foundation spec. -->

### Modified Capabilities

- `platform-foundation`: Add requirements for locale-prefixed routing (`/` 302, `/:locale/*`), language switch via navigation, guest app shell (navbar + footer per `app-shell.md`), placeholder home page, and localized 404 with `noindex`.

## Impact

- **Modified files:** `apps/web/app/routes/index.tsx` (redirect only), `apps/web/app/routes/_renderer.tsx` (lang attribute).
- **New files:** `apps/web/app/routes/[locale]/_layout.tsx`, `apps/web/app/routes/[locale]/index.tsx`, `apps/web/app/middleware/locale.ts` (or equivalent helpers), shell components under `apps/web/app/components/` (Navbar, Footer, Logo), 404 not-found handler.
- **Removed/replaced:** step 02 scaffold content at `/` (theme-check Card/Button moves to `/:locale` placeholder or is removed).
- **Dependencies:** no new npm packages expected — HeroUI Navbar/NavbarMenu already available from step 03.
- **Downstream:** `phase0-foundation-05-assets-deploy-docs` adds logo SVGs, favicon, and deployment; Phase 1 fills marketing routes linked from nav/footer (404 until then is acceptable).
- **Branch:** `phase-0-foundation-04` or parent `phase-0-foundation` per iteration convention.
