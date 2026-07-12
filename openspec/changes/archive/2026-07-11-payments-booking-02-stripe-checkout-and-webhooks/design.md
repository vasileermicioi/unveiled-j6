## Context

Step 01 delivered `bookings` / `credit_ledger`, `createTxDb`, and stub `@unveiled/billing` / `@unveiled/email`. Subscriptions already exist (`status`, `stripeCustomerId`, `stripeSubscriptionId`, `periodEnd`). `/membership` is marketing-only SSR; there is no Stripe client, webhook route, or ledger refill path.

Canonical behavior: `docs/product/features/credits-subscription.feature`. Env + event list: `docs/product/extras/integrations-and-config.md`. Step plan: `.dev-plan/current-iteration/payments-booking-02-stripe-checkout-and-webhooks.md`.

App runtime is Cloudflare Workers; `/api/auth/*` is registered on the outer Hono app in `apps/web/app/server.ts` **before** the locale catch-all — webhooks must follow the same pattern so `/:locale/*` does not swallow `/api/webhooks/stripe`.

## Goals / Non-Goals

**Goals:**

- Real Stripe Billing Checkout Session (`mode: "subscription"`) for Basic Berlin from signed-in membership POST.
- Verified webhook handler that drives subscription status + credit ledger (activation, renewal no-rollover, past due, cancel-at-period-end, period-end inactive).
- Membership SSR states: start Checkout, already-`ACTIVE`, `UNPAID` blocked, guest marketing + auth CTA.
- Success return → locale-prefixed `/events`.
- Fixture-based package tests; list Stripe env vars for step 05 `DEPLOYMENT.md`.

**Non-Goals:**

- Atomic `bookEvent`, booking pages, Resend/ICS.
- Stripe Customer Portal UI / `/profile/billing` (Phase 7) — webhooks MUST still accept portal-driven subscription events.
- Admin freeze/unfreeze UI (still gate Checkout when status is `UNPAID`).
- Playwright / Ladle.
- Mocking Checkout in production paths.

## Decisions

### 1. Package layout in `@unveiled/billing`

```
packages/billing/src/
  index.ts              # public exports
  stripe-client.ts      # createStripeClient(secretKey) → Stripe
  checkout.ts           # createCheckoutSession({...})
  webhooks.ts           # verifyStripeWebhook + applyStripeEvent
  subscription-lifecycle.ts  # activateOrRenewCredits, markPastDue, applySubscriptionUpdate, applySubscriptionDeleted
```

- Depend on `stripe` + `@unveiled/db` (types / schema symbols only for write helpers; DB instance injected by callers).
- Export: `createStripeClient`, `createCheckoutSession`, `constructStripeEvent` (or `verifyAndParseWebhook`), `applyStripeEvent`.
- Omit `payment_method_types` on Checkout Session create (Stripe skill / dynamic payment methods).
- Price: `STRIPE_PRICE_ID_BASIC_BERLIN`. Success URL: `{SITE_URL}/{locale}/events?checkout=success` (or equivalent). Cancel URL: `{SITE_URL}/{locale}/membership`.
- Pass `client_reference_id` / `metadata.userId` = Better Auth user id; reuse existing `stripeCustomerId` via `customer` when present, else `customer_email` from session user.

**Alternatives:** Put all Stripe logic in `apps/web` — rejected; AGENTS.md keeps business logic in packages.

### 2. Webhook route registration

Register on the outer Hono app (same layer as auth proxy):

```ts
// apps/web/app/server.ts
app.post("/api/webhooks/stripe", stripeWebhookHandler);
```

Handler lives in `apps/web/app/lib/stripe-webhook.ts` (or `routes/api/...` imported into `server.ts`). Raw body required for signature verification — do **not** JSON-parse before `stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET)`.

Per-request `createTxDb(DATABASE_URL)` → `applyStripeEvent` → `pool.end()` (or `waitUntil`).

**Alternatives:** File-only HonoX route under `[locale]` — rejected (locale prefix wrong; catch-all risk).

### 3. Event → domain mapping

| Stripe event | App effect |
|---|---|
| `checkout.session.completed` | Resolve user; store `stripeCustomerId` / `stripeSubscriptionId`; run **activateOrRenew** (ACTIVE + EXPIRY + SUBSCRIPTION_REFILL + credits=17 + `periodEnd` from Subscription retrieve if needed) |
| `invoice.paid` with `billing_reason` in `subscription_cycle` (and optionally `subscription_update` when appropriate) | **Renewal** path: same activateOrRenew (idempotent by invoice id) |
| `invoice.payment_failed` | Status → `PAST_DUE` |
| `customer.subscription.updated` | If `cancel_at_period_end` → `CANCELLED_PENDING` + sync `periodEnd`; if status `active` and was `PAST_DUE` → `ACTIVE` (no forced refill until next cycle); sync Stripe IDs / period |
| `customer.subscription.deleted` | Status → `INACTIVE`; EXPIRY remaining credits (amount 0 allowed); clear or keep Stripe IDs per existing rows (keep IDs for audit; status is source of truth for gates) |

`invoice.paid` is **in addition** to the four events named in the step plan (“at least …”) so monthly renewal refill has a clear Stripe signal; `checkout.session.completed` alone does not fire on each cycle.

**Idempotency:**

