## Why

Schema (01) and Date & tickets layout (02) are in place, but capacity is still a SECRET_CODE-only number that voucher POSTs silently overwrite from inventory. Admins cannot choose Shared vs Per date, stamp per-row capacity, or see when voucher inventory disagrees with the datetime-capacity total. This is step 03 of 04 for parent feature `event-date-tickets`.

## What Changes

- After Timing mode: native Capacity allocation select (`capacity_mode`: `SHARED` | `PER_OCCURRENCE`) plus a native capacity number (`total_capacity`, min 1, default 10) for **all** ticket types. Remove SECRET_CODE-only gating. Mode-specific hints from the parent guide.
- `SHARED`: hide per-row (and per-slot) capacity inputs; posted `total_capacity` is the pool; catalog fills `occurrence_capacities`.
- `PER_OCCURRENCE`: each datetime row has a native capacity number (`event_capacity_${index}`, integer `>= 0`). New rows and range rebuilds stamp the current `total_capacity` field as the default. Changing the default does **not** rewrite rows the admin already edited unless the range builder rebuilds the list. Sum of row capacities is the capacity total; parser sets `occurrenceCapacities` and lets catalog derive `total_capacity`.
- Range builder: do not add per-slot capacity; generated rows all receive the default. ALL_DAY still uses the first slot for credits only.
- Totals below the datetime list (HeroUI `Paragraph` / `Alert`, not raw `<p>`): credits total (existing); datetime-capacity total (`SHARED` → capacity field; `PER_OCCURRENCE` → sum of rows); available codes/tickets when `VOUCHER_PROMO` / `VOUCHER_PDF` (create = preview count; edit = available + incoming, same append vs replace-unused rules as today’s inventory derive). Omit the inventory line for `SECRET_CODE`.
- When voucher inventory count ≠ capacity total: mark **those two** totals with HeroUI `Alert` `status="danger"` or a theme class (e.g. `.admin-form__total--mismatch`). No Tailwind `text-red-*`. Credits total is not part of the comparison.
- Remove silent `withVoucherCapacityFromInventory` overlay on create/edit/clone. Add `CAPACITY_INVENTORY_MISMATCH`; `eventFormErrorStep` maps it to step 2. `assertVoucherInventoryPresent` still required.
- Parser: `capacity_mode`, `event_capacity_*`; `toCreateEventInput` / `toUpdateEventInput` pass mode + arrays. Edit defaults from stored columns. Clone posts the same fields (copy source mode/capacities into defaults).
- DE/EN strings in `getAdminCopy` matching the parent guide; per-row capacity label **Capacity** / **Kapazität**.
- Out of scope: Playwright/Gherkin/canonical `docs/product/` (step 04); booking remaining per datetime; changing waitlist promotion.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Admin create, edit, and clone Date & tickets present Capacity allocation + a capacity number for every ticket type; Per date shows per-row capacity defaulted from that number; totals include credits, datetime capacity, and (voucher types) available codes/tickets; voucher inventory ≠ capacity total uses theme danger styling and submit rejects with `CAPACITY_INVENTORY_MISMATCH` instead of overwriting posted capacity from inventory.

## Impact

- **UI:** `EventAdminBaseFields.tsx` (allocation select + capacity for all ticket types), `EventAdminDateFields.tsx` (per-row capacity + totals), `CloneEventForm.tsx` (same allocation controls + totals vs new inventory), `PromoCodeInventoryFields.tsx` / `PdfVoucherInventoryFields.tsx` (lift preview/available count).
- **Copy:** `apps/web/app/lib/admin-content.ts` — locked parent-guide labels/hints; per-row **Capacity** / **Kapazität**; totals strings; `CAPACITY_INVENTORY_MISMATCH` mapping. Drop or replace `capacityFromInventoryHint` (capacity is no longer inventory-derived).
- **Parsers / helpers:** `admin-event-form.ts` (`capacityMode`, `event_capacity_*`, `EventDateTimeRow.capacity`, `eventFormErrorStep`); `admin-event-input.ts`; `admin-event-route-helpers.ts` (`eventToFormDefaults` / `formValuesToDefaults`); `admin-voucher-inventory.ts` (stop overlay; mismatch assert).
- **Domain:** `packages/db/src/catalog/errors.ts` — add `CAPACITY_INVENTORY_MISMATCH` if the throw type is `CatalogValidationError`. Catalog persist rules from step 01 stay; no new migration.
- **Routes:** `new.tsx` / `edit.tsx` / `clone.tsx` — stop `withVoucherCapacityFromInventory`; clone POST must pass `capacityMode` + `occurrenceCapacities` and must not overwrite posted `timingMode` / `capacityMode` from the form (ticket type stays source-locked).
- **Tests:** `apps/web/app/lib/admin-event-form.test.ts`, `admin-voucher-inventory.test.ts`, `admin-event-route-helpers.test.ts`; `packages/db/src/catalog/datetime.test.ts` only if mismatch validation lives in db.
- **Theme:** optional `.admin-form__total--mismatch` in `apps/web/app/styles/globals.css` `@layer components` only.
- **Source brief:** `.dev-plan/current-iteration/event-date-tickets-03-capacity-ui-and-totals.md`
- **Parent:** `.dev-plan/current-iteration/event-date-tickets-parent-guide.md`
- **Depends on:** `event-date-tickets-01-schema-and-domain`, `event-date-tickets-02-time-mode-and-field-order`
- **Consumed by:** `event-date-tickets-04-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/admin-event-form.test.ts app/lib/admin-voucher-inventory.test.ts app/lib/admin-event-route-helpers.test.ts`; `bun --filter @unveiled/db test src/catalog/datetime.test.ts` if catalog owns mismatch
