## Why

Steps 01–02 shipped reorder POST, bulk-remove confirm, and the Featured-partners-style admin island, but product SoT and Playwright still describe a per-row gallery shortcut and single-id `/admin/featured/:eventId/remove` table. Until Gherkin, sitemap, UI map, i18n, coverage matrix, and e2e match the shipped manager, CI verifies the wrong contract and the parent feature cannot close.

## What Changes

- Update `admin-events.feature`: list shows Save order + select/remove when non-empty; add reorder scenario; remove uses `/admin/featured/remove?eventIds=`; gallery scenario MUST NOT claim a Featured convenience shortcut.
- Sitemap: list + add unchanged; replace `/admin/featured/:eventId/remove` with `/admin/featured/remove?eventIds=`; note drag reorder + Save order on the list. Optional: keep single-id 302 undocumented as the primary path.
- `ui-component-map.md` Admin Featured events row: table + drag + Save order + checkbox bulk remove; no gallery shortcut.
- `content-i18n-inventory.md`: document `featuredReorderHint`, `featuredSaveOrderAction`, `featuredRemoveBulkAction`, `featuredSelectLabel`.
- Align `gaps-and-decisions.md`, `image-uploads.md` §8a, and the DEPLOYMENT Event Gallery demo script so they no longer say Featured MAY keep a gallery shortcut.
- Playwright: keep `List featured events` tab-label assertions; rewrite remove to checkbox + bulk confirm; add `Admin reorders featured events by drag and drop` (mouse-drag + Save order; assert order after reload). Proximity/layout selectors only; no `data-testid`; keep `E2E_ADMIN_*` / R2 env-skips (never “UI not built”).
- Coverage matrix rows for list / add / remove / new reorder; gallery-from-Events rows stay `pass`.
- Mark parent step 03 done (feature complete). Archived OpenSpec specs are not product SoT.
- Out of scope: new catalog helpers; Featured partners e2e; Discover copy; implementing UI if step 02 left gaps.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Product Gherkin, sitemap, UI map, i18n inventory, image-uploads §8a, DEPLOYMENT demo script, gaps-and-decisions, coverage matrix, and Playwright SHALL describe the shipped Featured events manager (Save order, checkbox bulk remove via `/:locale/admin/featured/remove?eventIds=`, drag-reorder). The Featured events list SHALL NOT be documented or tested as a gallery entry point. Playwright titles SHALL match Gherkin `Scenario:` lines verbatim.

## Impact

- **Product SoT:** `docs/product/features/admin-events.feature`, `docs/product/sitemap/sitemap.md`, `docs/product/ui/ui-component-map.md`, `docs/product/extras/content-i18n-inventory.md`, `docs/product/extras/image-uploads.md` §8a, `docs/product/extras/gaps-and-decisions.md`, `docs/product/testing/coverage-matrix.md`, `apps/web/DEPLOYMENT.md`.
- **E2E:** `e2e/specs/admin-events.spec.ts` featured scenarios; selector pattern from `e2e/specs/admin-partners.spec.ts` reorder/remove (Surface rows `.admin-featured-events__row`, not partner tiles / not `role=row` on the featured list).
- **Runtime UI / routes / domain:** no intended behavior change. Step 02 island and step 01 routes already ship the manager. Do not add client mutation tests.
- **Parent close-out:** `.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md` mark `04-featured-events-manager-03-hardening` done; walk Release Criteria.
- **Planning mirrors:** `openspec/specs/admin-events` via this change’s deltas (not product SoT).
- **Source brief:** `.dev-plan/current-iteration/04-featured-events-manager-03-hardening.md`
- **Parent:** `.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md`
- **Depends on:** `featured-events-manager-02-ui-surfaces` (done / archived)
- **Consumed by:** closes the featured-events-manager parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `bun run test:e2e -- e2e/specs/admin-events.spec.ts` for featured scenarios (env-skip when `E2E_ADMIN_*` / R2 missing, never “UI not built”)