- Ledger writes use non-null `idempotency_key`s such as `expiry:{invoiceOrSessionId}` and `refill:{invoiceOrSessionId}` (or Stripe `event.id` suffixes) so retries no-op via unique constraint / catch duplicate.
- Status updates are set-based (write target status even if already set).
- Skip activateOrRenew if an identical refill key already exists.

**UNPAID vs PAST_DUE:** Admin freeze (`UNPAID`) is independent of Stripe dunning (`PAST_DUE`). Webhooks MUST NOT overwrite `UNPAID` → `ACTIVE`/`PAST_DUE` without an explicit product rule — prefer: if current status is `UNPAID`, still store Stripe IDs/`periodEnd` but leave status `UNPAID` until admin unfreeze (Phase 8). Document this in code comments.

### 4. Membership route SSR + POST

`apps/web/app/routes/[locale]/membership.tsx`:

| Session / subscription | GET UX | POST |
|---|---|---|
| Guest | Existing marketing + auth CTA | N/A (or redirect auth) |
| Signed-in `ACTIVE` | Already-active / success state (no Checkout form) | No-op / redirect |
| Signed-in `UNPAID` | “Payment stopped” + `support@unveiled.berlin` | Reject (do not create Session) |
| Signed-in other (`INACTIVE`, `PAST_DUE`, `CANCELLED_PENDING` after period, etc.) | Plan summary + Checkout CTA | Create Session → 302 to `session.url` |

- Mutation = form POST on same route (`export const POST = createRoute(...)`) — SSR-only, no client-only Stripe.js modal as sole path.
- HeroUI-only markup; theme tokens; Tailwind layout only.
- Load subscription via existing session user id + `@unveiled/db` read (`createDb` fine for GET).

**PAST_DUE on membership:** Feature focuses frozen message on booking; for Checkout, allow starting Checkout / Portal later. Phase 6: allow Checkout Session for `PAST_DUE` so members can resubscribe/pay if needed, OR show update-payment messaging without Portal UI — prefer **allow Checkout for non-ACTIVE non-UNPAID** so recovery is possible before Phase 7 Portal. `CANCELLED_PENDING` while still in period: treat like already-active for Checkout (no new Session) — member retains access until period end.

### 5. activateOrRenew transaction

Inside `createTxDb` transaction:

1. Lock user row (`SELECT … FOR UPDATE`) and load subscription.
2. Read current `users.credits`.
3. Insert `EXPIRY` ledger with `amount = -currentCredits` (or 0 if balance 0), `balanceAfter = 0`.
4. Insert `SUBSCRIPTION_REFILL` +17, `balanceAfter = 17`.
5. Update `users.credits = 17`.
6. Update subscription: `status = ACTIVE`, Stripe IDs, `periodEnd`, `plan = "Basic Berlin"` (or price nickname), `updatedAt`.

All ledger amounts signed; descriptions human-readable (`Subscription refill`, `Credit expiry at period boundary`).

### 6. Tests

- Unit/integration in `packages/billing`: fixture event JSON + stub/fake tx or in-memory apply helpers; assert status transitions and that activateOrRenew orders EXPIRY then REFILL.
- Prefer no network: inject a mock Stripe client or test only `applyStripeEvent` with pre-parsed event objects and a test DB / mocked Drizzle tx if available.
- Script: `bun --filter @unveiled/billing test`.

### 7. Env / config

Required: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN`, `SITE_URL` (or existing public origin helper). `STRIPE_PUBLISHABLE_KEY` reserved for future client use — document but not required for server Checkout redirect.

Handoff list for step 05 `DEPLOYMENT.md`; optional comments near webhook handler.

## Risks / Trade-offs

- **[Double refill on first subscribe]** (`checkout.session.completed` + `invoice.paid` `subscription_create`) → Mitigation: idempotency keys per invoice/session; ignore `subscription_create` refill if checkout already refilled, or only refill on `subscription_cycle` for invoices and only on checkout for first activation.
- **[Workers + Stripe + Pool]** → Mitigation: per-request pool; verify webhook route works on staging in step 05; keep apply logic in package for Bun tests.
- **[UNPAID overwritten by Stripe active]** → Mitigation: explicit guard — never auto-unfreeze from webhooks.
- **[PAST_DUE recovery without Portal]** → Accept Checkout re-entry or wait for Phase 7; document in open questions if product prefers block.
- **[Signature / raw body on Workers]** → Mitigation: read `arrayBuffer`/`text` from request before any middleware JSON parse; register route outside Honox locale stack.

## Migration Plan

1. Implement billing package + tests on branch.
2. Wire webhook on `server.ts` + membership POST/GET states.
3. Configure Stripe CLI / Dashboard webhook endpoint to `/api/webhooks/stripe` for staging.
4. Smoke (optional this step): test card → `ACTIVE`.
5. Rollback: remove webhook route + Checkout POST; stub package exports again — DB rows remain (status/ledger) and are forward-compatible.

## Open Questions

- Exact success query param (`?checkout=success`) vs clean `/events` — pick during apply; feature only requires routing to the events feed.
- Whether `CANCELLED_PENDING` members mid-period see already-active UX (recommended above) or a “cancels on {date}” message — prefer minimal already-active/success unless copy exists in i18n inventory.
- Tax / Stripe Tax — out of scope unless Dashboard already enables; do not add Tax API calls in this step.
