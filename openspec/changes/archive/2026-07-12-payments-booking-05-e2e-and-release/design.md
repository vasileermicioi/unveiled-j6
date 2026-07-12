## Context

Steps 01–04 shipped schema, Stripe Checkout + webhooks, atomic `bookEvent`, book/confirm UI, paginated `/bookings`, and Ladle shells. There are **no** Playwright specs for `credits-subscription.feature` or `booking.feature`; coverage-matrix rows remain `unshipped`. `e2e/README.md` has no Stripe mock policy. `DEPLOYMENT.md` lists Phase 6 env var names but lacks test-card / webhook / demo-script detail for the client loop.

Canonical inputs: `.dev-plan/current-iteration/payments-booking-05-e2e-and-release.md`, parent guide release criteria, `docs/product/testing/bdd-and-e2e.md`, feature Gherkin, existing `e2e/specs/*.spec.ts` patterns (`test("Scenario: …")`, proximity selectors, `fixtures/auth.ts`).

## Goals / Non-Goals

**Goals:**

- Playwright coverage for Phase 6 **member** payment + booking flows with verbatim Scenario titles.
- Explicit deferrals for Phase 7/8 / post-MVP scenarios.
- Documented Stripe test vs mock/seed strategy; coverage matrix updated.
- `DEPLOYMENT.md` + staging smoke so the client demo is repeatable.
- Lint/typecheck green; no secrets committed; no Phase 7 start.

**Non-Goals:**

- New product features, waitlist UI, profile/billing/Customer Portal CTAs, admin ops.
- Changing booking/Stripe domain behavior (bugs fixed only if e2e proves shipped divergence from product Gherkin).
- Partner portal / check-in.
- Guaranteeing Resend inbox assertions in CI without an email capture harness.

## Decisions

### 1. Scenario inventory (Phase 6 in-scope vs deferred)

**`credits-subscription.spec.ts` — implement or seed-backed pass:**

| Scenario | Approach |
|---|---|
| New signups start inactive with starter credits | Fresh signup → assert membership/onboarding credit UX if visible; else assert via membership gate + documented balance expectation after signup (starter 17 / `INACTIVE`) |
| Activating a subscription via real Stripe Checkout | Prefer real test Checkout when secrets + forwarding allow; else skip with named reason **and** prove activation on staging checklist; optional DB seed of `ACTIVE` for downstream booking specs only |
| Checkout blocked while frozen | Seed `UNPAID` → `/membership` shows payment-stopped + support |
| Already-active member revisits checkout | Seed `ACTIVE` → already-active state, no Checkout form |
| Failed payment marks the account past due | Prefer webhook fixture or DB seed to `PAST_DUE` + assert booking frozen message; full Stripe fail path may be staging-only |
| Booking gate by subscription status | Matrix of `INACTIVE`/`UNPAID` → checkout or frozen messaging; `ACTIVE`/`CANCELLED_PENDING` can open book; `PAST_DUE` frozen message (not silent redirect) |
| Monthly renewal resets credits | **Defer or skip** — webhook unit/integration already cover; e2e optional only if cheap stub exists; otherwise named deferral “covered by billing package tests / staging webhook” targeting Phase 6 note (not Phase 7 UI) |

**Defer (skip with reason + target phase):**

| Scenario | Target |
|---|---|
| Recovering from past due | Phase 7 (Customer Portal) |
| Cancelling a subscription / Cancellation takes effect / Reactivating | Phase 7 (profile/portal) |
| Admin adjust / zero / refund / freeze / unfreeze / comp | Phase 8 |

**`booking.spec.ts` — implement:**

| Scenario | Approach |
|---|---|
| Booking requires authentication | Guest hits book → redirect sign-in |
| Booking requires an active subscription | Signed-in non-bookable status → membership (or frozen for `PAST_DUE` per gate rules) |
| Successful booking | `ACTIVE` + capacity + credits → confirm + redemption |
| Redemption info by ticket type… | Prefer one SECRET_CODE path in e2e; outline rows deferred if seed lacks all modes — name deferral per missing mode |
| Booking fails — insufficient credits | Seed low balance → reject, no side effects visible |
| Booking fails — subscription frozen (past due) | `PAST_DUE` → frozen message |
| Idempotent retry | Double-submit same form/key if UI exposes stable key; else skip with reason “idempotency covered by `book-event.integration.test`” |
| Post-booking actions | Copy code, ICS link/download, support email on confirm and/or `/bookings` |
| Booking confirmation email | Assert only if harness supports (Resend test API / log); else document staging checklist + skip |
| Members cannot self-cancel or self-refund | Assert no cancel/refund member control on confirm/bookings |

**Defer:**

| Scenario | Target |
|---|---|
| Sold out — automatic waitlist offer | Phase 7 |
| Admin cancels / Cannot cancel non-confirmed | Phase 8 |

### 2. Stripe strategy: test mode first, seed for gates

```text
Prefer: Stripe test mode + webhook → ACTIVE (local stripe listen / staging endpoint)
Fallback for CI gates: e2e fixture mutates subscriptions/credits via DATABASE_URL + @unveiled/db
Never: mock Checkout in production code paths
```

