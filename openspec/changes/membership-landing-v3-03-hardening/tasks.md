## 1. Setup and prerequisites

- [x] 1.1 Confirm step-02 prerequisites (v3 live on `/:locale`, both `/regular` routes 404, legacy landing files deleted) and skim the parent guide plus this change's proposal/specs/design; verify by naming the four hardening tracks (SEO, stories, e2e, docs) and the zero-`/regular` rule in the apply session.
- [x] 1.2 Inventory all stale `/regular` references via `rg -i "regular" docs/product e2e/specs apps/web/app/lib/seo.ts apps/web/app/routes` and triage each hit as delete vs legitimate (`kind: "regular"` offer enum, "regular ticket price" FAQ prose); verify the hit list is captured before editing.

## 2. SEO and theme polish

- [x] 2.1 Update/verify landing meta + Organization JSON-LD for v3 in `apps/web/app/lib/seo.ts` and `apps/web/app/routes/[locale]/index.tsx` (locale-home only, no `/regular` canonicals, no noindex rules for deleted routes) and verify view-source on `/de` and `/en` shows v3 title/description, self canonical, hreflang alternates, OG tags, and Organization JSON-LD.
- [x] 2.2 Verify yellow backdrop, responsive breakpoints, reduced-motion, focus states, and gallery keyboard/aria on the v3 landing and verify each check passes in both locales (or is recorded as a named deferral).

## 3. Ladle stories

- [x] 3.1 Add `LandingPageV3.stories.tsx` (full rail with 3 teasers, short rail with <3 teasers, empty rail, each in DE+EN) from `getPageContent(locale, "landing")` plus `LandingLiveTeaser` fixtures and delete legacy landing stories; verify `bun run stories` builds with exit 0 and the new stories render.

## 4. Playwright

- [x] 4.1 Update `e2e/specs/static-pages.spec.ts` to v3 assertions with proximity/layout selectors only (rail count ≤3 scoped to the rail region, no credit figures or `/events/:id` hrefs in rail scope, all rail CTAs → `/:locale/signup`) and verify the updated tests pass locally or skip only for documented env prerequisites.
- [x] 4.2 Delete the Regular-landing scenarios and replace the bare `/regular` redirect scenario with 404 assertions for `/:locale/regular` and `/regular`; verify `rg -i "regular" e2e/specs/static-pages.spec.ts` shows only the 404 test and justified prose hits.

## 5. Canonical docs sync

- [x] 5.1 Sync `docs/product/sitemap/sitemap.md` (delete `/regular` row), `docs/product/ui/static-pages-content.md` (delete Regular section, confirm v3 guest-home copy), `docs/product/features/static-pages.feature` (delete two `/regular` scenarios, add 404 scenario with the exact Playwright title), and `docs/product/extras/seo-and-metadata.md` (drop `/regular` from the index table, plus `ui-component-map.md` row if present); verify `rg -i "/regular" docs/product` returns zero hits.
- [x] 5.2 Sync `docs/product/testing/coverage-matrix.md` (delete two `/regular` rows, add v3 rail + 404 rows with `pass` or named env `skip`) and `docs/product/extras/content-i18n-inventory.md` (drop `regular` key strings, keep `landing-v3` DE/EN pairs); verify every touched `static-pages.feature` Scenario maps to a Playwright title or an explicit deferral.

## 6. Validation and handoff

- [x] 6.1 Run `bun run lint` and `bun run typecheck` and verify both exit 0.
- [x] 6.2 Run `bun run stories` smoke and `bun run test:e2e -- e2e/specs/static-pages.spec.ts` and verify Ladle builds and in-scope scenarios pass (or named env-skips only).
- [x] 6.3 Update `.dev-plan/current-iteration/01-membership-landing-v3-parent-guide.md` to mark `membership-landing-v3-03-hardening` done and verify the release criteria walk green; prepare a PR/handoff linking the change ID and parent guide.
