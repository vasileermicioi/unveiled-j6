## Context

Parent feature: Ticket Redemption (`.dev-plan/current-iteration/ticket-redemption-parent-guide.md`). Step 01 is schema + secret-code-only + inventory table shapes.

Today (`packages/db`):

- `ticket_type` enum: `VOUCHER` | `SECRET_CODE`
- `secret_code_mode` enum: `MANUAL` | `SHARED_GENERATED` | `UNIQUE_PER_BOOKING` on `events`
- Voucher redemption: single `events.promo_code` + `event_website_url`
- `resolveRedemption` generates codes for SHARED/UNIQUE modes; booking stores one `redemption_info` / `redemption_url` on `bookings`
- Admin form (`EventAdminBaseFields`, `admin-event-form.ts`) exposes mode select and single promo field

Product direction: secret codes always manual; vouchers are unique inventory pools allocated **per ticket** (not per booking). Steps 02–04 build allocation and UI on top of this schema.

Constraints: Drizzle `public` only; business types in `@unveiled/db`; packages never depend on `apps/web`; SSR mutations stay for later UI steps; keep app build green with temporary voucher booking reject until 02.

## Goals / Non-Goals

**Goals:**

- Migrate ticket types to `SECRET_CODE` | `VOUCHER_PROMO` | `VOUCHER_PDF`.
- Drop `secret_code_mode` from schema, types, validation, seed, admin parsers, and redemption.
- Add `event_voucher_codes`, `event_voucher_pdfs`, and `booking_tickets` tables + TypeScript types/exports.
- Catalog validation: SECRET_CODE requires `secretCode`; VOUCHER_PROMO requires `eventWebsiteUrl` (not legacy `promoCode`); VOUCHER_PDF has no event-level promo/code requirement this step.
- `resolveRedemption` / `bookEvent`: SECRET_CODE works from `events.secret_code`; VOUCHER_* return a typed booking error until 02.
- Unit tests updated; lint/typecheck/`bun test packages/db` green; migration generates and applies.

**Non-Goals:**

- Atomic inventory allocation / cancel return / capacity gating by inventory (02).
- Admin promo CSV / PDF upload UI (03).
- Member masked reveal / PDF download UI (04).
- Full `docs/product/features/*.feature` rewrite and Playwright polish (05).
- Dropping booking-level `redemption_*` columns yet (keep for SECRET_CODE denormalized display until 04/05 decide; inventory types may leave them null).
- Partner portal / check-in.

## Decisions

1. **Legacy `VOUCHER` → `VOUCHER_PROMO` without duplicating shared promo to capacity**
   - **Choice:** SQL migration maps `ticket_type = 'VOUCHER'` → `'VOUCHER_PROMO'`. If `promo_code` is non-null/non-empty, insert **one** `event_voucher_codes` row (`AVAILABLE`, code text = trim of legacy value). Do **not** fan out to `total_capacity` identical codes (that would fake unique inventory). Clear `events.promo_code` to null after seed insert (or leave null going forward); stop writing `promo_code` on create/update.
   - **Rationale:** Parent guide prefers unique inventory; shared one-code-for-all is removed. One migrated row preserves the old value for admin awareness; event stays effectively unbookable for vouchers until stocked + step 02 allocates (typed reject anyway).
   - **Alternatives:** Duplicate code × `total_capacity` (wrong uniqueness); keep writing `promo_code` (conflicts with inventory model).

2. **Keep nullable `events.promo_code` column this step (stop writes)**
   - **Choice:** Do not drop `promo_code` in the same migration as enum surgery unless Drizzle/SQL is trivial; mark unused for new writes; validation no longer requires it. Prefer drop in a follow-up migration within this step if generate is clean, otherwise leave column unused until 05 docs pass.
   - **Rationale:** Reduces migration risk; behavior gate is validation + redemption, not column absence.
   - **Alternatives:** Drop immediately in 01 (fine if migration is clean — implementer MAY drop if `db:generate` produces a safe ALTER).

