## Why

Steps 01–02 locked native-first policy, shipped `.admin-native-number`, and rewrote admin selects — but credit price and total capacity still render through HeroUI `NumberField` (+/− steppers) in `AdminFormNumberField`. That blocks progressive enhancement and leaves the last admin numeric primitive out of sync with AGENTS §14. This step swaps those fields to native `<input type="number">` without changing SSR names or bounds.

## What Changes

- Rewrite `AdminFormNumberField` to native `<input type="number">` with `name`, `min`, `max`, `step`, `defaultValue`, `required`, accessible `Label` wiring, and `.admin-native-number`.
- Preserve call-site props (`name`, `label`, `defaultValue`, `minValue`, `maxValue`, `isRequired`) so `EventAdminBaseFields` keeps `credit_price` / `total_capacity` contracts.
- Add or update Ladle stories for the number field primitive.
- Optional low-risk cleanup: align admin numeric-ish `TextField`+`inputMode` fields (e.g. comp-ticket count) with the same primitive only if it does not change validation semantics.
- Remove unused HeroUI `NumberField` imports from this path.
- Mark step 03 done in the parent guide when verified.
- **Out of scope:** further Select work (02), Playwright NumberField/select fixture rewrite (04), profile `max_distance` (already native), booking-domain credit/capacity semantics.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Add admin event numeric-fields requirement — credit price and total capacity (and the shared admin number primitive) SHALL use native `<input type="number">`; HeroUI `NumberField` SHALL NOT be required for those fields; bounds and SSR field names unchanged.

## Impact

- **Code:** `apps/web/app/components/admin/AdminFormNumberField.tsx`; call site `EventAdminBaseFields.tsx` (credit price, capacity); new/updated stories; optional touch of `AdminCompTicketForm` / similar only if low-risk.
- **Theme:** consume existing `.admin-native-number` in `globals.css` (step 01) — no new visual tokens required.
- **POST contracts unchanged:** `credit_price`, `total_capacity`; parsers in `admin-event-form.ts` (`parseInteger` defaults 1 / 10) stay as-is.
- **E2E:** `e2e/fixtures/admin.ts` and `admin-events.spec.ts` still assume HeroUI NumberField steppers — debt for step 04; do not block unless a local run hard-fails.
- **Source brief:** `.dev-plan/current-iteration/native-form-controls-03-admin-number.md`
- **Parent:** `.dev-plan/current-iteration/native-form-controls-parent-guide.md`
- **Depends on:** `native-form-controls-02-admin-select` (done)
- **Consumed by:** `native-form-controls-04-e2e-and-release`
- **Verification:** `bun run lint`, `bun run typecheck`; manual smoke create/edit event with credit price + capacity
