## Why

Steps 01–02 shipped three ADMIN preview surfaces (`/admin/events/:id/preview`, `.../preview/browse`, `.../preview/discover`) that reuse live `EventDetailPage` / `EventCard` chrome for drafts. Canonical `docs/product/` Gherkin, Playwright, i18n inventory, coverage matrix, and the decisions log still omit those routes, so CI does not prove preview is admin-only, inert, and 200 while public `/events/:id` stays 404 for the same draft. The parent feature cannot close until that verification layer lands.

## What Changes

- Add five scenarios to `admin-events.feature` with verbatim Playwright titles: **Preview draft detail**; **Preview does not book**; **Preview browse card**; **Preview discover card**; **Guest cannot open event preview**.
- Add the matching `test("Scenario: …")` cases in `e2e/specs/admin-events.spec.ts`. Reuse `createEventViaUI` and leave the event unpublished. Assert public `/events/:id` 404 for that draft while admin preview is 200.
- Confirm sitemap already lists the three preview routes as ADMIN `noindex` GET pages (step 02 added the rows). Do not invent new paths.
- Add `content-i18n-inventory.md` rows for step 01–02 preview copy. Mention `AdminEventPreviewChrome` + the three routes on the admin Events row in `ui-component-map.md`.
- Log the parent product decisions in `gaps-and-decisions.md`: admin-only preview; cards reuse `EventCard`; Discover preview does not require featured membership.
- Add coverage-matrix rows for the five new scenarios.
- Out of scope: new preview surfaces; partner-tile preview; changing publish rules; runtime/route/copy changes unless a titled test cannot be asserted with allowed selectors.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Canonical `admin-events.feature` and Playwright SHALL record the five preview scenarios with identical titles. Sitemap SHALL list the three preview routes as ADMIN `noindex` GET pages. i18n inventory, UI component map, gaps-and-decisions, and coverage matrix SHALL document admin-only preview chrome.

## Impact

- **Product SoT:** `docs/product/features/admin-events.feature`; `docs/product/sitemap/sitemap.md` (confirm existing rows); `docs/product/extras/{content-i18n-inventory,gaps-and-decisions}.md`; `docs/product/ui/ui-component-map.md`; `docs/product/testing/coverage-matrix.md`.
- **E2E:** `e2e/specs/admin-events.spec.ts` only. Helpers stay as-is (`createEventViaUI` already leaves drafts unpublished). R2 / `E2E_ADMIN_*` skip rules unchanged for create.
- **Runtime:** no intended behavior change. Routes, `AdminEventPreviewChrome`, `AdminEventPreviewCardFrame`, and inert `EventDetailPage` `preview` already shipped in steps 01–02.
- **Planning mirror:** `openspec/specs/admin-events` via this change’s delta (not product SoT).
- **Parent close-out:** `.dev-plan/current-iteration/event-preview-parent-guide.md` mark `event-preview-03-hardening` done; walk Release Criteria.
- **Source brief:** `.dev-plan/current-iteration/event-preview-03-hardening.md`
- **Parent:** `.dev-plan/current-iteration/event-preview-parent-guide.md`
- **Depends on:** `event-preview-02-card-previews` (done / archived 2026-08-29)
- **Consumed by:** closes the event-preview parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; Playwright `e2e/specs/admin-events.spec.ts` scenarios added here pass; grep every new `Scenario:` has a matching `test("Scenario: …")` title
