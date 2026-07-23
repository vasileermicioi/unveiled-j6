## Why

Steps 01–02 shipped `featured_partners`, admin Featured partners SSR curation, Discover Partner venues from the curated list, and the **Featured events** tab rename — but `docs/product/`, Gherkin, coverage matrix, and Playwright still lag. Without this hardening slice the feature is not releasable: agents and QA lack a single SoT for routes, labels, and curated-vs-catalog partner behavior.

## What Changes

- Align `docs/product/` with shipped behavior: schema overview (`featured_partners`), sitemap Featured partners routes + admin tab naming, Gherkin (Featured events rename; Featured partners admin; Discover curated partners / empty hide), UI map, static Discover copy verify, i18n inventory, gaps-and-decisions, coverage matrix.
- Extend e2e fixtures/specs: `AdminTab` + `TAB_HREF` for `featured-partners`; tab navigation still finds **Featured events** (not bare `/^Featured$/` / `/^Empfohlen$/`); Featured partners add/remove; Discover curated partners (and empty hide when practical).
- Ensure demo seed / e2e fixtures leave a stable featured vs non-featured partner contrast for Discover assertions.
- Mark step 03 and the parent feature complete in `.dev-plan/current-iteration/featured-partners-parent-guide.md`.
- **No** new product surfaces, partner portal, reorder UI, hard max-8 on add, or Phase 6+ work. Docs/tests only, plus tiny copy/selector fixes.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-discovery`: `docs/product/` and Playwright SHALL describe Discover Partner venues as admin-curated `featured_partners` (up to 8 by `sort_order`; empty hides section), not an automatic catalog slice; automated coverage (or matrix deferral with owner) for curated vs non-featured guests.
- `admin-featured-partners`: Product Gherkin (`admin-partners.feature` or adjacent) and e2e SHALL specify Featured partners list/add/remove under `/:locale/admin/featured-partners*`, including empty state and “remove keeps venue”; Playwright titles match Scenario lines where the BDD contract requires it (or coverage-matrix deferral with owner). Admin **Featured events** tab naming in `admin-events.feature` / fixtures stays aligned with shipped chrome.

## Impact

- **Product SoT:** `docs/product/database/schema-overview.md`; `sitemap/sitemap.md`; `features/admin-events.feature`, `admin-partners.feature`, `event-discovery.feature` / `static-pages.feature` as needed; `ui/ui-component-map.md`, `static-pages-content.md` (verify); `extras/content-i18n-inventory.md`, `gaps-and-decisions.md`; `testing/coverage-matrix.md`.
- **E2E:** `e2e/fixtures/admin.ts` (`AdminTab` / `TAB_HREF`); `e2e/specs/admin-events.spec.ts`; new or extended `e2e/specs/admin-partners.spec.ts` (or adjacent); `e2e/specs/event-discovery.spec.ts` + catalog fixtures (optional helper akin to `ensureDemoFeaturedSplit` for partners).
- **Seed/fixtures:** Confirm demo seed featured-partners subset; add fixture helpers only if tests need a mixed curated set.
- **Planning:** parent guide step 03 → done / feature releasable.
- **Source brief:** `.dev-plan/current-iteration/featured-partners-03-docs-and-hardening.md`
- **Parent:** `.dev-plan/current-iteration/featured-partners-parent-guide.md`
- **Depends on:** `featured-partners-02-admin-and-discover` (done)
- **Consumed by:** closes Featured partners
- **Verification:** `bun run lint`, `bun run typecheck`; targeted e2e when credentials/DB allow; grep sanity — no remaining product claim that Discover Partner venues is “first N of all partners”
