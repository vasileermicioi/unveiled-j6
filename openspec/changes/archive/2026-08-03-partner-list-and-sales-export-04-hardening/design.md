## Context

Parent feature step 04 (final): close the loop on BDD, Playwright, coverage matrix, and product/docs/canonical-spec alignment after steps 01–03 shipped partner-list sorting/active-events and the ADMIN sales-export page.

Current state:

- **Shipped UI/domain:** `/:locale/admin/partners` has Name filter, `sort`/`dir`, Active events column, toolbar Export → `/:locale/admin/partners/export` (period table + CSV). Domain helpers and openspec main specs for `partner-catalog` / `booking` already describe the product behavior.
- **Gaps:** `docs/product/features/admin-partners.feature` has no Name/sort/Active/Export or sales-export scenarios; `e2e/specs/admin-partners.spec.ts` has no matching tests; `coverage-matrix.md` has no rows; `sitemap.md` omits `/admin/partners/export` and list sort notes; `authorization-matrix.md` has no export route row; `gaps-and-decisions.md` lacks Active-event and tickets-sold decision entries; `ui-component-map.md` Partners row does not mention sort/active/export.
- **Do not touch:** `docs/product/features/post-mvp/partner-and-checkin.feature`; events list page.

Constraints: Gherkin is product SoT; Playwright titles MUST match `Scenario:` verbatim; proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); one Playwright file per feature basename; env skips (e.g. `E2E_ADMIN_*`, `DATABASE_URL`) are documented, not `@skip-no-ui` folklore; no new product behavior.

## Goals / Non-Goals

**Goals:**

- Product Gherkin for partner-list enhancements and sales-export (period, table, CSV, ADMIN-only).
- Playwright happy paths (or named coverage-matrix deferrals with owner) using proximity selectors.
- Coverage matrix rows for every new scenario (`pass` or named skip/deferred).
- Sitemap, auth matrix, UI map, and gaps-and-decisions updated to match shipped behavior.
- OpenSpec deltas that require BDD/e2e + docs coverage (domain requirements already in main specs).
- Parent guide step 04 + Release Criteria closed.

**Non-Goals:**

- New sort modes, count definitions, export columns, or venue-scoped export.
- Events list page changes; partner portal / check-in.
- Changing sales-export or partner-list implementation beyond what e2e needs for accessible labels (fix labels only if a scenario cannot use proximity selectors).

## Decisions

1. **Keep sales-export scenarios in `admin-partners.feature`**
   - **Choice:** Add partner-list and sales-export scenarios to `docs/product/features/admin-partners.feature` and implement them in `e2e/specs/admin-partners.spec.ts` (same basename mapping).
   - **Rationale:** Export route lives under `/admin/partners/export`; BDD file-mapping rule is 1:1 basename; avoids a second feature file for a thin admin report.
   - **Alternatives:** Dedicated `admin-sales-export.feature` + `admin-sales-export.spec.ts` — acceptable if the partners feature file becomes unwieldy; default is keep together.

2. **Scenario set (minimum for release)**
   - **Partner list:** Name filter label (search control labeled/placeholder **Name**); sort by Name / Last created / Most events with both directions (may use Scenario Outline or a few representative scenarios covering all three modes + asc/desc); Active events column visible on a row with known seed data; Export action navigates to the export page.
   - **Sales export:** Valid period shows a tickets-sold table; CSV download returns attachment (assert response headers and/or download); ADMIN-only guard (guest or USER denied).
   - **Rationale:** Matches step-plan Spec Deltas; enough to lock the shipped contract without exhaustive combinatorial e2e.

3. **Demo seed as e2e fixture source**
   - **Choice:** Rely on `bun run seed:demo` (and existing admin create helpers where needed) so list/export assertions have partners, events, and `CONFIRMED`/`USED` bookings in the default period. Prefer asserting against seeded names/counts over creating full booking graphs in every test when seed already provides them.
   - **Rationale:** Step plan requires seed for coverage; shared staging DB patterns already used by admin e2e.
   - **Alternatives:** Every test creates partners/events/bookings via UI — slower and R2-heavy; accept seed + createPartnerViaUI hybrids as today.

