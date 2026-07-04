## 1. Pre-flight

- [x] 1.1 Read `proposal.md`, `design.md`, and `specs/static-marketing-pages/spec.md` end-to-end
- [x] 1.2 Confirm step 01 artifacts are merged: content modules, `PageHero`, `SectionCard`, `buildPageMeta()`, renderer SEO wiring
- [x] 1.3 Read `docs/migration/ui/static-pages-content.md` landing (§2 Hero, §3 Auth card labels) and how-it-works (§1–3) sections verbatim

## 2. Content module updates

- [x] 2.1 Extend `LandingContent` in `apps/web/app/lib/content/types.ts` with `conversionCard` keys (`loginCta`, `signupCta`)
- [x] 2.2 Add DE/EN conversion-card copy to `apps/web/app/lib/content/landing.ts` ("Anmelden"/"Login", "Registrieren"/"Register" from spec)
- [x] 2.3 Confirm `how-it-works.ts` content matches spec (hero, steps, whyItWorks) — no changes expected

## 3. SEO and structured data helpers

- [x] 3.1 Add `buildOrganizationJsonLd(locale)` to `apps/web/app/lib/seo.ts` returning Organization schema with name, url, email, and Berlin address placeholder
- [x] 3.2 Define per-page SEO title/description inputs for landing and how-it-works routes per `design.md` §5

## 4. Landing page route

- [x] 4.1 Replace `apps/web/app/routes/[locale]/index.tsx` placeholder with full landing page layout
- [x] 4.2 Render centered hero: "Unveiled Berlin" headline, localized subheadline, discover + how-it-works CTAs (HeroUI Button/Link to `localizedPath`)
- [x] 4.3 Render trust microcopy line below CTAs
- [x] 4.4 Render bordered conversion card with login/signup CTA links (no inline auth form); trust badges in card footer
- [x] 4.5 Emit Organization JSON-LD `<script type="application/ld+json">` in SSR output
- [x] 4.6 Pass `c.render()` SEO props: title, description, canonicalPath

## 5. How-it-works page route

- [x] 5.1 Create `apps/web/app/routes/[locale]/how-it-works.tsx` (flat HonoX route file; nested `index.tsx` not registered by router)
- [x] 5.2 Render hero via `PageHero` with content from `getPageContent(locale, "how-it-works").hero`
- [x] 5.3 Render 3-step explainer as responsive grid of `SectionCard` tiles
- [x] 5.4 Render inverted "Why this works" panel with three value-point tiles via `SectionCard inverted={true}`
- [x] 5.5 Pass `c.render()` SEO props with localized page title and description

## 6. Navbar and navigation

- [x] 6.1 Verify `GuestNavbar` highlights how-it-works nav item when pathname is `/{locale}/how-it-works`; fix `isActiveNavPath` if needed
- [x] 6.2 Confirm home (`/{locale}`) shows no false-positive nav active state and membership CTA remains hidden on locale root

## 7. Validation

- [x] 7.1 Run `bun run typecheck` — exits 0
- [x] 7.2 Run `bun run lint` — exits 0
- [x] 7.3 `curl -s http://localhost:5174/de | head -60` — landing `<title>`, meta description, hreflang links, Organization JSON-LD in initial HTML
- [x] 7.4 `curl -s http://localhost:5174/en/how-it-works | head -60` — English content and correct meta tags
- [x] 7.5 Manual: DE/EN language toggle on `/de/how-it-works` navigates to `/en/how-it-works` preserving path
- [x] 7.6 Confirm trust badges render untranslated English text on both `/de` and `/en`

## 8. Wrap-up

- [x] 8.1 Mark step 02 done in `marketing-site-README.md` when change is archived
