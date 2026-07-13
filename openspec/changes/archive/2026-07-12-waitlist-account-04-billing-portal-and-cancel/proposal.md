## Why

Step 03 delivered the profile shell with a billing nav stub, but members still cannot self-serve payment updates or cancel. Phase 6 already owns Checkout, webhooks, and `CANCELLED_PENDING` / EXPIRY lifecycle — this step closes the missing `/profile/billing` surface so Customer Portal recovery and in-app cancel-at-period-end are reachable without inventing a parallel billing state machine.

## What Changes

- Add `@unveiled/billing` helpers: `createBillingPortalSession` and cancel-at-period-end (Stripe `cancel_at_period_end`), exported from the package index.
- Implement authenticated `/:locale/profile/billing` SSR page — plan (`BASIC_BERLIN` / Basic Berlin), status, period end, payment method / billing address when known; CTAs for Customer Portal (SSR POST → redirect) and cancel.
- Implement cancel confirm as a dedicated SSR page (`/:locale/profile/billing/cancel`) + POST when cancel needs a second step.
- PAST_DUE: messaging + portal CTA (existing webhooks restore `ACTIVE`); INACTIVE: reactivation CTA → `/:locale/membership` Checkout.
- Verify renewal / period-end EXPIRY paths already in lifecycle; extend `@unveiled/billing` package tests for cancel → `CANCELLED_PENDING` and EXPIRY assertions — **no second EXPIRY writer**.
- Handoff notes for Stripe Customer Portal dashboard config (step 05 `DEPLOYMENT.md`); usually no new env vars beyond existing Stripe keys.

**Out of scope:** GDPR export/delete pages (Phase 8); admin credit adjust / freeze / comp (Phase 8); waitlist changes (step 02); Playwright / Ladle / release docs (step 05); new Stripe products/prices.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `credits-subscription`: Add Stripe Customer Portal from profile billing and in-app cancel → immediate `CANCELLED_PENDING` (access until period end); clarify Phase 7 verifies monthly EXPIRY + refill UX without claiming rollover (lifecycle already implemented).
- `member-profile`: Add `/profile/billing` summary + portal/cancel CTAs; billing nav is a real page (no longer a stub-only path).

## Impact

- **Packages:** `@unveiled/billing` — portal session + cancel helpers, tests with Stripe mocked; lifecycle/webhook paths unchanged as source of truth for status.
- **App:** `apps/web` — `profile/billing` (+ optional `billing/cancel`) routes and HeroUI profile billing components; load `stripeCustomerId` / subscription from session user’s row (never client-supplied).
- **Auth:** Existing `/profile/*` session + onboarding guards; USER-scoped self-service.
- **Dependencies:** Existing `stripe` client; no new npm packages or Stripe products.
- **Downstream:** Consumed by `waitlist-account-05-ladle-e2e-and-release` (portal/cancel e2e + `DEPLOYMENT.md` portal notes).
- **Verification:** `bun run lint`, `bun run typecheck`, `bun test` on `@unveiled/billing`.
- **Branch:** `waitlist-account-04-billing-portal-and-cancel`.
- **Product SoT:** `docs/product/features/profile.feature`, `docs/product/features/credits-subscription.feature` — update only if implementation diverges.
