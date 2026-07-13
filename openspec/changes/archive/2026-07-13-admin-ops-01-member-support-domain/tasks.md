## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/admin-ops-01-member-support-domain.md`, parent guide non-goals, `docs/product/features/admin-users.feature`, and adjust/refund/freeze scenarios in `credits-subscription.feature`
- [x] 1.2 Confirm Phase 7 schema/packages exist (`users`, `subscriptions`, `credit_ledger`, booking/waitlist) and that billing already preserves admin `UNPAID` across webhooks

## 2. Admin member queries (`@unveiled/db`)

- [x] 2.1 Create `packages/db/src/admin/` with typed `AdminMemberError` codes
- [x] 2.2 Implement `listMembers` — exclude soft-deleted; sort by display name then email; filter by `q` (name/email) and optional `role`; support `limit`/`offset`
- [x] 2.3 Implement `getMemberDetail` — profile prefs, subscription, history counts (bookings/waitlist/saved), available behavior fields only; soft-deleted → not found
- [x] 2.4 Export list/detail from `packages/db/src/admin/index.ts` and `@unveiled/db`

## 3. Credit adjust and refund (`@unveiled/db`)

- [x] 3.1 Implement `adjustMemberCredits` — transactional credit update + `ADMIN_ADJUST` ledger; reject `amount === 0`; reject insufficient balance; require description
- [x] 3.2 Implement `refundMemberCredits` — transactional credit increase + `REFUND` ledger; require `amount > 0` and description; no booking cancel coupling
- [x] 3.3 Export adjust/refund from admin module and `@unveiled/db`

## 4. Freeze / unfreeze (`@unveiled/billing`)

- [x] 4.1 Implement `freezeMember` — `ACTIVE` → `UNPAID` only; preserve plan, payment method, billing address, Stripe ids
- [x] 4.2 Implement `unfreezeMember` — `UNPAID` → `ACTIVE` only; leave Stripe ids intact; document independence from `PAST_DUE`
- [x] 4.3 Export freeze/unfreeze from `@unveiled/billing` package entry

## 5. Tests

- [x] 5.1 Add unit and/or integration tests for list sort/search, detail aggregate, adjust up/down, zero-adjust reject, insufficient-balance reject, refund ledger type
- [x] 5.2 Add tests for freeze preserves Stripe ids and unfreeze `UNPAID`→`ACTIVE`; skip integration cleanly when `DATABASE_URL` unset
- [x] 5.3 Confirm no route/UI/Ladle/Playwright/comp/cancel/GDPR files were added in this step

## 6. Validation and handoff

- [x] 6.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 6.2 Run package tests (e.g. `bun test packages/db/src/admin` and billing freeze tests) — pass or skip cleanly without Stripe/network
- [x] 6.3 Mark step 01 done in `admin-ops-parent-guide.md`; update `docs/product/` only if behavior diverged; note any freeze/Stripe edge cases for step 05 / `DEPLOYMENT.md`
