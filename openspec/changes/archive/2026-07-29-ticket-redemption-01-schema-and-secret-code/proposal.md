## Why

Events still model secret codes with `secret_code_mode` (`MANUAL` | `SHARED_GENERATED` | `UNIQUE_PER_BOOKING`) and vouchers as a single shared `promo_code` on the event row. Product now wants secret codes always manual, and vouchers as per-ticket inventory pools (promo lines or PDF tickets). This step lands the data-layer foundation so allocation (02), admin stock UI (03), and member reveal/download (04) have tables and types to build on.

## What Changes

- **BREAKING:** Remove `secret_code_mode` enum/column and all generated-secret paths; `SECRET_CODE` always uses admin-configured `events.secret_code`.
- **BREAKING:** Expand `ticket_type` to `SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF`; migrate legacy `VOUCHER` → `VOUCHER_PROMO`; stop treating event-level `promo_code` as the voucher redemption source for new writes.
- Add inventory tables for promo codes and PDF vouchers (`event_voucher_codes`, `event_voucher_pdfs`) with `AVAILABLE` | `ALLOCATED` status and FK to the consuming booking ticket when allocated.
- Add per-ticket redemption records (`booking_tickets`) so a booking with `tickets_count = N` can hold N redemption artifacts (step 02 will allocate; this step adds schema + types).
- Update catalog validation/defaults and TypeScript types in `@unveiled/db`; update seed/admin parsers and `resolveRedemption` / `bookEvent` enough for compile + SECRET_CODE behavior.
- Temporary gate: `VOUCHER_PROMO` / `VOUCHER_PDF` booking may return a typed error until step 02 wires inventory allocation — document clearly.
- Out of scope: allocation transaction (02), admin upload UI (03), member reveal/download UI (04), full product feature-file rewrite / BDD polish (05).

## Capabilities

### New Capabilities

- `ticket-redemption`: Voucher inventory tables and per-ticket redemption records; secret-code-only redemption model (no modes); ticket types `SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF`.

### Modified Capabilities

- `booking`: Redemption info no longer depends on secret-code modes or a single event `promo_code`; SECRET_CODE uses event `secret_code` only; voucher booking waits on inventory allocation (typed reject until 02).
- `event-catalog`: Event schema/validation/defaults drop `secret_code_mode` and legacy `VOUCHER` + required `promo_code`; support new ticket types and inventory-oriented redemption config (`secret_code` for SECRET_CODE; `event_website_url` still required for `VOUCHER_PROMO`).

## Impact

- **Schema / migrations:** `packages/db/src/schema/events.ts`, new inventory + `booking_tickets` schema modules, `schema/index.ts`, Drizzle migration via `bun run db:generate` / `db:migrate`.
- **Domain:** `packages/db/src/catalog/validation.ts` (+ tests), `packages/db/src/booking/redemption.ts` (+ tests), `book-event.ts` call sites; seed data that sets modes / `VOUCHER` / `promo_code`.
- **App compile shims:** `apps/web` admin event form parsers / fields that reference `secretCodeMode` or `VOUCHER` — minimal type-safe updates so lint/typecheck pass (full voucher admin UI is step 03).
- **Docs this step:** optional implementer note only; canonical `docs/product/` feature files owned by step 05. Parent guide mark step 01 done on merge.
- **Source brief:** `.dev-plan/current-iteration/ticket-redemption-01-schema-and-secret-code.md`
- **Parent:** `.dev-plan/current-iteration/ticket-redemption-parent-guide.md`
- **Depends on:** none
- **Consumed by:** `ticket-redemption-02-allocation-domain`
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test packages/db` (validation/redemption unit tests); `db:generate` + migrate succeeds against local/dev DB