- Document in `e2e/README.md`: when `STRIPE_*` missing, activation scenario skips; booking specs use DB seed helpers.
- Do **not** add production “test activate” routes.
- Webhook signing: if simulating `checkout.session.completed` in e2e, only via Stripe CLI/`stripe trigger` or a carefully signed payload using `STRIPE_WEBHOOK_SECRET` — prefer DB seed for non-activation scenarios to keep CI stable.

**Alternatives considered:** Drive Checkout UI in every CI run — rejected as flaky without dedicated Stripe test clocks/CLI. Pure unit coverage only — rejected; step requires Playwright Scenario titles.

### 3. Fixtures layout

```text
e2e/fixtures/billing.ts   # setSubscriptionStatus, setCreditBalance, ensureBookableEventHref
e2e/specs/credits-subscription.spec.ts
e2e/specs/booking.spec.ts
```

- Reuse `loginAsUser`, `signupFreshUser`, `completeOnboardingWizard`.
- DB helpers: allowed **only** in e2e fixtures when `DATABASE_URL` is set; comment that this is harness state setup, not product SoT. If `DATABASE_URL` absent, skip DB-dependent tests with clear message.
- Bookable event: navigate Discover/member feed seeded catalog; prefer existing demo events with known `creditPrice` / capacity. If needed, admin create via existing admin fixtures (heavier) — prefer seed.

### 4. Selectors and titles

- Verbatim: `test("Scenario: Successful booking", …)` etc.
- Proximity only: `getByRole` / `getByLabel` / `getByText` / filter; no `data-testid`, no CSS-module fishing.
- Locale: default `de` via `fixtures/base` unless scenario needs EN.

### 5. Coverage matrix + README

- Update each Phase 6 booking/credits row: `pass` with `e2e/specs/….spec.ts` + title, or `deferred`/`skip` with notes.
- Fix stale matrix note that “Sold out — waitlist” is Phase 6 — mark Phase 7.
- `e2e/README.md`: new section **Stripe / payments (Phase 6)**; add both specs to inventory table; extend skip inventory with named deferrals.

### 6. DEPLOYMENT.md Phase 6 release block

Add/expand:

- Env table already has Stripe/Resend — mark **required on staging** for Phase 6 demos; document test card `4242 4242 4242 4242` (any future expiry, any CVC) and 3DS cards if used.
- Webhook: `POST {SITE_URL}/api/webhooks/stripe` (confirm actual route path from app) + `stripe listen --forward-to` for local.
- Demo accounts: inactive member for Checkout; optional ACTIVE seed user for booking-only demos.
- Staging smoke checklist: subscribe → ACTIVE → book → confirm code → `/bookings` → email (Resend dashboard) → stop (no Phase 7).
- Record staging URL / deploy note when deploy succeeds (same pattern as prior phases).

### 7. Validation gate

1. `bun run lint` / `bun run typecheck` → 0  
2. `bun run test:e2e` for the two new specs (or documented skip path when secrets missing)  
3. Staging smoke per checklist  
4. Parent guide: step 05 → done; feature releasable  
5. Do not start Phase 7

## Risks / Trade-offs

- **[CI cannot complete Stripe Checkout]** → Mitigation: skip activation with named reason; seed ACTIVE for booking; staging checklist is the real Checkout proof.
- **[DB fixture drifts from webhook activation semantics]** → Mitigation: seed only status/balance fields needed for gates; do not invent ledger rows unless asserting ledger UI; keep activation proof on Stripe path/staging.
- **[Email assertion flaky]** → Mitigation: skip + DEPLOYMENT manual check; do not add fake SMTP to the app.
- **[Idempotency not UI-visible]** → Mitigation: defer to package integration test with named reason.
- **[Sold-out currently errors without waitlist]** → Mitigation: do not assert waitlist offer; Phase 7 owns that Scenario.
- **[Matrix still says Phase 6 for waitlist row]** → Mitigation: correct target phase while updating statuses.

## Migration Plan

1. Inventory + README Stripe policy + DEPLOYMENT draft (can land early).
2. Add billing fixtures; write credits-subscription + booking specs for seed-backed gates.
3. Wire activation scenario (real Checkout or skip); update coverage matrix + skip inventory.
4. Run lint/typecheck/e2e; deploy staging; complete smoke checklist; mark parent guide done.
5. Rollback: delete new specs/fixtures and revert matrix/docs — no schema migration.

## Open Questions

- Exact Stripe webhook route path in `apps/web` — **resolve during apply** by reading the route file; document the real path in DEPLOYMENT.
- Whether CI will hold `STRIPE_*` secrets in this phase — **default:** support both full and skip paths; do not block merge solely on Checkout e2e if staging smoke is recorded.
- Seed catalog ticket modes for redemption outline — **default:** one SECRET_CODE happy path in e2e; defer remaining outline rows if seed lacks VOUCHER / UNIQUE_PER_BOOKING.
