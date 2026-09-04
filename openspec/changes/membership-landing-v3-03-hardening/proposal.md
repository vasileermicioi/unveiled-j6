## Why

Step 02 rebuilt `/:locale` on `LandingPageV3` and hard-deleted both `/regular` routes, but release hardening is missing: meta/JSON-LD still describe the old landing, Ladle stories still pin removed variants, and Gherkin/e2e/docs still reference `/regular`. Until SEO, stories, Playwright, and canonical docs match production, CI proves the old contract and the `membership-landing-v3` parent feature cannot close.

## What Changes

- Update landing meta/JSON-LD for v3 on the locale home only (`apps/web/app/lib/seo.ts`: `landingPageMeta`, `buildOrganizationJsonLd`); remove `/regular` canonicals and drop noindex rules for the deleted routes; verify yellow backdrop, responsive breakpoints, reduced-motion, focus states, gallery keyboard/aria.
- Add/refresh Ladle stories for `LandingPageV3` (full rail, <3 teasers, empty rail, DE+EN); delete legacy landing stories.
- Update Playwright `e2e/specs/static-pages.spec.ts` to v3 assertions with proximity/layout selectors only: rail count ≤3, no credit text in rail, no detail hrefs, CTAs → signup; delete Regular-landing scenarios and replace the bare `/regular` redirect scenario with 404 assertions for `/:locale/regular` and `/regular`.
- Sync canonical docs to the single landing with zero `/regular` references: `docs/product/sitemap/sitemap.md`, `docs/product/ui/static-pages-content.md`, `docs/product/features/static-pages.feature`, `docs/product/testing/coverage-matrix.md`, `docs/product/extras/content-i18n-inventory.md`; remove `/regular` from SEO index rules.
- Out of scope: copy redesign; pricing/Checkout; admin/emails work; Discover/member feed changes.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `static-marketing-pages`: Single v3 landing release coverage — updated meta/structured data for the locale home, `LandingPageV3` Ladle stories (full/short/empty rail × DE/EN), Playwright v3 rail assertions (≤3 teasers, no credits, no detail links, signup-only CTAs), 404 for `/:locale/regular` and `/regular`, and canonical docs with no `/regular` references.
- `bdd-and-e2e`: Static-pages Playwright contract updated to v3 proximity/layout selectors with verbatim Gherkin titles; coverage matrix rows for removed Regular-landing scenarios replaced with v3 + 404 rows (no silent skips).

## Impact

- **App (`apps/web`):** `app/lib/seo.ts` (landing meta/JSON-LD), `app/components/marketing/landing-v3/*` stories, `app/styles/globals.css` theme verification only (no new visual tokens).
- **E2E:** `e2e/specs/static-pages.spec.ts` (v3 assertions, `/regular` 404, proximity-only selectors).
- **Product SoT:** `docs/product/sitemap/sitemap.md`, `docs/product/ui/static-pages-content.md`, `docs/product/features/static-pages.feature`, `docs/product/testing/coverage-matrix.md`, `docs/product/extras/content-i18n-inventory.md`, SEO index rules.
- **Planning mirror:** `openspec/specs/{static-marketing-pages,bdd-and-e2e}` via this change's deltas (not product SoT).
- **Parent close-out:** `.dev-plan/current-iteration/01-membership-landing-v3-parent-guide.md` mark `membership-landing-v3-03-hardening` done; closes the feature.
- **Source brief:** `.dev-plan/current-iteration/04-membership-landing-v3-03-hardening.md`
- **Depends on:** `membership-landing-v3-02-page-rebuild` (done)
- **Consumed by:** closes `membership-landing-v3`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun run stories` smoke (Ladle builds); `bun run test:e2e -- e2e/specs/static-pages.spec.ts`
