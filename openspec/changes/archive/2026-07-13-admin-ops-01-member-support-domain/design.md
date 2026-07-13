## Context

Phase 7 shipped subscriptions, credit ledger (`ADMIN_ADJUST` / `REFUND` enum values), booking, and waitlist. Stripe webhooks already treat `UNPAID` as admin-owned freeze and refuse to overwrite it (`subscription-lifecycle.ts`). There is still no admin member list/detail or credit/freeze writer for Membership HQ.

This is Phase 8 step 01 (`admin-ops-01-member-support-domain`): package-level domain only. Product SoT: `docs/product/features/admin-users.feature`, adjust/refund/freeze scenarios in `credits-subscription.feature`, schema in `users` / `subscriptions` / `credit_ledger`. Auth gates live at call sites (steps 03–04); domain functions assume a trusted admin `actor` context is enforced by the route.

## Goals / Non-Goals

**Goals:**

- Domain APIs: `listMembers`, `getMemberDetail`, `adjustMemberCredits`, `refundMemberCredits`.
- Freeze → `UNPAID` and unfreeze → `ACTIVE` without clearing Stripe customer/subscription ids; preserve plan, payment method, billing address.
- Typed errors; reject zero adjust; keep `users.credits ≥ 0`.
- List sorted by name then email; filter by name, email, or role.
- Detail aggregate: profile prefs, bookings/waitlist/saved counts, available `behavior` JSON fields (no invented metrics).
- Unit/integration tests; public exports from `@unveiled/db` / `@unveiled/billing`.

**Non-Goals:**

- SSR `/admin/users*` routes or mutation pages (steps 03–04).
- Comp ticket, booking cancel, waitlist admin (step 02).
- GDPR export/anonymize/delete.
- Ladle / Playwright.
- Schema migrations (tables already exist).
- Changing webhook freeze-ownership rules (already correct).

## Decisions

### 1. Module layout

```
packages/db/src/admin/
  index.ts
  errors.ts                 # AdminMemberError codes
  list-members.ts
  get-member-detail.ts
  adjust-member-credits.ts
  refund-member-credits.ts
  admin-members.unit.test.ts
  admin-members.integration.test.ts  # skip cleanly if DATABASE_URL unset

packages/billing/src/
  freeze-member.ts          # freezeMember / unfreezeMember
  # export from package index; tests in billing.test.ts or freeze-member.test.ts
```

Export admin APIs from `@unveiled/db` via `export * from "./admin"`. Export freeze/unfreeze from `@unveiled/billing`.

**Rationale:** Credit balance + ledger writes match booking’s home in `@unveiled/db`. Freeze is a subscription status write next to existing lifecycle helpers that already document admin `UNPAID` ownership — keep freeze in billing so webhook and admin freeze share one package narrative.

**Alternatives:** All under `@unveiled/db` — acceptable but splits subscription status writers across packages. New `@unveiled/admin` package — overkill for MVP.

### 2. Credit adjust and refund

Both use `TxDb` + interactive transaction (lock user row, update credits, insert ledger).

| Function | Ledger `type` | Amount semantics |
|---|---|---|
| `adjustMemberCredits(txDb, { userId, amount, description })` | `ADMIN_ADJUST` | Signed integer; **reject `amount === 0`**; reject if `credits + amount < 0` |
| `refundMemberCredits(txDb, { userId, amount, description })` | `REFUND` | Positive integer only (`amount > 0`); increases balance; **not** tied to booking cancel |

Shared invariants:

- Require non-empty trimmed `description` / reason.
- Set `balance_after` to the post-update balance.
- Optional `idempotencyKey` only if useful for tests; not required by product for one-off admin gestures.
- Do not touch bookings or waitlist.

Typed errors e.g. `USER_NOT_FOUND`, `ZERO_AMOUNT`, `INSUFFICIENT_CREDITS`, `INVALID_AMOUNT`, `INVALID_DESCRIPTION`.

**Alternatives:** Single `writeAdminCredits(type, …)` — rejected for clearer call sites matching Gherkin adjust vs refund.

### 3. Freeze / unfreeze