3. **Inventory table shapes**
   - **Choice:**
     - `event_voucher_codes`: `id` uuid PK, `event_id` → `events.id` RESTRICT, `code` text NOT NULL, `status` enum `AVAILABLE` | `ALLOCATED`, `booking_ticket_id` uuid nullable FK → `booking_tickets.id`, `created_at` / `updated_at`. Unique `(event_id, code)`. Index `(event_id, status)` for allocation.
     - `event_voucher_pdfs`: `id` uuid PK, `event_id` → `events.id` RESTRICT, `object_key` text NOT NULL (R2 key), optional `original_filename` / `page_label` text, `status` same enum, `booking_ticket_id` nullable FK, timestamps. Unique `(event_id, object_key)`. Index `(event_id, status)`.
     - `voucher_inventory_status` enum shared by both tables.
   - **Rationale:** Matches Spec Delta; allocation FK points at ticket row (not booking) for per-ticket model.
   - **Alternatives:** Polymorphic single inventory table; store PDF bytes in DB (rejected — use R2 keys).

4. **`booking_tickets` shape**
   - **Choice:** `id` uuid PK, `booking_id` → `bookings.id` RESTRICT, `ordinal` integer NOT NULL (1..N), `redemption_code` text nullable, `redemption_url` text nullable, `voucher_pdf_id` uuid nullable FK → `event_voucher_pdfs.id`, timestamps. Unique `(booking_id, ordinal)`.
   - **Rationale:** One row per ticket; promo code text denormalized on ticket for read path; PDF via FK/object. Step 02 creates N rows inside the booking transaction; this step only adds schema (no writer required except migration of zero rows).
   - **Alternatives:** JSON array on booking (harder to FK inventory); only inventory FKs without ordinal (worse UX ordering).

5. **Circular FK: inventory ↔ booking_tickets**
   - **Choice:** Create `booking_tickets` first without requiring inventory FKs from tickets to codes; inventory tables reference `booking_ticket_id` nullable. Optional `voucher_pdf_id` on ticket may be added as nullable FK after both tables exist (migration order: enum → booking_tickets → event_voucher_codes → event_voucher_pdfs → alter ticket PDF FK if needed). Defer DEFERRABLE constraints unless Postgres requires it; prefer inventory owns the allocation pointer (`booking_ticket_id`) as source of truth for “which ticket consumed this asset,” and ticket stores denormalized `redemption_code` / optional `voucher_pdf_id` for member read.
   - **Rationale:** Avoid chicken-and-egg inserts; allocation in 02 can insert tickets then update inventory rows (or insert inventory allocated with ticket id in one txn).
   - **Alternatives:** Only ticket→inventory FK (then inventory status alone marks availability — also viable; if simpler in Drizzle, implementer MAY invert and drop `booking_ticket_id` from inventory in favor of unique partial index on ticket FK — document choice in PR if flipped).

6. **Ticket type enum migration in Postgres**
   - **Choice:** Add new enum values `VOUCHER_PROMO`, `VOUCHER_PDF`; update rows `VOUCHER` → `VOUCHER_PROMO`; recreate enum without `VOUCHER` (Postgres cannot drop enum values in-place easily — use the project’s usual rename/recreate pattern from prior migrations). Same for dropping `secret_code_mode` type after dropping the column.
   - **Rationale:** Matches Neon/Postgres + Drizzle realities.
   - **Alternatives:** Leave dead `VOUCHER` value forever (rejected — Spec Delta removes it).

7. **`resolveRedemption` / `bookEvent` shim**
   - **Choice:** SECRET_CODE: require trimmed `event.secretCode`; return `redemptionType: "SECRET_CODE"`, `redemptionInfo: code`, `redemptionUrl: null`. Remove `generateSecretCode` usage from booking path (helper MAY remain exported unused or move to tests only — prefer delete if unused). VOUCHER_PROMO / VOUCHER_PDF: throw `BookingError("INVALID_REDEMPTION_CONFIG", …)` with message stating inventory allocation not wired (step 02), **or** add code `INVENTORY_NOT_IMPLEMENTED` if cleaner — prefer new code `VOUCHER_INVENTORY_PENDING` for call-site clarity.
   - **Rationale:** Keeps SECRET_CODE bookable; prevents half-broken voucher bookings claiming shared promo.
   - **Alternatives:** Silently book with null redemption (worse UX); implement allocation early (scope creep into 02).

