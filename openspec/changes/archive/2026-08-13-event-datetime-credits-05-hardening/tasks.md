## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-datetime-credits-05-hardening.md`, parent guide release criteria / non-goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 04 is merged: `bookings.date_time`, checkout native select, `ALLOW_MULTI_DATETIME_UI === true`. Diff shipped UI against the design title table before editing Gherkin
- [x] 1.3 Inventory stale copy: `docs/product/features/{admin-events,booking,event-discovery}.feature`, `schema-overview.md` ICS note, `gaps-and-decisions.md` parked/event-scoped row, `ui-component-map.md`, `coverage-matrix.md`, `e2e/specs/admin-events.spec.ts` skip, Ladle/seed comments

## 2. Canonical Gherkin

- [x] 2.1 Update `docs/product/features/admin-events.feature`: create says credits per datetime; keep add/remove; add per-datetime credits, total credits, range grid, rebuild-from-scratch, partner-hours defaults, closed-day skip using the **exact** titles in `design.md`
- [x] 2.2 Update `docs/product/features/booking.feature`: remove event-scoped / no-slot wording from Successful booking; replace `Book event with multiple datetimes` with `Book a priced datetime slot`; Post-booking actions ICS/confirm/email use booked datetime; member max uses selected occurrence price
- [x] 2.3 Update `docs/product/features/event-discovery.feature`: add `Dropdown changes credits` and `Guest checkout omits slot picker`; keep card/map next-upcoming + denormalized `credit_price`; keep DETAILS multi-datetime listing

## 3. Schema notes, gaps, UI map

- [x] 3.1 Update `docs/product/database/schema-overview.md`: add `bookings.date_time`; stop listing `events.date_time` as ICS/email source; keep `occurrence_credit_prices` and denormalized `credit_price` rule for cards/feed/map
- [x] 3.2 Replace the gaps-and-decisions “admin UI parked / MVP booking remains event-scoped” row with the shipped model (list + range builder + partner-hours defaults; member slot picker; capacity and waitlist still event-scoped)
- [x] 3.3 Update `docs/product/ui/ui-component-map.md`: admin Events — per-row credits, list total, range builder; event detail checkout — native datetime select for eligible members when ≥2 future occurrences

## 4. Playwright

- [x] 4.1 Unskip `Scenario: Add and remove datetimes on create` in `e2e/specs/admin-events.spec.ts`; fill per-row credits via `getByLabel`; keep R2 / `E2E_ADMIN_*` env skips. Delete `ALLOW_MULTI_DATETIME_UI` and all branches/comments that read it
- [x] 4.2 Add admin Playwright tests with verbatim titles: `Per-datetime credits persist`, `Range and two time slots generate a grid`, `Create prefills slots from partner open times`. Add `Total credits shown on the form`, `Changing the end date rebuilds from scratch`, and `Closed weekdays omitted from expansion` if assertable; otherwise coverage-matrix skip citing unit tests — not `@skip-no-ui`
- [x] 4.3 Add `e2e/specs/event-discovery.spec.ts` tests `Scenario: Dropdown changes credits` and `Scenario: Guest checkout omits slot picker` (`getByLabel` on `Datum und Uhrzeit` / `Date and time`). Seed or create a two-future-slot event with prices 1 and 4
- [x] 4.4 Add `e2e/specs/booking.spec.ts` `Scenario: Book a priced datetime slot`. Update Successful booking / Post-booking actions assertions so ICS/confirm time is the booked instant. Do not rename existing passing titles unless Gherkin changed
- [x] 4.5 If a native control lacks an accessible name, add HeroUI `Label` + `htmlFor` only. No `data-testid`. Scope duplicate “Credits” labels with layout/`nth`

## 5. Coverage, sweep, verification

- [x] 5.1 Update `docs/product/testing/coverage-matrix.md` rows for every new/changed Gherkin scenario (pass or named env skip)
- [x] 5.2 Sweep Ladle fixtures, seed comments, and `docs/product/` for “event-scoped booking”, “admin multi-datetime is parked”, and `ALLOW_MULTI_DATETIME_UI`. Grep `apps/`, `packages/`, `e2e/`, `docs/product/` must be clean (archive/history exempt)
- [x] 5.3 Sync `openspec/specs/{admin-events,booking,event-discovery}/spec.md` only if they still say Gherkin MAY wait or omit these product-doc requirements. Canonical SoT remains `docs/product/`
- [x] 5.4 Run `bun run lint` and `bun run typecheck` — both exit 0
- [x] 5.5 Run `bun run test:e2e -- e2e/specs/admin-events.spec.ts e2e/specs/booking.spec.ts e2e/specs/event-discovery.spec.ts`. New/unskipped scenarios pass when `E2E_ADMIN_*` + R2 + `DATABASE_URL` are present; remaining skips are documented env skips
- [x] 5.6 Mark step 05 done and the feature released in `.dev-plan/current-iteration/event-datetime-credits-parent-guide.md`. Confirm canonical specs match shipped behavior
