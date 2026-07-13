## Context

Phase 7 shipped profile/billing, subscriptions, and credit ledger. `users.deleted_at` already exists; bookings and `credit_ledger` reference `users.id` with `ON DELETE restrict`. There is no export builder or anonymize use case yet — GDPR Gherkin in `docs/product/features/auth.feature` remains deferred to Phase 8.

This is Phase 8 step 01 (`gdpr-rights-01-export-and-anonymize-domain`): package-level domain only. Product SoT: Account deletion section in `docs/product/database/schema-overview.md`, GDPR table in `authorization-matrix.md`, export/deletion scenarios in `auth.feature`. UI lands in step 02; E2E in step 03.

## Goals / Non-Goals

**Goals:**

- Synchronous `buildUserDataExport(userId)` → JSON summary of profile, bookings, and credit ledger (downloadable later by UI).
- Shared `anonymizeUserAccount(userId, { actor, adminId? })` for self and admin-assisted deletion.
- Anonymize PII on `public.users`; set `deletedAt`; disable Neon Auth login; cancel active/pending Stripe subscription as a deletion side effect.
- Retain booking + ledger rows attached to the anonymized user id; typed errors for missing / already-deleted users.
- Unit/integration tests; Auth boundary injectable/mocked.

**Non-Goals:**

- SSR `/profile/data-export`, `/profile/delete-account`, `/admin/users/:id/delete-account` (step 02).
- Playwright / Ladle (step 03).
- Hard-delete of `public.users` or cascading financial history.
- Async export jobs or email delivery of exports.
- Membership HQ credit/freeze/comp/refund (admin-ops).
- Schema migrations (`deleted_at` already present).

## Decisions

### 1. Module layout

```
packages/db/src/gdpr/
  index.ts
  errors.ts                 # GdprError codes: USER_NOT_FOUND, ALREADY_DELETED, …
  build-user-data-export.ts
  anonymize-user-account.ts
  gdpr.unit.test.ts
  gdpr.integration.test.ts  # skip cleanly if DATABASE_URL unset

packages/auth/src/
  disable-auth-user.ts      # DisableAuthUserFn type + thin helper docs
  # export type; optional no-op default for tests

# Billing: reuse cancelSubscriptionAtPeriodEnd — no new cancel writer
```

Export GDPR APIs from `@unveiled/db` via `export * from "./gdpr"`. Auth disable is a **collaborator** injected into `anonymizeUserAccount` (same pattern as `SyncAuthEmailFn` on profile updates). Billing cancel is invoked when a Stripe subscription id is present.

**Rationale:** Export + `public.users` writes belong with other domain writers in `@unveiled/db`. Neon Auth is owned by `@unveiled/auth` / `AUTH_URL` — never modeled in Drizzle. Subscription cancel already lives in `@unveiled/billing`.

**Alternatives:** New `@unveiled/gdpr` package — overkill for two functions. All Auth HTTP inside `@unveiled/db` — wrong dependency direction.

### 2. Export payload shape

`buildUserDataExport(db, userId)` loads the non-deleted user (or include deleted? → **reject deleted / not found** so UI can 404) and returns a plain serializable object:

```ts
{
  exportedAt: string; // ISO
  user: {
    id: string;
    email: string;
    role: string;
    credits: number;
    emailVerified: boolean;
    createdAt: string;
    profile: UserProfile; // as stored
  };
  bookings: Array<{
    id, eventId, partnerId, ticketsCount, totalCredits, status,
    createdAt, cancelledAt, cancellationReason, checkedInAt
  }>;
  creditLedger: Array<{
    id, amount, balanceAfter, type, description, timestamp
  }>;
}
```

- Bookings ordered by `createdAt` desc; ledger by `timestamp` desc.
- Synchronous; no job queue. Omit secrets (redemption codes optional — include `redemptionInfo`/`redemptionUrl` only if already on the booking row the member would see; prefer including them as member-owned booking data).
- Soft-deleted user → typed `ALREADY_DELETED` or `USER_NOT_FOUND` (pick one code; document — prefer `ALREADY_DELETED` when `deletedAt` set, `USER_NOT_FOUND` when missing).

### 3. Anonymize path (single use case)

```ts
anonymizeUserAccount(input: {
  db: TxDb;
  userId: string;
  actor: "self" | "admin";
  adminId?: string;          // required when actor === "admin" (audit only; no separate table this step)
  disableAuthUser: DisableAuthUserFn;
  cancelSubscription?: CancelSubscriptionFn; // optional inject; real impl wraps billing + Stripe
}): Promise<{ userId: string; deletedAt: Date }>
```

**Transaction order (recommended):**

