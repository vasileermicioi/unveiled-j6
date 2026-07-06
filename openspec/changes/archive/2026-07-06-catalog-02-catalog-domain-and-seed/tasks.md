## 1. Setup

- [x] 1.1 Confirm catalog-01 migrations applied and `@unveiled/images` exports are available (`processImageFromBuffer`, `processImageFromUrl`, `deleteImageObjects`, `buildVariantUrl`)
- [x] 1.2 Read `admin-partners.feature`, `admin-events.feature`, and `schema-overview.md` for validation and field rules
- [x] 1.3 Add `@unveiled/images` dependency and `"test": "bun test"` script to `packages/db/package.json`

## 2. Catalog module scaffold

- [x] 2.1 Create `packages/db/src/catalog/` with `index.ts`, `errors.ts`, `validation.ts`, and `datetime.ts`
- [x] 2.2 Implement `CatalogValidationError` with stable error codes for form mapping
- [x] 2.3 Implement Europe/Berlin `start_time_minutes` and `weekday` helpers in `datetime.ts`
- [x] 2.4 Re-export catalog module from `packages/db/src/index.ts`

## 3. Partner domain

- [x] 3.1 Implement `createPartner`, `updatePartner`, `deletePartner`, `listPartners`, `getPartnerById` in `partners.ts`
- [x] 3.2 Validate required name, address, contact email; reject invalid email without insert
- [x] 3.3 Auto-generate `venue_check_in_token` on create when omitted; implement `regenerateVenueCheckInToken`
- [x] 3.4 Implement `renamePartnerSyncEvents` — propagate partner name to all related events in same transaction
- [x] 3.5 Reject partner delete when events exist (RESTRICT FK policy)

## 4. Image orchestration

- [x] 4.1 Implement `attachImageToPartner` and `attachImageToEvent` in `images.ts` calling `@unveiled/images`
- [x] 4.2 Enforce upload XOR remote URL; reject both or neither on attach
- [x] 4.3 Insert `images` row and upload six variants in transaction with entity write
- [x] 4.4 Implement `deleteImageRecord` — delete DB row and bucket objects synchronously on replace/delete per image-uploads §8

## 5. Event domain

- [x] 5.1 Implement `createEvent`, `updateEvent`, `deleteEvent`, `listEvents`, `getEventById` in `events.ts`
- [x] 5.2 Apply creation defaults (capacity 10, `SECRET_CODE`, `MANUAL`, `TIME_SLOT`); set `remaining_capacity = total_capacity`
- [x] 5.3 Validate redemption rules (`SECRET_CODE`/`MANUAL` requires code; `VOUCHER` requires promo + website URL)
- [x] 5.4 Compute and persist `start_time_minutes` and `weekday` on create and `date_time` update
- [x] 5.5 Implement `createEventSeries` — one row per unique slot, reject duplicates and empty slot list
- [x] 5.6 Implement `recalculateRemainingCapacity` and wire into capacity updates
- [x] 5.7 Stub `exportRedemptionCodesCsv` with headers-only CSV until Phase 6 bookings

## 6. Demo seed

- [x] 6.1 Add `packages/db/src/catalog/seed-data.ts` with demo partner/event payloads (remote logo URLs)
- [x] 6.2 Implement `scripts/seed-demo.ts` — empty-DB guard (both tables count zero), call domain functions, log skip on non-empty
- [x] 6.3 Verify root `bun run seed:demo` invokes script with `DATABASE_URL` from `.env`

## 7. Tests

- [x] 7.1 Add validation unit tests (invalid email, missing image, conflicting sources, redemption rules, series duplicates)
- [x] 7.2 Add integration tests for partner rename propagation and capacity recalculation (skip when `DATABASE_URL` unset)
- [x] 7.3 Add seed idempotency test — second run produces no new rows

## 8. Documentation and verification

- [x] 8.1 Update `packages/db/README.md` with catalog exports, test command, and seed usage
- [x] 8.2 Run `cd packages/db && bun test` — all catalog tests pass
- [x] 8.3 Run `bun run seed:demo` twice on fresh DB — first creates data, second no-ops
- [x] 8.4 Run `bun run typecheck && bun run lint` — pass
