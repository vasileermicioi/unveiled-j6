## Why

Admins reuse event metadata by creating multi-slot **event series**. Product is replacing that with single-event **clone**. Domain must ship `cloneEvent` and remove `createEventSeries` first so step 02 UI cannot depend on dead APIs.

## What Changes

- Add `cloneEvent(db, sourceEventId, input)` in `@unveiled/db` that creates a distinct event from a source row with an explicit `dateTime` (and create-mode voucher inventory when required).
- Clone copies catalog metadata and primary `imageId`, resets `remaining_capacity` to `total_capacity`, derives weekday/start minutes, and copies gallery join rows when present.
- Clone does **not** copy bookings, waitlist, featured membership, or voucher inventory rows.
- **BREAKING:** Remove `createEventSeries`, `validateUniqueSeriesSlots`, and series-only package tests/docs.
- Keep `createEvent` for blank creates.
- Minimal web compile shims so lint/typecheck stay green until series routes are deleted in step 02 (no clone UI in this step).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Add ADMIN-facing clone domain requirements (metadata copy, capacity reset, gallery copy, voucher inventory required for voucher types, no featured/bookings/waitlist/inventory copy). Remove series create / duplicate-slot domain requirements tied to `createEventSeries`.

## Impact

- **Domain:** `packages/db/src/catalog/events.ts` — add `cloneEvent`; remove `createEventSeries`.
- **Validation:** `packages/db/src/catalog/validation.ts` — remove `validateUniqueSeriesSlots` (+ tests in `validation.test.ts`).
- **Gallery:** reuse `listEventGalleryImageIds` / `addEventGalleryImages`.
- **Voucher:** reuse `assertVoucherInventoryPresent` (create mode) + existing append helpers when inventory is supplied on clone input (same create semantics).
- **Exports/docs:** `packages/db` package entry + `packages/db/README.md`.
- **Tests:** new clone unit/integration coverage; delete series API tests.
- **Web (compile only):** `apps/web/.../admin/events/series/new.tsx` (and any other `createEventSeries` callers) must not import the removed API — stub/redirect/remove import minimally; full SSR clone UI and series route deletion are step 02.
- **Source brief:** `.dev-plan/current-iteration/clone-event-01-domain.md`
- **Parent:** `.dev-plan/current-iteration/clone-event-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `clone-event-02-admin-ui`
- **Verification:** `bun run lint`; `bun run typecheck`; `@unveiled/db` catalog tests for clone + absence of series API
