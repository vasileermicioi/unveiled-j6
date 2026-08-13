## Context

Parent feature: move barrier-free from event to venue (`.dev-plan/current-iteration/01-partner-barrier-free-parent-guide.md`), step 02 of 02 — surfaces, cutover, drop `events.barrier_free`, Gherkin/e2e, canonical docs.

Step 01 is merged (`partner-barrier-free-01-schema-and-domain`, archived 2026-08-13):

- `partners.barrier_free` nullable boolean, no default. `CreatePartnerInput` / `UpdatePartnerInput` persist `true` | `NULL`; `false` coerces to `NULL`. Reads return `barrierFree` on `getPartnerById` / `listPartners` / `listFeaturedPartners`.
- Partner writes do **not** dual-write `events.barrier_free`. Public DETAILS still reads `event.barrierFree`.

Current live source (this step removes):

- Admin event Yes/No select in `EventAdminBaseFields` (`name="barrier_free"`, `"on"` → `true`, else `null` in `admin-event-form.ts`). Clone copies `source.barrierFree`. Seed writes `event.barrierFree` (Abundo fixtures are all `false`; voucher demo events in `seed.ts` also `false`).
- `EventDetailPage` `accessibilityValue(event.barrierFree)` — `true` → Barrierefrei / Barrier-free; `false` → Nicht barrierefrei / Not barrier-free; else Keine Angabe / Not specified.
- Public event route already loads the hosting partner for logo/hours (`getPartnerById` in `apps/web/app/routes/[locale]/events/[id].tsx`) and passes `partnerAttribution` without `barrierFree`.

Constraints: SSR form POST only; HeroUI + native select (hard rule §14); yellow page / theme tokens unchanged; i18n via existing `getAdminCopy().barrierFreeLabel` / `optionYes` / `optionNo`; product SoT is `docs/product/`; Playwright titles match Gherkin verbatim; proximity selectors; R2 skip only when partner create needs a logo. Product locks: **true | NULL**; no Discover filter; member `profile.accessibility` is unrelated.

## Goals / Non-Goals

**Goals:**

- Admins set optional barrier-free on partner create/edit (native Yes/No, near opening hours).
- Public `/events/:id` DETAILS Accessibility row reads `partner.barrierFree`.
- Event create/edit/clone no longer collect or store barrier-free.
- Backfill partners from events (`bool_or`, any `true` wins, otherwise `NULL`), then drop `events.barrier_free`.
- Seed, fixtures, Gherkin, Playwright, schema-overview, UI map, coverage matrix match shipped behavior.
- Mark step 02 and the parent feature released.

**Non-Goals:**

- Discover / `/events` filter by barrier-free.
- Member onboarding/profile “Accessibility needed?” (`users.profile.accessibility`).
- Stored `false` as “not barrier-free.”
- Partner portal / check-in.
- Changing opening-hours UX except placing the new control next to it.
- New design tokens or page-background changes.

## Decisions

1. **Partner form control copies the event select contract**
   - **Choice:** Reuse `AdminFormSelect` with `name="barrier_free"`, options `{ id: "off", label: copy.optionNo }` / `{ id: "on", label: copy.optionYes }`, `defaultSelectedKey={defaults?.barrierFree === true ? "on" : "off"}`, label `copy.barrierFreeLabel` (already “Barrierefrei” / “Barrier-free”). Place the select in `PartnerForm` immediately **after** the opening-hours `Surface`, before submit/cancel. Parse in `parsePartnerFormBody`: `asString(body.barrier_free) === "on" ? true : null`. Pass `barrierFree` into `createPartner` / `updatePartner`. Re-render defaults include `barrierFree` on validation errors and GET edit.
   - **Rationale:** Same POST mapping as today’s event field; hard rule §14; copy already exists so no new i18n keys. Opening-hours adjacency matches the step plan.
   - **Alternatives:** HeroUI `Select` (forbidden); checkbox (cannot express Yes vs unset as clearly); put the control above logo (weaker venue-metadata grouping).

2. **Event detail reads partner attribution, not the event row**
   - **Choice:** Extend `EventDetailPartnerAttribution` with `barrierFree: boolean | null`. Route sets `barrierFree: partner?.barrierFree ?? null`. `EventDetailPage` calls `accessibilityValue(partnerAttribution?.barrierFree ?? null, locale)`. Keep the unused `false` branch in `accessibilityValue` (parent lock: defensive reads only). Do not read `event.barrierFree`.
   - **Rationale:** Partner is already fetched; hours are ungated the same way. Missing partner → “Not specified.”
   - **Alternatives:** Keep reading the event column until after deploy (two sources); hide the row when unset (rejected — row stays, value is “Keine Angabe”).