8. **Catalog validation / defaults**
   - **Choice:**
     - Defaults: `ticketType: SECRET_CODE`, `timingMode: TIME_SLOT`, `totalCapacity: 10` — **remove** `secretCodeMode` from `applyEventDefaults` / `RedemptionInput`.
     - SECRET_CODE → require `secretCode`.
     - VOUCHER_PROMO → require `eventWebsiteUrl`; do **not** require `promoCode`.
     - VOUCHER_PDF → no event-level code/URL requirement this step (`eventWebsiteUrl` optional).
   - **Rationale:** Spec Delta + parent “keep event_website_url for VOUCHER_PROMO”.
   - **Alternatives:** Require website for PDF too (no product ask).

9. **Minimal `apps/web` compile shims (not full admin UI)**
   - **Choice:** Update parsers/types/copy/select options: drop mode field; map ticket types to new enum; for VOUCHER_* forms temporarily accept SECRET_CODE + VOUCHER_PROMO (label as voucher) without inventory upload — create may succeed without stock; booking rejects until 02/03. Remove secret-mode `<select>`. Ignore `promo_code` body or stop requiring it.
   - **Rationale:** Step brief includes admin parsers; typecheck must pass; full stock UI is 03.
   - **Alternatives:** Leave admin broken until 03 (fails verification).

10. **Booking row denormalized redemption**
    - **Choice:** Continue writing `bookings.redemption_*` for SECRET_CODE from `resolveRedemption`. For voucher types, do not succeed booking this step. `redemption_type` column type follows `ticket_type` enum (values update with migration).
    - **Rationale:** Minimal churn for My Tickets until 04 reads `booking_tickets`.
    - **Alternatives:** Create empty `booking_tickets` in 01 without codes (defer to 02).

11. **Docs**
    - **Choice:** Do not rewrite Gherkin / schema-overview as done-criteria (05 owns product SoT). Optional one-line note in parent guide when marking 01 done; PR calls out temporary voucher booking reject.
    - **Rationale:** Step cleanup section.

## Risks / Trade-offs

- **[Risk] Migrated VOUCHER events look bookable in UI but booking fails** → Mitigation: typed error; PR + parent note; step 02/03 stock + allocate; optional admin banner later.
- **[Risk] Circular FK complexity in migration** → Mitigation: Decision 5 ordering; integration test only if DB available.
- **[Risk] Enum recreate locks / Drizzle generate quirks** → Mitigation: review generated SQL; test migrate on branch DB.
- **[Risk] Seed/demo still inserts SHARED_GENERATED / VOUCHER** → Mitigation: update `seed-data` / seed helpers in this step so seed applies cleanly.
- **[Trade-off] Unused `promo_code` column may linger** → Acceptable until drop is safe; behavior must not depend on it.
- **[Trade-off] openspec/specs ≠ product SoT** → Deltas still written; `docs/product/` updated in 05.

## Migration Plan

1. Update Drizzle schema modules + barrels; add inventory + `booking_tickets`.
2. `bun run db:generate`; hand-review SQL for enum remap, column drop, inventory seed from legacy promo, FKs/indexes.
3. Apply `bun run db:migrate` on local/dev.
4. Update validation, redemption, seed, admin parsers; fix unit tests.
5. `bun run lint`, `bun run typecheck`, `bun test packages/db` (at least validation + redemption units).
6. Rollback: reverse migration (drop new tables, restore enums/columns) — only safe before 02 writes allocation data.

## Open Questions

- None blocking. If product later insists every legacy shared promo must remain bookable without re-upload, step 02 could special-case single shared AVAILABLE code for all tickets — explicitly **not** this step’s default.
