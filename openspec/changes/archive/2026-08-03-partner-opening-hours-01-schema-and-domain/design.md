## Context

Parent feature: partner opening hours (`.dev-plan/current-iteration/partner-opening-hours-parent-guide.md`), step 01 — schema + partner catalog domain.

Current state:

- `partners` has identity, structured address, contact email, logo, and portal placeholders — no schedule columns.
- `CreatePartnerInput` / `UpdatePartnerInput` / `getPartnerById` live in `packages/db/src/catalog/partners.ts`; validation uses `CatalogValidationError`.
- Public event detail shows partner name + logo only; hours display is step 03.

Product locks: weekly schedule only (no overnight spans, exceptions, or per-event hours); wall times are Europe/Berlin local for display (no per-partner timezone column); existing partners default hours-off with no invented backfill.

Constraints: business logic in `@unveiled/db` only; no route/UI in this step; Biome + existing catalog error patterns.

## Goals / Non-Goals

**Goals:**

- Persist `has_opening_hours` (boolean NOT NULL default false) and `opening_hours` (jsonb nullable) on `partners`.
- Shared TypeScript types + write-path validation for the seven-day JSON shape.
- Create/update accept and persist the fields; disable clears `opening_hours` to null.
- Reads return typed fields on partner selects.
- Tests cover accept/reject matrix and clear-on-disable.

**Non-Goals:**

- Admin create/edit form toggle and day fields (step 02).
- Event detail DETAILS rendering, i18n, Gherkin/e2e (step 03).
- Overnight spans, holidays, seasonal exceptions, partner-portal self-service.
- Discover / card / map display of hours.

## Decisions

1. **Single jsonb column for the week (not seven column pairs)**
   - **Choice:** `opening_hours jsonb` with fixed keys `mon`…`sun`; companion boolean `has_opening_hours`.
   - **Rationale:** Matches parent guide; small migration; maps cleanly to toggle+list UI in step 02.
   - **Alternatives:** Seven `(open, close)` column pairs (wider schema; awkward closed-day encoding).

2. **Application validation, not DB check constraints on JSON shape**
   - **Choice:** Domain helpers (`parseOpeningHours` / `assertOpeningHoursForWrite` or equivalent) enforce shape, seven keys, time format, and `open < close`. Reject with `CatalogValidationError`. Optional DB-level: boolean default + nullable jsonb only.
   - **Rationale:** JSON check constraints are brittle; catalog already owns validation for partners; unit-testable without SQL.
   - **Alternatives:** Postgres `CHECK` with `jsonb_typeof` / key presence (harder to evolve; weaker DX).

3. **Disable clears hours on write**
   - **Choice:** When `has_opening_hours` is false (explicit on create/update), always persist `opening_hours = null` even if a schedule payload was also sent.
   - **Rationale:** Spec delta + parent risk: public consumers treat hours as absent when disabled; no stale JSON left behind.
   - **Alternatives:** Keep last schedule while disabled for “restore on re-enable” (rejected — product says clear; step 02 can re-enter).

4. **Closed day encoding**
   - **Choice:** Explicit `{ "closed": true }` per day when hours are enabled; never omit a weekday key.
   - **Rationale:** Parent guide — do not leave a day blank; distinguishes “not provided” from “closed”.
   - **Alternatives:** Null day values or missing keys (ambiguous for validation).

5. **Time format**
   - **Choice:** `"HH:MM"` 24h with zero-padded minutes; compare as minutes-from-midnight integers; require `openMinutes < closeMinutes` (same calendar day only).
   - **Rationale:** Simple, locale-independent storage; overnight out of scope.
   - **Alternatives:** Store minutes as integers in JSON (less readable for admins/debug); allow `close` next-day flag (out of scope).

6. **Drizzle typing**
   - **Choice:** `boolean("has_opening_hours").notNull().default(false)` and `jsonb("opening_hours").$type<OpeningHoursWeek | null>()` (or equivalent) following `users.profile` jsonb pattern.
   - **Rationale:** Typed selects for consumers; matches existing jsonb usage in `@unveiled/db`.

7. **Input API surface**
   - **Choice:** Add optional `hasOpeningHours?: boolean` and `openingHours?: OpeningHoursWeek | null` to create/update inputs. Create defaults `hasOpeningHours` to false when omitted. Update: if `hasOpeningHours` is set to false, clear hours; if set to true, require valid week; if only `openingHours` is patched while currently enabled, re-validate full week.
   - **Rationale:** Keeps step 01 mergeable — callers that omit fields keep hours-off behavior.
   - **Alternatives:** Require both fields on every create (unnecessary churn for existing admin routes until step 02).

## Risks / Trade-offs

- **[Risk] Invalid jsonb sneaks in via raw SQL / seed** → Mitigation: all product writes go through create/update helpers; seed leaves default false/null; tests assert reject matrix.
- **[Risk] Partial update leaves incomplete week** → Mitigation: when enabling or replacing hours, require all seven keys in one payload; reject missing keys.
- **[Risk] Step 02 form field names diverge from domain** → Mitigation: handoff notes camelCase inputs (`hasOpeningHours`, `openingHours`) and locked day keys; SSR forms map POST fields in step 02.
- **[Trade-off] No DB constraint on JSON shape** → Accepted; domain validation is the contract; step 03 docs record the shape in schema-overview.
- **[Trade-off] Clearing on disable loses last schedule** → Accepted per product; simpler public semantics.

## Migration Plan

1. Add columns to Drizzle `partners` schema; `bun run db:generate` and review SQL (boolean default false; jsonb nullable; no backfill of invented hours).
2. Add opening-hours types + assert/parse helpers; wire create/update; export from catalog barrel as needed.
3. Add package tests (validation unit + create/update persistence / clear-on-disable with `DATABASE_URL` if integration style matches existing partner tests).
4. Run `bun run typecheck`, `bun run lint`, `cd packages/db && bun test`.
5. Rollback: drop the two columns (additive until step 02/03 depend on them).

## Open Questions

- None blocking. Whether to patch `docs/product/database/schema-overview.md` in this PR or wait for step 03 is optional per the step plan — prefer a short partners-section note if the migration lands alone so schema SoT stays honest.
