## Context

Parent feature: remove event target age groups (`.dev-plan/current-iteration/01-event-remove-age-groups-parent-guide.md`), single child step — remove everywhere.

Current state:

- **Schema:** `events.target_age_groups` is `text[]` on `packages/db/src/schema/events.ts` (since `0001_hot_sage.sql`); still in Drizzle snapshots through `0015`.
- **Domain:** `CreateEventInput` / `UpdateEventInput` and create/update/clone in `packages/db/src/catalog/events.ts` read/write `targetAgeGroups`. Booking unit fixtures set `targetAgeGroups: null`.
- **Admin UI:** `EventAdminBaseFields` renders `CheckboxMultiSelect` `name="target_age_groups"` via `getEventAgeGroupOptions`; labels in `admin-content.ts`; parse/map in `admin-event-form.ts`, `admin-event-input.ts`, `admin-event-route-helpers.ts`, `event-admin-types.ts`.
- **Public detail:** No UI currently renders event age groups (absence already asserted in discovery e2e); column still exists and admin can set it.
- **Product SoT:** `admin-events.feature` optional metadata + age-groups multi-select scenarios; `event-discovery.feature` guest DETAILS scenario mentions Target age groups / Zielgruppe; `schema-overview.md` lists the column; design-system / i18n / gaps cite event age groups.
- **Tests:** `admin-event-form.test.ts` parses `target_age_groups`; e2e `Scenario: Age groups multi-select without search`; coverage-matrix rows.

Constraints: SSR form POSTs; business logic in `@unveiled/db`; do **not** touch member onboarding `profile.age_group`; HeroUI + native checkbox multi-select for **languages** stays; packages must not import `apps/web`.

## Goals / Non-Goals

**Goals:**

- Drop `events.target_age_groups` with a Drizzle migration; remove from schema TS.
- Strip `targetAgeGroups` from catalog create/update/clone types and writes.
- Remove admin field, options helper, form I/O, fixtures, and copy keys.
- Update unit/e2e/coverage matrix and product docs so requirements match “no event age groups.”
- Grep-clean app + packages of `target_age_groups` / `targetAgeGroups` / `getEventAgeGroupOptions`.

**Non-Goals:**

- Onboarding step 1 / member `age_group` / admin user preference age display.
- Browse-events filters or multi-datetime.
- Removing languages, subtitles, or barrier-free metadata.
- Reintroducing public DETAILS age-group display (already absent).

## Decisions

1. **Hard drop column (discard data)**
   - **Choice:** Migration `ALTER TABLE events DROP COLUMN IF EXISTS target_age_groups;` (via `bun run db:generate` after schema edit). No backfill, no soft-delete.
   - **Rationale:** Field was optional metadata; parent guide accepts discard. Keeps schema aligned with product.
   - **Alternatives:** Leave column unused (rejected — dead surface); rename/archive table (overkill).

2. **Ignore legacy POST fields (do not error)**
   - **Choice:** Stop parsing `target_age_groups` in admin form helpers. If a stale client posts the field, it is ignored (never written).
   - **Rationale:** Parent release criteria: create/update ignore legacy POST fields; no need for rejection UX.
   - **Alternatives:** Explicit validation error on unexpected field (rejected — noisy for stale tabs).

3. **Languages multi-select stays; only age UI removed**
   - **Choice:** Keep searchable `CheckboxMultiSelect` for `languages` and related language-independent / subtitle UX. Delete age-group block, `getEventAgeGroupOptions`, and `targetAgeGroupsLabel` only.
   - **Rationale:** Step plan out of scope for languages; design-system still prefers checkbox multi-select for remaining allowlists.
   - **Alternatives:** Refactor languages control in same PR (rejected — scope creep).

4. **Product docs + OpenSpec deltas in same change**
   - **Choice:** Update canonical `docs/product/` feature files, schema overview, design-system mention, coverage matrix, and OpenSpec capability deltas (`admin-events`, `event-catalog`, `event-discovery`, `design-system`) in this PR.
   - **Rationale:** Single-step feature; release criteria require canonical specs updated before close.
   - **Alternatives:** OpenSpec-only first (rejected — product SoT is `docs/product/`).

5. **Discovery DETAILS scenario: keep zip assertion; drop age-group as product requirement of a field**
   - **Choice:** Rewrite guest DETAILS scenario to assert no Zip/PLZ in DETAILS (and still no Target age groups / Zielgruppe row for regression). Remove admin age-groups e2e entirely.
   - **Rationale:** Step-plan event-discovery delta; age-group row never shipped on detail UI but Gherkin still named it.
   - **Alternatives:** Delete entire DETAILS scenario (rejected — zip omission still valuable).

6. **Migration filename via Drizzle generate**
   - **Choice:** Edit schema → `bun run db:generate` → review SQL → apply with migrate as part of normal deploy/`bun run build`.
   - **Rationale:** Matches repo Phase 2+ workflow; next number after `0015_event_subtitles.sql`.
   - **Alternatives:** Hand-written SQL only (risk of meta snapshot drift).

## Risks / Trade-offs

- **[Risk] Staging/prod rows lose age-group values on migrate** → Mitigation: accepted; optional metadata; communicate in PR.
- **[Risk] Missed fixture / insert still referencing column** → Mitigation: typecheck + grep sanity after domain change; fix booking/story fixtures in same PR.
- **[Risk] Stale admin browser tab posts age groups** → Mitigation: ignore field; no write path.
- **[Trade-off] Historical drizzle snapshots still mention the column** → Acceptable; do not rewrite old migrations.
- **[Trade-off] OpenSpec `openspec/specs/` is not product SoT** → Still ship deltas for archive workflow; prioritize `docs/product/` updates.

## Migration Plan

1. Remove column from Drizzle schema; generate + review migration; update catalog domain + admin + tests/docs.
2. Deploy with `db:migrate` (via build/deploy pipeline) so Workers and DB stay in sync — **do not** ship app code that still writes the column after drop, or drop before code that still selects it.
3. Rollback: restore previous migration + code revision; dropped data is not recoverable without backup restore.

## Open Questions

- None blocking. Confirm no CSV/export/admin list column (current code is form-only) during implementation grep.