```ts
freezeMember(txDb, { userId })   // ACTIVE → UNPAID
unfreezeMember(txDb, { userId }) // UNPAID → ACTIVE
```

Rules:

- Load subscription by `userId`; typed error if missing.
- **Freeze:** only from `ACTIVE` → `UNPAID` (match feature scenario). Reject other statuses (e.g. already `UNPAID`, `PAST_DUE`, `INACTIVE`).
- **Unfreeze:** only from `UNPAID` → `ACTIVE`. Do not invent Stripe recovery; admin freeze is independent of `PAST_DUE`.
- Update **only** `status` (+ `updatedAt`). Leave `plan`, `paymentMethod`, `billingAddress`, `stripeCustomerId`, `stripeSubscriptionId`, `periodEnd` unchanged.
- Do not call Stripe APIs.

Webhooks already skip clearing `UNPAID`; no change required there. Add a focused unit/integration assertion that freeze leaves Stripe ids intact and that lifecycle helpers still leave `UNPAID` alone (existing billing tests cover the latter — extend if needed).

### 4. List and detail queries

**`listMembers(db, { q?, role?, limit?, offset? })`:**

- Exclude soft-deleted users (`deleted_at IS NULL`).
- Sort: display name then email. Display name = `trim(coalesce(profile->>'first_name','') || ' ' || coalesce(profile->>'last_name',''))` (empty name sorts before named, then email tie-break). Use SQL `ORDER BY` on expression + `email ASC`, then `id ASC` for stability.
- Search `q`: case-insensitive match on email **or** first/last name JSON fields (ilike / `||` concat). Role filter exact match when provided (`USER` | `ADMIN` | `PARTNER`).
- List row shape for HQ: `id`, email, role, credits, subscription status (left join), booking count, and behavior `event_open_count` when present — enough for collapsed summary; detail loads the rest.

**`getMemberDetail(db, userId)`:**

- Full user row (profile + behavior JSON as stored).
- Subscription row (or null).
- Counts: bookings, waitlist entries, saved events (and session/open counts from `behavior` when present).
- Do **not** invent analytics fields; return available JSON only.
- Soft-deleted → `NOT_FOUND` (or typed `DELETED`) so UI steps can 404.

Auth role checks are **not** inside these functions; routes enforce `ADMIN`.

### 5. Tests

- Unit: error mapping / zero-amount / negative-refund validation without DB where pure.
- Integration (gated on `DATABASE_URL`): adjust up/down, reject zero, reject insufficient, refund ledger type, freeze preserves Stripe ids, unfreeze `UNPAID`→`ACTIVE`, list sort/search, detail counts.
- Skip integration cleanly when `DATABASE_URL` unset (same pattern as booking/waitlist).

## Risks / Trade-offs

- **[JSON name sort vs Postgres collation]** → Mitigation: deterministic SQL expression + email/id tie-break; document in module comment; add sort integration test with known fixtures.
- **[Freeze only from ACTIVE]** → Mitigation: match feature scenario; if support later needs freeze from `CANCELLED_PENDING`, extend in a follow-up — do not silently map other statuses to `UNPAID`.
- **[Unfreeze always → ACTIVE while Stripe may be past_due]** → Acceptable per product: admin freeze is separate from Stripe `PAST_DUE`; webhook path still won’t clear `UNPAID` until admin unfreezes; after unfreeze, next webhook can set `PAST_DUE` if Stripe still failed. Document in freeze module comment.
- **[Sparse behavior analytics]** → Parent guide risk: show available data only; no fake metrics.
- **[No UI in this step]** → Intentional; domain must compile and test in isolation.

## Migration Plan

1. Implement `packages/db/src/admin/*` + exports.
2. Implement `freezeMember` / `unfreezeMember` in `@unveiled/billing` + exports.
3. Add tests; run `bun run lint`, `bun run typecheck`, package tests.
4. No DB migration. Deploy anytime after green; no rollback schema — remove exports if reverting.
5. Mark step 01 done in `admin-ops-parent-guide.md` after merge.

## Open Questions

- None blocking apply. If list pagination page size is needed before step 03, default `limit`/`offset` helpers now (e.g. 25) to match admin partners/events pagination docs.