4. **CSV assertion strategy**
   - **Choice:** Trigger the CSV link/URL (`format=csv` or equivalent) and assert `content-type` includes `text/csv` and `content-disposition` attachment (Playwright response interception or download event). Do not parse every row unless seed makes a specific count cheap to assert.
   - **Rationale:** Proves the download path without brittle full-file snapshots.
   - **Alternatives:** Save file and snapshot — brittle across environments.

5. **ADMIN-only scenario**
   - **Choice:** Prefer a guest (or signed-in USER) request to `/admin/partners/export` asserting redirect/deny per existing admin guard patterns used elsewhere. If USER session fixtures are awkward, record a named matrix deferral with owner `partner-list-and-sales-export-04` / follow-up and still keep the Gherkin scenario.
   - **Rationale:** Guard is already implemented; e2e should prove it when harness allows.
   - **Alternatives:** Skip ADMIN-only entirely — weaker release gate; only document in auth matrix — insufficient alone.

6. **Docs sync pack**
   - **Choice:** Update in one pass: `sitemap.md` (add `/admin/partners/export`; note list `q`/`sort`/`dir`/`page` + Active events), `authorization-matrix.md` (export under admin partners / booking-adjacent ADMIN row), `ui-component-map.md` Partners row (Name filter, sort, Active events, Export → sales export), `gaps-and-decisions.md` (Active = `date_time >= now` ∧ `remaining_capacity > 0`; tickets sold = sum `tickets_count` for `CONFIRMED`/`USED` by `created_at` in period). Confirm `post-mvp/partner-and-checkin.feature` untouched.
   - **Rationale:** Parent Release Criteria and step-plan deliverables.
   - **Alternatives:** Sitemap-only — leaves agents with conflicting SoT.

7. **Canonical openspec deltas = BDD coverage requirements**
   - **Choice:** ADDED requirements on `partner-catalog` and `booking` requiring Gherkin + Playwright/matrix coverage. Do not re-state domain UI requirements already present in main specs from steps 01–03; on archive, merge the BDD requirements into those specs.
   - **Rationale:** Step plan Spec Deltas; avoids duplicate MODIFIED blobs for already-shipped domain text.
   - **Alternatives:** MODIFIED full domain requirements — noisy and already folded.

8. **Parent close-out**
   - **Choice:** Mark `partner-list-and-sales-export-04-hardening` done in the parent guide and walk every Release Criteria checkbox after verification.
   - **Rationale:** This step closes the feature.

## Risks / Trade-offs

- **[Risk] Shared staging DB lacks bookings in the default 30-day window** → Mitigation: ensure demo seed creates recent `CONFIRMED` bookings; otherwise create via existing booking helpers or widen the period in the test URL.
- **[Risk] Sort/Active assertions flake on shared data order** → Mitigation: create a uniquely named partner (and event) in-test when asserting Active events / Name sort; use seed only when stable.
- **[Risk] CSV download hard to assert in Workers/CI** → Mitigation: response-header check; named env skip if download API unavailable, with matrix note.
- **[Risk] Combinatorial sort e2e (3×2) is slow** → Mitigation: Scenario Outline in Gherkin; Playwright may cover all modes with fewer browser navigations or one outline-driven loop documented in the spec file.
- **[Trade-off] Sales export living under admin-partners.feature** → Slightly broader feature file; clearer route ownership and BDD mapping.
- **[Trade-off] No product behavior change** → Docs/tests-only PR; still requires seed + e2e env to verify Release Criteria.

## Migration Plan

1. Author Gherkin scenarios; update sitemap, auth matrix, UI map, gaps-and-decisions, coverage-matrix stubs.
2. Implement Playwright tests (or named deferrals); ensure demo seed supports assertions.
3. Run lint, typecheck, seed:demo, targeted e2e; fill matrix `pass` / skip notes.
4. Mark parent step 04 done; confirm Release Criteria.
5. Archive this OpenSpec change (folds BDD coverage requirements into main `partner-catalog` / `booking` specs).
6. Rollback: revert docs/tests PR — no schema or runtime rollback.

## Open Questions

- None blocking. Prefer keeping sales-export Gherkin in `admin-partners.feature`; split only if the file becomes hard to maintain during apply.
