## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/clone-event-01-domain.md` and parent clone rules (image reuse, gallery copy, no inventory/featured/bookings/waitlist copy, capacity reset)
- [x] 1.2 Inventory all `createEventSeries` / `validateUniqueSeriesSlots` callers and tests (`packages/db`, `apps/web` series route, README)

## 2. Implement cloneEvent

- [x] 2.1 Add `CloneEventInput` (`dateTime` required; optional `voucherInventory` payload type aligned with create helpers) and export `cloneEvent(db, sourceEventId, input)` from catalog events
- [x] 2.2 Load source via `getEventById`; reject missing source with `EVENT_NOT_FOUND`
- [x] 2.3 Map source metadata + new `dateTime` through `insertEventRow` (reuse source `imageId`; `remaining_capacity = total_capacity`; derive weekday/start minutes; copy SECRET_CODE / website / location / tags / accessibility fields per spec)
- [x] 2.4 For `VOUCHER_PROMO` / `VOUCHER_PDF`, `assertVoucherInventoryPresent(..., { mode: "create" })` and append inventory to the **new** event id; reject when inventory missing/empty; never copy source voucher rows
- [x] 2.5 Copy gallery join rows with `listEventGalleryImageIds` + `addEventGalleryImages` when source has gallery images
- [x] 2.6 Ensure clone does not insert into `featured_events` or touch bookings/waitlist

## 3. Remove series APIs

- [x] 3.1 Remove `createEventSeries` from `packages/db/src/catalog/events.ts` and any re-exports
- [x] 3.2 Remove `validateUniqueSeriesSlots` from validation module + its unit tests
- [x] 3.3 Update `packages/db/README.md` (and any export lists) to document `cloneEvent` and drop series create
- [x] 3.4 Minimal web compile shim: stop `apps/web/.../admin/events/series/new.tsx` from importing removed APIs (redirect/410 stub OK; no clone UI)

## 4. Tests and image-safety note

- [x] 4.1 Add catalog tests: clone success (new id, copied title/partner, new dateTime, capacity reset)
- [x] 4.2 Add tests: missing source rejected; voucher clone without inventory rejected; gallery ids copied; featured membership not copied
- [x] 4.3 Assert package has no remaining references to `createEventSeries` / series slot validator
- [x] 4.4 Verify event delete + shared primary/gallery image reference behavior; document pre-existing gap for step 03 if delete is unsafe

## 5. Verification and handoff

- [x] 5.1 Run `bun run lint` — exit 0
- [x] 5.2 Run `bun run typecheck` — exit 0
- [x] 5.3 Run `@unveiled/db` catalog tests covering clone + series removal — exit 0
- [x] 5.4 Mark step done in parent guide; handoff links change id `clone-event-01-domain` and parent guide; note image-reference follow-ups for step 03 gaps log
