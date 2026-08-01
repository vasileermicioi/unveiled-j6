## Context

Parent feature: Clone Event (`.dev-plan/current-iteration/clone-event-parent-guide.md`). Child step 03 — final slice; depends on 02 (done/archived).

Runtime behavior already matches parent release criteria for the admin workflow:

- `@unveiled/db` exports `cloneEvent` (not `createEventSeries`); voucher inventory is not copied; gallery join rows and primary `image_id` are reused by id.
- SSR route `/:locale/admin/events/:id/clone` exists (GET prefilled + POST); series route/UI/nav removed.
- Clone entry points: Events list (`cloneAction` / “Clone” / “Klonen”) and event edit page; clone page titles from `admin-content` (`cloneEventTitle` / “Clone event” / “Event klonen”).

What remains is the **verification and documentation layer**:

- `admin-events.feature` still has series create scenarios (manual slots, date-range builder) and series-create wording in image/Markdown/form scenarios.
- Sitemap still lists `/admin/events/series/new`; UI map still says “series”; design-system Form controls still cite “series builder weekdays”.
- Coverage matrix + Playwright still assert series create at `/admin/events/series/new`.
- Gaps/decisions, DEPLOYMENT, `e2e/README.md`, and possibly `packages/db/README.md` / i18n inventory may still describe series or omit clone.
- OpenSpec `event-catalog` Admin event SSR CRUD still says “docs updates MAY land in a follow-up step.”
- Parent guide still lists step 03 open; known image-delete reference-count gap deferred to this step’s gaps log.

Constraints: `docs/product/` is behavioral SoT (AGENTS.md); OpenSpec under `openspec/specs/` is a planning mirror only; BDD proximity/role selectors only (`docs/product/testing/bdd-and-e2e.md`); no new recurrence builders; no partner-portal clone; no domain/UI rewrites in this step.

## Goals / Non-Goals

**Goals:**

- Align Gherkin + sitemap + UI map + design-system notes + Playwright (+ coverage-matrix) with shipped clone-only duplication.
- Record decisions (series removed, clone added, inventory not copied; image-delete reference-count gap).
- Grep away stale `series/new` / `createEventSeries` product claims.
- Close parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- Changing `cloneEvent` domain rules or clone SSR form chrome from 01–02.
- Reintroducing RRULE / multi-slot preview builders.
- Partner-portal clone or bulk clone.
- Fixing the shared-image delete reference-count bug in this step (document only unless already trivial and in-scope — default: gaps log).
- Expanding e2e into full gallery/image edge coverage beyond clone happy-path (+ optional voucher inventory reject).

## Decisions

1. **Docs-and-BDD first, then e2e, then close-out**
   - **Choice:** Update product feature file + sitemap/UI map/design-system/gaps/DEPLOYMENT → Playwright + coverage-matrix → stale-claim grep → parent close-out.
   - **Rationale:** Step brief; e2e titles must match Gherkin verbatim; remove series before adding clone tests that would conflict with matrix rows.
   - **Alternatives:** Flip e2e before Gherkin (title drift); close parent before matrix (release criteria incomplete).

2. **Replace series Gherkin scenarios with clone scenarios (not amend titles in place)**
   - **Choice:** Remove `Create an event series with manual slots` and `Create an event series with a date-range builder`. Add clone scenarios whose titles match OpenSpec/`Admin clones an event` intent, e.g. `Clone event from catalog list`, `Clone voucher event requires inventory` (optional if fixture cost high), `Clone entry points visible` — verbatim titles in Playwright.
   - **Rationale:** Series scenarios are obsolete product claims; clone is a different workflow. Step Spec Delta requires clone acceptance scenarios and no required series-create scenarios.
   - **Alternatives:** Keep series titles as “removed” stubs — confuses SoT; skip voucher inventory e2e with named matrix deferral if inventory upload harness is heavy.

3. **Sitemap: series row → clone row**
   - **Choice:** Replace `/admin/events/series/new` with `/admin/events/:id/clone` (ADMIN, Clone event). Do not leave series as “deprecated but listed.”
   - **Rationale:** Sitemap is route SoT; series URL is gone.
   - **Alternatives:** Keep series as 404 note — agents may still implement against it.