3. **Strip event-level field from catalog and admin in the same PR as the drop**
   - **Choice:** Remove `barrierFree` from `CreateEventInput` / `UpdateEventInput` / `cloneEvent` (`source.barrierFree` copy), Drizzle `events.barrierFree`, parsers (`EventFormValues`, `admin-event-form.ts`, `admin-event-input.ts`, `admin-event-route-helpers.ts`), `EventAdminBaseFields` select, and tests/fixtures that only existed for the column (`admin-event-form.test.ts`, `admin-event-route-helpers.test.ts`, `booking.unit.test.ts`, `e2e/fixtures/catalog.ts`, `e2e/fixtures/waitlist.ts`, Ladle `fixtures.ts`). After drop, TypeScript `Event` has no `barrierFree`.
   - **Rationale:** No dual-write leftover (release criterion). Clone inherits accessibility from the hosting partner at read time.
   - **Alternatives:** Leave catalog inputs accepting a ignored field (dead API); dual-write until a later cleanup (fails parent release).

4. **Backfill: `bool_or` then coerce non-true to `NULL`, then drop**
   - **Choice:** One Drizzle migration, SQL order:
     1. `UPDATE partners AS p SET barrier_free = x.lifted FROM (SELECT partner_id, bool_or(barrier_free) AS lifted FROM events GROUP BY partner_id) AS x WHERE p.id = x.partner_id AND x.lifted IS TRUE;`
        Partners with no `true` event stay `NULL` (including all-`false` and all-`NULL` event sets). Do **not** write `false`.
     2. `ALTER TABLE events DROP COLUMN barrier_free;`
     Run `bun run db:generate`, then edit the generated SQL if it only emits the drop — the backfill MUST precede the drop in the same file. Partners with no events are unchanged (`NULL`).
   - **Rationale:** Parent backfill rule is `bool_or` (any `true` wins) **and** stored tri-state is `true | NULL`. Postgres `bool_or` of `{false}` is `false`; writing that would violate the lock. Restricting the UPDATE to `lifted IS TRUE` is the coerce.
   - **Alternatives:** Raw `SET barrier_free = bool_or(...)` (persists `false`); `bool_and` (too strict); leave mixed event values and skip backfill (loses historical Yes).

5. **Seed: lift `true` from fixture events onto the partner; stop writing event `barrierFree`**
   - **Choice:** Add optional `barrierFree?: boolean | null` on `FixturePartner` (default omit → `NULL`). When mapping catalog, if any of that partner’s fixture events have `barrierFree === true`, pass `barrierFree: true` into `createPartner`. Remove `barrierFree` from `FixtureEvent`, `CreateEventInput` seed writes, Abundo JSON event objects, and `seed.ts` voucher demo `createEvent` calls. Do **not** invent a demo `true` — current fixtures are all `false`, so demo partners stay `NULL` until an author sets a partner-level true (or a future fixture event `true` lifts).
   - **Rationale:** Step plan lift rule; empty catalog seed remains honest. Public DETAILS will show “Not specified” for demo events unless a partner is later marked Yes.
   - **Alternatives:** Force one demo partner to `true` for screenshots (rejected unless product asks); keep writing event `false` until drop (column gone).

6. **Gherkin titles are locked so Playwright can match them verbatim**

   | File | Title | Intent |
   |---|---|---|
   | `admin-partners.feature` | `Set barrier-free on create` | Create partner, Yes on Barrierefrei / Barrier-free; stored `true`. R2 skip (logo). |
   | `admin-partners.feature` | `Clear barrier-free on edit` | Edit that partner, set No; stored `null`. R2 skip. |
   | `admin-events.feature` | `Optional audience metadata without barrier-free` | **Replace** `Optional accessibility and audience metadata`. Languages / language-independent / subtitles remain; **no** barrier-free control; **no** target age groups. |
   | `event-discovery.feature` | `Event detail shows partner barrier-free` | Public detail, partner `barrier_free` true → DETAILS shows Barrierefrei / Barrier-free. |
   | `event-discovery.feature` | `Event detail when partner barrier-free is unset` | Partner `null` → Keine Angabe / Not specified. |

   - **Rationale:** Step-plan scenario names + BDD contract. Splitting the old admin-events line keeps languages/subtitles coverage without asserting a removed control.
   - **Alternatives:** Keep the old title and only change the Then (Playwright title would drift from meaning).

