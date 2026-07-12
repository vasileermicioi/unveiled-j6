## Context

Phase 5.5 is complete; Phase 6 (`payments-booking`) starts with persistence and package shells. `@unveiled/db` already has `users`, `subscriptions`, catalog tables, and `createDb` via `drizzle-orm/neon-http` — sufficient for reads and simple writes, **not** for `BEGIN` / `SELECT … FOR UPDATE`. Subscriptions exist; `bookings` and `credit_ledger` do not. `@unveiled/billing` and `@unveiled/email` are listed in `AGENTS.md` for Phase 6+ but are absent from the workspace.

Canonical field shapes: `docs/product/database/schema-overview.md`. Step plan: `.dev-plan/current-iteration/payments-booking-01-schema-and-packages.md`. Parent: `payments-booking-parent-guide.md`.

App runtime is Cloudflare Workers (`apps/web`); Bun is used for local scripts/tests. Packages must not depend on `apps/web`.

## Goals / Non-Goals

**Goals:**

- Drizzle tables + enums for `public.bookings` and `public.credit_ledger` matching schema-overview (PKs, FKs `ON DELETE RESTRICT`, idempotency uniqueness, indexes).
- Generated migration under `packages/db/drizzle/`; `remaining_capacity >= 0` already on `events` — verify, do not duplicate incorrectly.
- Export a transactional client (`createTxDb` or equivalent) using Drizzle’s transaction API so later `bookEvent` / webhook ledger writes can lock rows.
- Scaffold `@unveiled/billing` and `@unveiled/email` with typed stub exports + `typecheck`.
- Document the dual-client pattern in `packages/db/README.md`.

**Non-Goals:**

- Stripe Checkout, webhook route, membership UI.
- `bookEvent` domain, booking pages, Resend sends, ICS.
- `waitlist_entries` table (Phase 7).
- Admin cancel/comp UI; Playwright; Ladle.
- Replacing neon-http `createDb` for all call sites.

## Decisions

### 1. Schema files and exports

Add `packages/db/src/schema/bookings.ts` and `credit-ledger.ts`; re-export from `schema/index.ts` and package entrypoints.

**Enums (pgEnum):**

| Enum | Values |
|---|---|
| `booking_status` | `CONFIRMED`, `WAITLIST`, `CANCELLED`, `USED` |
| `credit_ledger_type` | `SUBSCRIPTION_REFILL`, `BOOKING`, `EXPIRY`, `REFUND`, `ADMIN_ADJUST` |

**`redemption_type`:** reuse existing `ticket_type` enum (`VOUCHER` | `SECRET_CODE`) for the nullable `bookings.redemption_type` column — same value set, avoids a duplicate Postgres enum. Alternative: new `redemption_type` enum; reject unless Drizzle reuse is awkward.

**`bookings` columns (camelCase in Drizzle / snake_case in SQL):** `id` (uuid PK defaultRandom), `userId` → `users.id`, `eventId` → `events.id`, `partnerId` → `partners.id` (denormalized), `ticketsCount`, `totalCredits`, `status`, `redemptionType`, `redemptionInfo`, `redemptionUrl`, `idempotencyKey`, `checkedInAt`, `cancelledAt`, `cancellationReason`, `createdAt`, `updatedAt`.

**`credit_ledger` columns:** `id`, `userId`, `amount`, `balanceAfter`, `type`, `description`, `idempotencyKey` (nullable), `timestamp`.

**Constraints / indexes:**

- Unique `(user_id, idempotency_key)` on `bookings`
- Unique `idempotency_key` on `credit_ledger` where not null (partial unique index)
- Index `(user_id, created_at)` on `bookings` (desc if Drizzle supports; else plain + query order)
- Index `(user_id, timestamp)` on `credit_ledger`
- Also add schema-overview indexes that are cheap now: `(partner_id, created_at)`, `(event_id)` on bookings — useful for later partner/admin jobs without a second migration
- All FKs: `onDelete: "restrict"`

