## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-preview-03-hardening.md` (all 5 proposal sections + spec delta), the parent guide Release Criteria / product-decision table / non-goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 02 artifacts exist: `preview/index.tsx`, `preview/browse.tsx`, `preview/discover.tsx`, `AdminEventPreviewChrome`, `AdminEventPreviewCardFrame`, `loadAdminEventPreview`, sitemap rows for the three preview paths. Confirm `createEventViaUI` still leaves events unpublished unless `publish: true`

## 2. Gherkin and product docs

- [x] 2.1 Append the five locked titles to `docs/product/features/admin-events.feature` with steps matching this change’s spec delta: Preview draft detail; Preview does not book; Preview browse card; Preview discover card; Guest cannot open event preview. Verify titles are unique in the file and match design.md decision 3 verbatim
- [x] 2.2 Confirm `docs/product/sitemap/sitemap.md` already lists `/:locale/admin/events/:id/preview`, `.../preview/browse`, and `.../preview/discover` as ADMIN `noindex` GET pages. Fix wording only if a row is missing or wrong — do not invent new paths
- [x] 2.3 Add the preview `admin-content.ts` keys from design.md decision 7 to `docs/product/extras/content-i18n-inventory.md`. Mention Discover `livePreview` eyebrow/headline are reused on discover preview
- [x] 2.4 Update the admin Events row in `docs/product/ui/ui-component-map.md` to name `AdminEventPreviewChrome` + the three preview routes, inert `EventDetailPage`, `EventCard` + `AdminEventPreviewCardFrame`, FormDraft-exempt, `noindex`
- [x] 2.5 Add one `gaps-and-decisions.md` row: admin-only preview; cards reuse `EventCard`; Discover preview does not require featured membership; drafts previewable while public `/events/:id` stays 404

## 3. Playwright

- [x] 3.1 Add `test("Scenario: Preview draft detail")` to `e2e/specs/admin-events.spec.ts`: `createEventViaUI` (no publish); GET detail preview 200 + locale title; `clearCookies` then public `/events/:id` is 404 + NotFound heading. R2 skip unchanged. Verify title string is exact
- [x] 3.2 Add `test("Scenario: Preview does not book")`: detail preview shows Preview only / Nur Vorschau; no book/waitlist/save/login POST control on `main`. Verify with allowed role/text selectors only
- [x] 3.3 Add `test("Scenario: Preview browse card")`: unpublished, not featured; one card with locale title; CTA lands on `/:locale/admin/events/:id/preview` not public detail. Verify unique title count 1 on `main`
- [x] 3.4 Add `test("Scenario: Preview discover card")`: unpublished, not featured; one Discover-styled card + live `livePreview` header copy; after `clearCookies`, `/discover` omits the draft title. Verify header strings from design.md decision 5
- [x] 3.5 Add `test("Scenario: Guest cannot open event preview")`: create draft, `clearCookies`, GET detail preview → `/:locale/login?returnTo=`; event title heading count 0. Optionally also hit browse/discover in the same test. Verify no `@skip-no-ui`

## 4. Coverage matrix and parent close-out

- [x] 4.1 Add five `pass` rows to `docs/product/testing/coverage-matrix.md` under `admin-events.feature` for the new titles. Notes: `E2E_ADMIN_*` + R2. Verify every new `Scenario:` has `test("Scenario: …")`
- [x] 4.2 Mark `event-preview-03-hardening` done in `.dev-plan/current-iteration/event-preview-parent-guide.md` and walk parent **Release Criteria** (feature released). Canonical SoT is `docs/product/`; do not treat `openspec/specs/` as product behavior; no new AGENTS.md convention beyond “preview routes are admin GET pages that reuse live components with inert CTAs”

## 5. Verification

- [x] 5.1 Run `bun run lint` — exits 0
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Run Playwright `e2e/specs/admin-events.spec.ts` for the five new titles — they pass (R2 / `E2E_ADMIN_*` skip rules unchanged for create)
- [x] 5.4 Prepare PR/handoff linking this change ID and the parent guide