4. **UI map + design-system: drop series wording**
   - **Choice:** Events row documents SSR CRUD + **clone** (not series). Design-system multi-value example drops “series builder weekdays”; keep languages/age groups.
   - **Rationale:** Step deliverables; series weekdays control no longer exists.
   - **Alternatives:** Leave design-system example — greppable lie.

5. **Playwright: delete series tests; add clone happy path**
   - **Choice:** Remove series `goto(.../series/new)` tests and series heading asserts. Add clone test(s): login as admin → open clone from list or edit → set date/time → submit → assert new event / redirect. Prefer `SECRET_CODE` seed event for happy path (no inventory). Voucher inventory reject: add when create-inventory helpers make it cheap; else matrix-document named deferral (not “UI not built”). Selectors: proximity/layout only (`getByRole` link “Clone”/“Klonen”, labels for date/time).
   - **Rationale:** Step Spec Delta bdd-and-e2e; series must not remain as skipped “UI not built.”
   - **Alternatives:** Keep series tests as `test.skip` with “removed” — still pollutes suite; prefer deletion + matrix removed/absent.

6. **Coverage matrix: series → removed; clone → pass/skip**
   - **Choice:** Delete or mark series rows as removed (status that is not `skip` for missing UI). Add clone scenario rows pointing at new Playwright titles (`pass` or named env `skip`).
   - **Rationale:** Matrix is CI/agent index; step forbids “UI not built” framing for series.
   - **Alternatives:** Leave series as `pass` — CI/docs lie.

7. **Gaps-and-decisions: record clone-vs-series + image gap**
   - **Choice:** Append/update decision: series create removed; clone is the duplication path; voucher inventory not copied; gallery/primary image ids reused; **confirmed gap** — `deleteEvent` can delete shared image objects still referenced by source or clone (parent Risks). No code fix required in this step unless already landed.
   - **Rationale:** Parent Risks deferred documentation to step 03.
   - **Alternatives:** Silent gap — next agent deletes images unsafely without warning.

8. **OpenSpec Admin event SSR CRUD: drop “follow-up docs” hedge**
   - **Choice:** When syncing/modifying `event-catalog`, require sitemap + `admin-events.feature` to match clone routes now (remove “docs MAY land in a follow-up step”).
   - **Rationale:** This step is that follow-up.
   - **Alternatives:** Leave hedge — archive sync keeps stale permission.

9. **Parent close-out**
   - **Choice:** After verification, mark step 03 done in the parent guide; walk Release Criteria; confirm canonical docs describe clone-only duplication.
   - **Rationale:** Step closes the feature.
   - **Alternatives:** Leave parent open until optional voucher e2e lands — overblocks if happy-path clone passes and voucher is matrix-deferred.

## Risks / Trade-offs

- **[Risk] Series Gherkin still referenced from other docs/scenarios** → Mitigation: Decision 1 + repo-wide grep for `series/new`, `createEventSeries`, “event series”, series builder weekdays.
- **[Risk] Voucher inventory clone e2e is expensive** → Mitigation: Decision 5 — happy-path SECRET_CODE required; voucher reject optional with named matrix deferral.
- **[Risk] Image-delete shared-id gap misread as fixed** → Mitigation: Decision 7 — document as known gap, not resolved.
- **[Risk] Coverage-matrix / Gherkin title drift** → Mitigation: Decision 2 — write Gherkin titles first; copy verbatim into Playwright `test()`.
- **[Trade-off] No recurrence replacement** → Intentional; clone one occurrence at a time.

## Migration Plan

1. Land Gherkin + product docs + e2e/coverage-matrix + gaps decision + parent close-out notes.
2. Run lint/typecheck; targeted Playwright admin-events (clone; no series) when env allows — else document skip with assertions committed.
3. Mark parent guide step 03 + Release Criteria; sync OpenSpec main specs on archive.
4. No DB, env, or deploy migration; no new secrets.
5. Rollback: revert docs/e2e commits; runtime clone UI from 01–02 unchanged by this step’s happy path.

## Open Questions

- None blocking for planning. If voucher-inventory reject e2e is flaky or expensive, defer with a named coverage-matrix row (owner = this feature / step 03; domain unit coverage remains).
