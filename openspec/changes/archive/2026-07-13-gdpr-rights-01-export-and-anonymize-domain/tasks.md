## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/gdpr-rights-01-export-and-anonymize-domain.md`, parent guide non-goals, `docs/product/features/auth.feature` GDPR scenarios, and Account deletion in `docs/product/database/schema-overview.md`
- [x] 1.2 Confirm `users.deletedAt` exists and bookings / `credit_ledger` / subscriptions use `ON DELETE restrict`; note Neon Auth disable approach (prefer remove-user; ban+email wipe as fallback) for step 02 / `DEPLOYMENT.md`

## 2. Export builder (`@unveiled/db`)

- [x] 2.1 Create `packages/db/src/gdpr/` with typed `GdprError` codes (`USER_NOT_FOUND`, `ALREADY_DELETED`, `AUTH_DISABLE_FAILED`, …)
- [x] 2.2 Implement `buildUserDataExport` — profile + bookings + credit ledger JSON summary; reject missing / already-deleted users; synchronous (no job)
- [x] 2.3 Export export builder from `packages/db/src/gdpr/index.ts` and `@unveiled/db`

## 3. Anonymize path (`@unveiled/db` + collaborators)

- [x] 3.1 Implement `anonymizeUserAccount` — lock user; placeholder email `deleted-{userId}@deleted.local`; clear `profile`/`behavior`; set `deletedAt`; delete `saved_events` and `waitlist_entries`; retain bookings + ledger
- [x] 3.2 Inject `DisableAuthUserFn` (export type from `@unveiled/auth`); call after successful DB anonymize; do not re-run on `ALREADY_DELETED`
- [x] 3.3 Inject / call existing `@unveiled/billing` `cancelSubscriptionAtPeriodEnd` when a Stripe subscription id is present for ACTIVE/PAST_DUE/UNPAID/CANCELLED_PENDING; no-op when already inactive without Stripe; assert billing-only cancel does not set `deletedAt`
- [x] 3.4 Support `actor: 'self' | 'admin'` (+ optional `adminId`) on the same path; export anonymize from `@unveiled/db`

## 4. Tests

- [x] 4.1 Add unit/integration tests for export shape, anonymize field clearing, booking/ledger retention, saved/waitlist removal, already-deleted / double-delete guard
- [x] 4.2 Mock Auth disable (and Stripe cancel) at the boundary; skip integration cleanly when `DATABASE_URL` unset
- [x] 4.3 Confirm no route/UI/Ladle/Playwright files were added in this step

## 5. Validation and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 5.2 Run package tests for GDPR modules — pass or skip cleanly without live Auth/Stripe
- [x] 5.3 Mark step 01 done in `gdpr-rights-parent-guide.md`; document Auth disable approach for step 02 / `DEPLOYMENT.md`; update `docs/product/` only if behavior diverged from `auth.feature`
