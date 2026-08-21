## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/02-form-draft-persistence-03-hardening.md`, parent guide Release Criteria, and this change’s proposal/design/specs
- [x] 1.2 Confirm step 02 is merged/archived and runtime has `form-draft.ts`, `FormDraftPersistence` mounts (event wizard, partner, clone, gallery add), `draftRestored` / `discardDraft` copy, and create GET wizard (no 302 to step 1)
- [x] 1.3 Skim stale surfaces: sitemap “GET redirects to `/new`” on `/admin/events/new/dates`; missing AGENTS.md / design-system draft rule; no draft Gherkin in `admin-events.feature`

## 2. Gherkin and product docs

- [x] 2.1 Add AGENTS.md hard rule 15 (SSR add/edit drafts via `apps/web/app/lib/form-draft.ts` / `FormDraftPersistence`: restore, skip `File`, clear on persist, Discard; listed exemptions) and a Common pitfalls row for refresh-losing-values
- [x] 2.2 Update `docs/product/ui/design-system.md` Form controls: paragraph that add/edit forms persist unsaved values via the shared localStorage helper; cite `form-draft.ts`; name exemptions
- [x] 2.3 Update `docs/product/ui/ui-component-map.md` Events row (wizard + clone + gallery add form ids) and Partners row (create/edit form ids)
- [x] 2.4 Update `docs/product/sitemap/sitemap.md`: create `/admin/events/new/dates` and `/new/image` GET render those steps (no redirect to `/new`); optional localStorage draft note
- [x] 2.5 Add Gherkin to `docs/product/features/admin-events.feature` with exact titles `Refresh keeps unsaved event edits`, `Edit steps keep unsaved edits`, `Successful event save clears draft` (create GET `/new/dates` stays on dates as an AND of Edit steps — not a fourth Scenario). Do not add partner-feature draft scenarios
- [x] 2.6 Record decision in `docs/product/extras/gaps-and-decisions.md`: drafts are `localStorage` (`unveiled:form-draft:v1:{formId}`), not cookies, not a DB table; raw File bytes are not stored

## 3. Playwright and coverage matrix

- [x] 3.1 Add `test("Scenario: Refresh keeps unsaved event edits")` in `e2e/specs/admin-events.spec.ts`: create `/new`, fill title, wait for `localStorage` key `admin-event:new`, reload, expect title + restore banner, Discard → empty title. Proximity/layout selectors; no `data-testid`. `E2E_ADMIN_*` skip; no R2 required
- [x] 3.2 Add `test("Scenario: Edit steps keep unsaved edits")`: fill title on `/new`, GET `/:locale/admin/events/new/dates` (not Next POST), assert URL stays on `/new/dates`, return to General, title still unsaved. Same skip policy
- [x] 3.3 Add `test("Scenario: Successful event save clears draft")`: `createEventViaUI` Original → edit UnsavedNeverSaved (wait for key) → fill SavedTitle → Save immediately → reopen edit shows SavedTitle and no restore banner. R2 / `E2E_ADMIN_*` env-skip, never “UI not built”
- [x] 3.4 Update `docs/product/testing/coverage-matrix.md` with three `pass` rows (notes: no R2 for refresh/edit-steps; R2 for save-clears; GET `/new/dates` covered in edit-steps)

## 4. Cleanup and parent close-out

- [x] 4.1 Grep for stale “GET redirects to `/new`”, missing draft rule, and accidental fourth Gherkin title; do not add partner/onboarding/booking draft docs
- [x] 4.2 Mark `02-form-draft-persistence-03-hardening` done in `.dev-plan/current-iteration/02-form-draft-persistence-parent-guide.md` and walk parent **Release Criteria** (feature complete)
- [x] 4.3 Confirm canonical `docs/product/` + `AGENTS.md` state the add/edit draft rule; note archived OpenSpec specs are not SoT

## 5. Verification

- [x] 5.1 Run `bun run lint` — exits 0
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Run Playwright `e2e/specs/admin-events.spec.ts` tests titled exactly as the three new Gherkin scenarios — pass when `DATABASE_URL` / `E2E_ADMIN_*` are set (R2 skip only on save-clears)
  <!-- 3 scenarios skipped: `E2E_ADMIN_* required for admin events e2e` (env-skip, not “UI not built”). Titles match Gherkin verbatim. -->
- [x] 5.4 Prepare PR/handoff linking this change ID and the parent guide