**Rationale:** Matches product schema SoT; idempotency uniqueness is the DB half of atomic booking safety.

### 2. Dual DB clients

| Export | Driver | Use |
|---|---|---|
| `createDb(url)` | `neon()` + `drizzle-orm/neon-http` | Existing reads / simple writes (unchanged) |
| `createTxDb(url)` (name bikeshed OK) | `Pool` from `@neondatabase/serverless` + `drizzle-orm/neon-serverless` | Booking path, webhook ledger multi-statement tx |

```ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";

// Node/Bun scripts: set neonConfig.webSocketConstructor = ws when required
export function createTxDb(connectionString: string) {
  const pool = new Pool({ connectionString });
  return drizzle(pool, { schema });
}
export type TxDb = ReturnType<typeof createTxDb>;
```

Callers that open transactions SHOULD create/end the pool per request on Workers (or document lifecycle) so connections do not leak — later booking/webhook steps own that wiring; this step only exports the factory + types.

**Alternatives considered:**

- **Migrate all callers to Pool-only:** more churn; HTTP is fine for catalog reads.
- **`postgres.js` / node-postgres + Hyperdrive:** Neon notes Hyperdrive for Workers long-term; out of scope for step 01 — stick to existing `@neondatabase/serverless` dependency unless Workers WebSocket proves blocked during apply (then document Hyperdrive follow-up).
- **neon-http batch/`transaction` helper:** not a true interactive session; cannot rely on `SELECT FOR UPDATE` locking semantics the booking domain needs.

### 3. Billing and email package shells

Mirror `packages/images` / `packages/auth` layout:

```
packages/billing/
  package.json   # @unveiled/billing
  tsconfig.json
  src/index.ts   # placeholder typed exports (e.g. package identity / stub createStripeClient later)

packages/email/
  package.json   # @unveiled/email
  tsconfig.json
  src/index.ts   # placeholder typed exports
```

- Root `workspaces: ["packages/*"]` already covers them.
- Optional thin deps: `stripe` in billing; email may use `fetch` to Resend with no SDK until step 03 — stubs must typecheck without requiring live API keys.
- `apps/web` does **not** need to import these packages yet unless typecheck wiring requires an explicit workspace dep (prefer not until step 02/03).

### 4. Tests and README

- Optional smoke test: schema exports include `bookings` / `creditLedger` symbols (or import table objects).
- Existing `bun --filter @unveiled/db test` must still pass.
- README: document `createDb` vs `createTxDb`, Phase 6 tables list, and that write transactions must use the transactional client.

## Risks / Trade-offs

- **[Workers WebSocket / Pool lifecycle]** → Mitigation: export factory only in this step; document per-request pool create/end pattern; if Workers blocks WebSockets in staging later, evaluate Hyperdrive + node-postgres in a follow-up (not this step’s Stripe/booking work).
- **[Partial unique index for ledger idempotency]** → Mitigation: use Drizzle `uniqueIndex(…).where(isNotNull(…))` or raw SQL in migration; verify generated SQL.
- **[WAITLIST status on bookings without waitlist table]** → Acceptable: enum includes `WAITLIST` for forward compatibility; no waitlist_entries table until Phase 7.
- **[Schema drift vs schema-overview]** → Prefer fixing Drizzle to match docs; note any intentional deviation in handoff.

## Migration Plan

1. Land schema + `createTxDb` + package scaffolds on a branch.
2. `bun run db:generate` → review SQL → commit under `packages/db/drizzle/`.
3. `bun run db:migrate` against Neon branch / team migrate path.
4. Rollback: reverse migration or restore DB branch; packages are additive (empty stubs) — safe to remove if abandon.

## Open Questions

- Exact export name (`createTxDb` vs `createTransactionalDb`) — pick one during apply and use consistently in README.
- Whether `apps/web` gets a thin `getTxDb()` helper now or only when booking routes land in step 03 — prefer **defer to step 03** unless typecheck needs it.
