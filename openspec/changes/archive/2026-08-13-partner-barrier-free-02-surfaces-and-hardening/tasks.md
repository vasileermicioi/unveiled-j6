## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/01-partner-barrier-free-02-surfaces-and-hardening.md`, parent guide release criteria / non-goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 01 is merged: `partners.barrier_free` exists; partner create/update persist `true` | `NULL`; event form still has the barrier-free select; DETAILS still reads `event.barrierFree`

## 2. Partner admin surface

- [x] 2.1 Add native `AdminFormSelect` to `PartnerForm` after the opening-hours block (`name="barrier_free"`, Yes=`on` / No=`off`, label `copy.barrierFreeLabel`, `defaultSelectedKey` true → `on` else `off`). Extend `PartnerFormDefaults` with `barrierFree?: boolean | null`
- [x] 2.2 Parse `barrier_free` in `parsePartnerFormBody` (`"on"` → `true`, else `null`); pass `barrierFree` on partner create/edit POST and re-render defaults (GET edit + validation error)

## 3. Public event detail

- [x] 3.1 Extend `EventDetailPartnerAttribution` with `barrierFree: boolean | null`; set it from `partner?.barrierFree ?? null` in `apps/web/app/routes/[locale]/events/[id].tsx`
- [x] 3.2 DETAILS Accessibility cell uses `accessibilityValue(partnerAttribution?.barrierFree ?? null, locale)`; stop reading `event.barrierFree`; keep the unused `false` display branch

## 4. Remove event-level field (code)

- [x] 4.1 Remove the barrier-free select from `EventAdminBaseFields`; drop `barrierFree` from `EventFormValues`, `admin-event-form.ts` parser, `admin-event-input.ts`, `admin-event-route-helpers.ts`, and related unit tests
- [x] 4.2 Remove `barrierFree` from `CreateEventInput` / `UpdateEventInput` / `cloneEvent` (`source.barrierFree` copy) and catalog/booking/Ladle fixtures that only existed for the column (`seed.ts` voucher demos, `e2e/fixtures/catalog.ts`, `e2e/fixtures/waitlist.ts`, `apps/web/app/components/stories/fixtures.ts`, `booking.unit.test.ts`)

## 5. Migration, seed, domain tests

- [x] 5.1 `bun run db:generate` for dropping `events.barrier_free`; prepend SQL that sets `partners.barrier_free = true` only where `bool_or(events.barrier_free) IS TRUE` (leave otherwise `NULL` — do not persist `false`); drop the event column after backfill; remove `barrierFree` from Drizzle `events`
- [x] 5.2 Seed: lift `true` from any fixture event onto that partner; remove `barrierFree` from `FixtureEvent`, Abundo JSON events, and event seed writes. Current fixtures are all `false` — demo partners stay `NULL`; do not invent a true partner
- [x] 5.3 Update `packages/db/src/catalog/barrier-free.integration.test.ts`: keep partner persist/omit/clear/coerce; remove the “leave event `barrier_free` unchanged” assertion. Event catalog tests must not pass `barrierFree`

## 6. Gherkin, Playwright, canonical docs

- [x] 6.1 Update `docs/product/features/admin-partners.feature` with exact titles `Set barrier-free on create` and `Clear barrier-free on edit`. Replace `admin-events.feature` `Optional accessibility and audience metadata` with `Optional audience metadata without barrier-free` (languages/subtitles remain; no barrier-free; no age groups). Add `event-discovery.feature` `Event detail shows partner barrier-free` and `Event detail when partner barrier-free is unset`
- [x] 6.2 Playwright: `createPartnerViaUI` optional `barrierFree`; remove event-form `barrierFree` helper. Add partner tests (R2 skip). Rewrite admin-events test to the new title (assert no barrier-free control). Add event-discovery tests for partner true / unset DETAILS copy. `test("Scenario: …")` matches Gherkin verbatim; proximity selectors only
- [x] 6.3 Update `docs/product/database/schema-overview.md` (partners live source; drop events `barrier_free` row and cutover note), `docs/product/ui/ui-component-map.md` Event detail / Partners notes, and `docs/product/testing/coverage-matrix.md` rows for the five titles

## 7. Verification & handoff

- [x] 7.1 Grep `apps/`, `packages/`, `e2e/`, `docs/product/` for leftover event `barrierFree` / `barrier_free` (archive/history and member `profile.accessibility` exempt)
- [x] 7.2 Run `bun run db:generate` — backfill + drop migration present. `cd packages/db && bun test` — exits 0. `bun run typecheck` and `bun run lint` — exit 0
- [x] 7.3 Manual: partner Yes → event DETAILS “Barrierefrei” / “Barrier-free”; partner No/unset → “Keine Angabe” / “Not specified”; event new/edit has no Barrierefrei control
- [x] 7.4 Mark step 02 done and the feature released in `.dev-plan/current-iteration/01-partner-barrier-free-parent-guide.md`. Confirm canonical product specs match shipped behavior
