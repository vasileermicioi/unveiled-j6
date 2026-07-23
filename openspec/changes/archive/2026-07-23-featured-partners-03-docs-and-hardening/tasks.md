## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/featured-partners-03-docs-and-hardening.md` and parent guide release criteria / non-goals
- [x] 1.2 Confirm step 02 behavior on local/staging (Featured events label, Featured partners SSR, Discover curated partners)
- [x] 1.3 Diff `static-pages-content.md` Partner venues section against shipped Discover; note doc-only gaps
- [x] 1.4 Skim e2e hooks: `e2e/fixtures/admin.ts`, `admin-events.spec.ts`, `admin-partners.spec.ts`, `event-discovery.spec.ts`, `ensureDemoFeaturedSplit`

## 2. Product docs

- [x] 2.1 Add `featured_partners` to `docs/product/database/schema-overview.md` tables list + entity section (mirror `featured_events`; CASCADE; remove keeps partner)
- [x] 2.2 Update `docs/product/sitemap/sitemap.md`: Featured partners routes; admin chrome **Featured events** + **Featured partners**; Discover curated Partner venues wording
- [x] 2.3 Update `docs/product/features/admin-events.feature`: rename “Featured tab” wording to **Featured events** for `/admin/featured`
- [x] 2.4 Add Featured partners list/add/remove/empty/remove-keeps-venue scenarios to `docs/product/features/admin-partners.feature` (stable Scenario titles)
- [x] 2.5 Add Discover curated Partner venues (+ empty hide) scenarios to `event-discovery.feature` and/or `static-pages.feature`
- [x] 2.6 Sync `ui/ui-component-map.md`, `extras/content-i18n-inventory.md`, `extras/gaps-and-decisions.md`; fix `static-pages-content.md` only if drift remains
- [x] 2.7 Update `docs/product/testing/coverage-matrix.md` for new/updated scenarios (or named deferrals with owner)

## 3. E2E fixtures and specs

- [x] 3.1 Extend `AdminTab` + `TAB_HREF` with `featured-partners`; ensure Featured events tab assertions never use bare `/^Featured$/` or `/^Empfohlen$/`
- [x] 3.2 Confirm `admin-events.spec.ts` tab navigation / labels still work after rename (adjust selectors if needed)
- [x] 3.3 Add/extend `admin-partners.spec.ts` (or adjacent) for Featured partners list/add/remove with verbatim Scenario titles; skip with named env reasons when credentials/DB unavailable
- [x] 3.4 Extend Discover e2e for curated vs non-featured partners; add empty-hide when practical or matrix-defer with owner
- [x] 3.5 Add/adjust catalog fixture helper for featured-partners contrast only if seed alone is insufficient

## 4. Validation and release close-out

- [x] 4.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 4.2 Run targeted e2e when env allows: `admin-partners.spec.ts`, `event-discovery.spec.ts`, `admin-events.spec.ts` — pass or explicitly matrix-deferred
- [x] 4.3 Grep/docs sanity: no remaining product claim that Discover Partner venues is “first N of all partners”
- [x] 4.4 Mark step 03 done and parent feature releasable in `.dev-plan/current-iteration/featured-partners-parent-guide.md`; note any deferred e2e rows with owner