7. **E2E: partner helper + public detail; event helper drops `barrierFree`**
   - **Choice:**
     - `adminLabels.barrierFree` stays “Barrierefrei” (same accessible name on the partner form).
     - `createPartnerViaUI` gains optional `barrierFree?: "Ja" | "Nein" | "Yes" | "No"` and uses `selectOptionByLabel(page, adminLabels.barrierFree, …)` **before** submit (same pattern as event create today).
     - Remove `CreateEventOverrides.barrierFree` and the event-form select in `createEventViaUI`.
     - New tests in `admin-partners.spec.ts` for the two partner titles (R2 skip).
     - Rewrite `admin-events.spec.ts` `Optional audience metadata without barrier-free`: create event with language (not barrierFree); assert languages/subtitles controls exist; assert `getByLabel(adminLabels.barrierFree)` count is 0 on the event form.
     - Add `event-discovery.spec.ts` tests for the two detail titles. Prefer creating a partner with Yes via admin UI (R2 skip) then an event, then open public detail as guest. Unset path: partner created without selecting Yes (default No → `null`).
     - `selectOptionByLabel` on partner form: DE options are `copy.optionYes` / `optionNo` (“Ja” / “Nein”).
   - **Rationale:** Step plan: move assertion off event form; R2 skip only when logo upload is required. No `data-testid`.
   - **Alternatives:** DB helper to set `partners.barrier_free` without UI (faster, weaker — still add one UI create path).

8. **Canonical docs in this step (not a later cleanup)**
   - **Choice:**
     - `schema-overview.md`: partners `barrier_free` is the live venue flag (`true` \| `NULL`). Remove `events.barrier_free` row (and the “until step-02 cutover” note).
     - `ui-component-map.md` Event detail: DETAILS Accessibility / Barrierefreiheit from hosting partner (ungated). Partners row: native barrier-free select on create/edit near opening hours.
     - `coverage-matrix.md`: rows for the five titles above; old “Optional accessibility and audience metadata” row retitled.
     - Step 01 dual-write scenario in OpenSpec `partner-catalog` is retired (column gone).
   - **Rationale:** Parent release criteria list these files. Agents will reintroduce the event field if schema-overview still lists it.

9. **Integration test after drop**
   - **Choice:** Keep `barrier-free.integration.test.ts` partner persist/omit/clear/coerce. Remove the assertion that partner writes leave `events.barrier_free` unchanged (column will not exist). Event catalog tests must not pass `barrierFree` on create/update/clone.
   - **Rationale:** Domain contract for partners stays; event-column contract is gone.

## Risks / Trade-offs

- **[Risk] `bool_or` of all-`false` events is `false`** → Mitigation: UPDATE only when `bool_or(...) IS TRUE`; otherwise leave `NULL`. Admins can set Yes after deploy.
- **[Risk] Mixed historical event values** → Accepted. Any `true` wins; admins correct the partner. Document in parent guide (already there).
- **[Risk] Demo seed has no `true` partner** → DETAILS show “Not specified” on demo events. Mitigation: do not invent a true; optional follow-up fixture if staging demos need a Yes example.
- **[Risk] Event form and partner form share `adminLabels.barrierFree`** → After cutover the label only exists on partner pages; event tests must assert absence with `getByLabel` count 0, not a global page search that could match leftover copy.
- **[Risk] Custom SQL in a generated Drizzle migration** → Mitigation: generate, then prepend the backfill UPDATE before `DROP COLUMN`; never drop first.
- **[Risk] TypeScript fallout** (`Event.barrierFree` used in stories/tests) → Mitigation: grep `barrierFree` / `barrier_free` in `apps/`, `packages/`, `e2e/`, `docs/product/` after the drop (archive/history exempt).
- **[Trade-off] One PR does UI + drop** → Required so there is no window where the event form is gone but the column is still the live source (or vice versa). Rollback is revert the PR + down-migration (re-add column without restoring per-event values — acceptable; source of truth is partner).

## Migration Plan

1. Confirm step 01 column exists and partner domain persists it.
2. Partner form + parser + create/edit routes; event detail attribution; remove event form/catalog field (code compiles against still-present event column until step 4).
3. Generate migration; insert backfill UPDATE (true-only) then `DROP COLUMN`; `bun run db:generate` / migrate review.
4. Seed lift; delete event `barrierFree` writes; fix unit/integration tests.
5. Gherkin + Playwright + schema-overview + UI map + coverage matrix.
6. `cd packages/db && bun test`; `bun run typecheck`; `bun run lint`.
7. Mark step 02 done and the feature released in the parent guide.
8. **Rollback:** revert. Down migration MAY re-add `events.barrier_free` nullable with no backfill from partners (per-event history is not reconstructed). Do not drop `partners.barrier_free`.

## Open Questions

- None blocking. Whether to mark one demo partner `true` for staging screenshots is optional and out of this step unless a fixture event is already `true` (none are).
