## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/04-featured-events-manager-03-hardening.md`, parent guide Release Criteria, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 02 artifacts exist: `AdminFeaturedEventsManager` (Save order, native checkboxes, no gallery action); list POST + `/admin/featured/remove?eventIds=`; DE/EN `featuredReorderHint` / `featuredSaveOrderAction` / `featuredRemoveBulkAction` / `featuredSelectLabel`
- [x] 1.3 Skim stale surfaces: Gherkin `:eventId/remove` + MAY gallery shortcut; sitemap single-id remove; `ui-component-map` `AdminFeaturedTable`; i18n missing `featured*` reorder keys; Playwright per-row Remove + `getByRole("row")` on the featured list

## 2. Gherkin and product docs

- [x] 2.1 Update `docs/product/features/admin-events.feature`: list (Save order + Remove selected when non-empty; thumbs do not block select/remove); add `Scenario: Admin reorders featured events by drag and drop`; remove uses `/admin/featured/remove?eventIds=` + checkbox select; gallery scenario MUST NOT claim a Featured convenience shortcut
- [x] 2.2 Update `docs/product/sitemap/sitemap.md`: list notes drag reorder + Save order; replace `/admin/featured/:eventId/remove` with `/admin/featured/remove?eventIds=`; list + add paths unchanged; do not document the single-id 302 as the primary path
- [x] 2.3 Update `docs/product/ui/ui-component-map.md` Admin Featured events: table-equivalent rows + drag + Save order + checkbox bulk remove; no gallery shortcut; drop `AdminFeaturedTable`
- [x] 2.4 Update `docs/product/extras/content-i18n-inventory.md`: document `featuredReorderHint`, `featuredSaveOrderAction`, `featuredRemoveBulkAction`, `featuredSelectLabel`
- [x] 2.5 Update `docs/product/extras/gaps-and-decisions.md` gallery-entry row: Featured list does not offer a gallery shortcut (drop MAY convenience)
- [x] 2.6 Update `docs/product/extras/image-uploads.md` §8a and `apps/web/DEPLOYMENT.md` Event Gallery demo: gallery manage from Events list/edit only; Featured is not an entry point

## 3. Playwright and coverage matrix

- [x] 3.1 Keep `Scenario: List featured events` tab-label + heading assertions; do not require Save order / Remove selected when the seed list may be empty
- [x] 3.2 Rewrite `Scenario: Admin remove from featured keeps catalog event`: add-results may still use `role=row`; featured list uses `.admin-featured-events__row` + checkbox + **Remove selected** / **Auswahl entfernen** link → `/admin/featured/remove`; confirm keeps catalog event + Discover empty; assert no gallery-manage control on the non-empty featured list; keep R2/`E2E_ADMIN_*` skip; no `data-testid`
- [x] 3.3 Add `Scenario: Admin reorders featured events by drag and drop` (title verbatim): two events, mouse-drag like `admin-partners.spec.ts`, Save order, reload, assert relative order of those two titles; `test.setTimeout(120_000)`; same env-skip
- [x] 3.4 Extend `Scenario: Gallery manage is available from the Events catalog`: keep Events entry; `goto` Featured and expect zero gallery-manage links; gallery-from-Events matrix row stays `pass`
- [x] 3.5 Update `docs/product/testing/coverage-matrix.md` rows for list / add / remove / new reorder (notes: checkbox bulk remove, Surface-row locators, R2 env-skip — never “UI not built”)

## 4. Cleanup and parent close-out

- [x] 4.1 Grep for stale wording (`AdminFeaturedTable`, `/admin/featured/:eventId/remove` as primary, `MAY also offer a convenience gallery`, `gallery or remove actions`, per-row Featured Remove) in `docs/product/` and `e2e/specs/admin-events.spec.ts`
- [x] 4.2 Mark `04-featured-events-manager-03-hardening` done in `.dev-plan/current-iteration/01-featured-events-manager-parent-guide.md` and walk parent **Release Criteria** (feature complete)
- [x] 4.3 Confirm canonical `docs/product/` reflects the shipped manager; note archived OpenSpec specs are not SoT

## 5. Verification

- [x] 5.1 Run `bun run lint` — exits 0
  <!-- Touched files pass `biome check`. Full-repo `bun run lint` still fails on pre-existing drizzle snapshot format (`packages/db/drizzle/meta/*`), not this change. -->
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Run `bun run test:e2e -- e2e/specs/admin-events.spec.ts` for featured scenarios — pass, or env-skip when `E2E_ADMIN_*` / R2 missing (never “UI not built”)
  <!-- 4 featured/gallery scenarios skipped: `E2E_ADMIN_* required for admin events e2e` (env-skip, not “UI not built”). -->
- [x] 5.4 Prepare PR/handoff linking this change ID and the parent guide