1. Lock/load `users` row `FOR UPDATE`. If missing → `USER_NOT_FOUND`. If `deletedAt` set → `ALREADY_DELETED` (do not re-run side effects).
2. Within the same DB transaction:
   - Set `email` to unique placeholder `deleted-{userId}@deleted.local` (preserves unique constraint; does not contain original email).
   - Set `emailVerified` to `false`.
   - Replace `profile` with `{}` (clears names, prefs, onboarding flags).
   - Replace `behavior` with `{}` (clears activity PII / recent ids / filters).
   - Set `deletedAt` / `updatedAt` to now.
   - Delete `saved_events` for `userId` (not retention-required).
   - Delete `waitlist_entries` for `userId` (not retention-required; frees capacity).
   - **Do not** delete `bookings` or `credit_ledger`.
3. After successful DB commit (or still inside orchestrator after tx):
   - Call `disableAuthUser({ userId })` so Neon Auth credentials cannot authenticate.
   - If subscription has `stripeSubscriptionId` and status is `ACTIVE`, `PAST_DUE`, `UNPAID`, or `CANCELLED_PENDING` without already having completed cancel — call billing cancel-at-period-end (injectable). Treat “already canceling / no Stripe id / INACTIVE without Stripe” as no-op success.
4. Do **not** sign the user out here — session cookie clearing is a UI/route concern (step 02). Domain only ensures credentials fail on next auth.

**Actor:** Same anonymize path for `self` and `admin`. `adminId` is recorded only in structured logs / return metadata for this step (no new audit table). Auth gates stay at call sites (step 02).

### 4. Neon Auth disable strategy

Prefer **removing** the Neon Auth user (or equivalent credential wipe) over ban-only, so the real email does not remain in `neon_auth`:

1. **Primary:** Better Auth / Neon Auth Admin `remove-user` (or Neon `neon-auth user delete`) for the given `userId`, invoked via injectable `DisableAuthUserFn`.
2. **Fallback if remove unavailable in staging:** Admin `ban-user` **plus** update Auth email to the same placeholder (must not leave original email in Auth).
3. Step 01 ships the **type + mockable collaborator**; concrete HTTP against `AUTH_URL` is implemented or stubbed in step 02 / noted in `DEPLOYMENT.md` (Neon Admin plugin may require an Auth-side admin session — document ops: enable Admin plugin, promote a service admin, or use CLI/API key if Neon provides one).

Tests mock `disableAuthUser` and assert it was called once with the correct `userId` after a successful anonymize; assert it is **not** called on `ALREADY_DELETED`.

### 5. Subscription cancel vs billing-only cancel

Deletion **calls** the existing `cancelSubscriptionAtPeriodEnd` path when a live Stripe subscription id exists — it does **not** invent a second cancel writer. Billing-only cancel from `/profile/billing/cancel` must remain available independently and must **not** set `deletedAt` or clear PII (already true; add a regression assertion in package tests that cancel helper alone does not touch `users.deleted_at`).

### 6. Tests

- Unit: placeholder email format; error codes; export shape builders with fixtures; already-deleted guard without Auth/Stripe.
- Integration (`DATABASE_URL`): create user + booking + ledger + saved/waitlist → anonymize → assert email/profile/behavior/`deletedAt`; bookings/ledger rows remain with same `userId`; saved/waitlist gone; second anonymize → `ALREADY_DELETED`; export before delete returns three sections; export after delete fails typed.
- Mock Auth + Stripe at boundaries; skip integration cleanly when `DATABASE_URL` unset.

## Risks / Trade-offs

- **[Neon Auth Admin requires Auth-role admin cookie]** → Mitigation: inject `DisableAuthUserFn`; document concrete `AUTH_URL` call + any Console “Make admin” / plugin enablement in handoff for step 02 / `DEPLOYMENT.md`. Do not block domain merge on live Auth.
- **[Auth disable fails after DB commit]** → Mitigation: order DB anonymize first (PII already gone); retry Auth disable from support if needed; typed error `AUTH_DISABLE_FAILED` after commit so UI can surface “account closed locally; contact support if login still works”. Prefer best-effort Auth call after commit over holding the DB transaction open on network I/O.
- **[Email placeholder collisions]** → Mitigation: include stable `userId` in placeholder; unique constraint on `users.email` already enforced.
- **[Deleting waitlist rows mid-promotion]** → Acceptable for GDPR; capacity frees. Document in module comment.
- **[No UI in this step]** → Intentional; packages must compile and test in isolation.

## Migration Plan

1. Implement `packages/db/src/gdpr/*` + exports.
2. Add `DisableAuthUserFn` (and optional cancel inject type) in `@unveiled/auth` / anonymize input.
3. Wire cancel via existing `@unveiled/billing` helper at orchestrator boundary (or inject from caller).
4. Add tests; run `bun run lint`, `bun run typecheck`, package tests.
5. No DB migration. Mark step 01 done in `gdpr-rights-parent-guide.md` after merge; note Auth disable approach for step 02.

## Open Questions

- None blocking apply. Confirm at apply time whether Neon Auth staging has Admin plugin enabled; if not, ship mock + `DEPLOYMENT.md` checklist item and keep `DisableAuthUserFn` as the integration seam.
