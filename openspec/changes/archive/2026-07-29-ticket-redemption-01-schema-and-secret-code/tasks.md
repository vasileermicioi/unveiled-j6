## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/ticket-redemption-01-schema-and-secret-code.md`, parent guide, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm prerequisites: `packages/db/src/schema/events.ts`, `bookings.ts`, `booking/redemption.ts`, `book-event.ts`, catalog `validation.ts`, admin form parsers in `apps/web`

## 2. Schema and migration

- [x] 2.1 Add `voucher_inventory_status` enum and Drizzle tables `booking_tickets`, `event_voucher_codes`, `event_voucher_pdfs` (per design Decisions 3–5); export from `schema/index.ts` and package barrel
- [x] 2.2 Update `events` schema: `ticket_type` → `SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF`; remove `secretCodeMode` / `secretCodeModeEnum` / `SecretCodeMode` type; stop requiring `promoCode` for writes (drop column if migration is clean)
- [x] 2.3 Run `bun run db:generate`; review SQL for enum remap (`VOUCHER` → `VOUCHER_PROMO`), drop `secret_code_mode`, inventory tables/FKs/indexes, and optional one-row legacy `promo_code` → `event_voucher_codes` seed then null `promo_code`
- [x] 2.4 Apply `bun run db:migrate` against local/dev DB and confirm success

## 3. Catalog validation and types

- [x] 3.1 Update `validateRedemptionConfig` / `RedemptionInput` / `applyEventDefaults`: no `secretCodeMode`; SECRET_CODE requires `secretCode`; VOUCHER_PROMO requires `eventWebsiteUrl` only; VOUCHER_PDF has no event-level promo/code requirement
- [x] 3.2 Update create/update event inputs and any catalog helpers that still reference `VOUCHER`, `promoCode` (as required), or `secretCodeMode`
- [x] 3.3 Update seed data / seed helpers that insert `VOUCHER`, secret modes, or rely on shared `promo_code`

## 4. Booking redemption shim

- [x] 4.1 Rewrite `resolveRedemption` for secret-code-only (`events.secretCode`); remove SHARED_GENERATED / UNIQUE_PER_BOOKING / legacy VOUCHER promo paths
- [x] 4.2 Reject `VOUCHER_PROMO` / `VOUCHER_PDF` in `resolveRedemption` or `bookEvent` with typed `BookingError` (e.g. `VOUCHER_INVENTORY_PENDING` or clear `INVALID_REDEMPTION_CONFIG` message) so no credits/capacity mutate
- [x] 4.3 Remove or stop exporting unused `generateSecretCode` if nothing else needs it; keep booking `redemption_*` writes for SECRET_CODE

## 5. App compile shims (minimal)

- [x] 5.1 Update `apps/web` admin parsers/types (`admin-event-form.ts`, related helpers/tests) for new ticket types and removal of `secret_code_mode` / required `promo_code`
- [x] 5.2 Update `EventAdminBaseFields` (+ copy in `admin-content`) to drop secret-mode select; expose ticket types needed for typecheck (full inventory upload UI deferred to step 03)
- [x] 5.3 Fix any other `apps/web` references to `VOUCHER` | `SecretCodeMode` | generated modes that break `typecheck`

## 6. Tests

- [x] 6.1 Update `packages/db/src/catalog/validation.test.ts` for new redemption rules
- [x] 6.2 Update `packages/db/src/booking/booking.unit.test.ts` (and related) for secret-code-only + voucher reject; delete SHARED_GENERATED / UNIQUE_PER_BOOKING / single-promo assertions
- [x] 6.3 Fix any integration/seed tests that insert removed enum values so `bun test packages/db` can pass when DB is available

## 7. Validation and handoff

- [x] 7.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 7.2 Run `bun test packages/db` (or scoped validation/redemption unit tests) (exit 0)
- [x] 7.3 Confirm migration path: `db:generate` coherent; `db:migrate` succeeds on local/dev
- [x] 7.4 Mark step 01 done in `.dev-plan/current-iteration/ticket-redemption-parent-guide.md`; note temporary VOUCHER_* booking rejection for step 02 in the PR/handoff
- [x] 7.5 Do not rewrite full product feature files (`docs/product/features/*`) — owned by step 05 — unless a minimal schema note is required for implementers
