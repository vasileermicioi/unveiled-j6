## Context

Phase 7 steps 01–03 shipped waitlist + profile shell. `/profile` already links to `/:locale/profile/billing`, but that route does not exist yet. Phase 6 `@unveiled/billing` already owns:

- Checkout (`createCheckoutSession`) and webhook application (`applyStripeEvent`)
- `activateOrRenewCredits` (EXPIRY + `SUBSCRIPTION_REFILL` +17)
- `applySubscriptionUpdated` (`cancelAtPeriodEnd` → `CANCELLED_PENDING`; PAST_DUE → ACTIVE recovery)
- `applySubscriptionDeleted` (INACTIVE + EXPIRY)
- Membership Checkout route that loads `stripeCustomerId` from the session user’s `subscriptions` row

Product SoT: `docs/product/features/profile.feature` (billing + cancel), `docs/product/features/credits-subscription.feature` (portal recovery, cancel, period end, EXPIRY). Step plan: `.dev-plan/current-iteration/waitlist-account-04-billing-portal-and-cancel.md`.

## Goals / Non-Goals

**Goals:**

- Authenticated `/profile/billing` summary (plan, status, period end, payment method / address when known).
- SSR POST → Stripe Customer Portal session redirect for payment-method / address updates and PAST_DUE recovery.
- SSR cancel confirm → Stripe `cancel_at_period_end` → local `CANCELLED_PENDING` (webhook-compatible).
- INACTIVE reactivation CTA → existing `/membership` Checkout.
- Package helpers + unit tests (Stripe mocked); verify EXPIRY renewal assertions without a second ledger writer.
- Handoff notes for Customer Portal dashboard config (step 05 `DEPLOYMENT.md`).

**Non-Goals:**

- GDPR export/delete pages (Phase 8).
- Admin credit adjust / freeze / comp / booking cancel UI (Phase 8).
- Waitlist changes; Playwright / Ladle / full release docs (step 05).
- New Stripe products/prices; parallel recovery API; client-only mutation modals.
- Marketing copy sweep for “credits roll over” (Phase 8) — still avoid introducing rollover language on billing UI.

## Decisions

### 1. Portal + cancel live in `@unveiled/billing`

```
packages/billing/src/
├── portal.ts              # createBillingPortalSession
├── cancel-subscription.ts # cancelSubscriptionAtPeriodEnd (or co-locate with portal)
├── subscription-lifecycle.ts  # unchanged writers — call applySubscriptionUpdated if needed
├── billing.test.ts        # extend portal/cancel + EXPIRY assertions
└── index.ts               # re-export
```

**Rationale:** Matches Checkout/webhook package boundary; routes stay thin (AGENTS.md).

**Alternatives considered:** Inline Stripe calls only in `apps/web` routes (rejected — business logic rule); new `@unveiled/billing-portal` package (overkill).

### 2. Never trust client `stripeCustomerId`

Load subscription by `session.user.id` from `subscriptions`. Portal session input is `{ customerId: subscription.stripeCustomerId, returnUrl }`. If `stripeCustomerId` is missing, do not call Stripe — show error / membership reactivation path.

Same rule for cancel: resolve `stripeSubscriptionId` from the row, not form fields.

### 3. Webhook remains source of truth; in-app cancel alignment

```typescript
cancelSubscriptionAtPeriodEnd({ stripe, stripeSubscriptionId })
// → stripe.subscriptions.update(id, { cancel_at_period_end: true })
```

Then either:

- **Preferred:** Rely on `customer.subscription.updated` webhook → existing `applySubscriptionUpdated({ cancelAtPeriodEnd: true })` → `CANCELLED_PENDING`, **or**
- **Optimistic UX:** After successful Stripe update, call `applySubscriptionUpdated` with the same shape the webhook uses so the UI shows `CANCELLED_PENDING` before webhook delivery — still idempotent with the webhook.

**Do not** invent a separate status writer that bypasses lifecycle helpers.

**Alternatives considered:** Cancel only via Customer Portal configuration (no in-app cancel) — rejected; product requires in-app cancel. Immediate Stripe `cancel` (delete now) — rejected; product is cancel-at-period-end with access until `period_end`.

### 4. Routes and SSR POST pattern

| Route | Behavior |
|---|---|
| `GET /:locale/profile/billing` | Summary + status-specific CTAs |
| `POST /:locale/profile/billing/portal` (or POST on billing with `intent=portal`) | Create portal session → `302` to `session.url` |
| `GET+POST /:locale/profile/billing/cancel` | Confirm page; POST → cancel helper → redirect to billing |

Prefer a **dedicated cancel confirm page** (second step) per step plan. Portal can be a simple POST form on the billing page (single intent).

Follow membership/profile PRG: parse body, package helper, validation/error → re-render, success → redirect.

Guards: existing session + onboarding middleware for `profile` prefix; USER self-service.

### 5. UI composition

- `apps/web/app/components/profile/` — HeroUI-only billing summary, portal form, cancel confirm (Card, Heading, Paragraph, Form, Button, Link, Chip for status).
- Copy in `profile-content` / billing-specific content module — no rollover claims.
- Theme tokens for visuals; Tailwind layout only; yellow page backdrop via shell.
- Status variants:
  - `ACTIVE` / `CANCELLED_PENDING` — plan summary; portal CTA; cancel CTA (hide cancel if already `CANCELLED_PENDING`).
  - `PAST_DUE` — frozen-credits style messaging + portal CTA (update payment).
  - `INACTIVE` — reactivation link to membership Checkout.
  - `UNPAID` — support / frozen messaging (no portal cancel that clears admin freeze); align with membership frozen view.

Payment method / billing address: show from `subscriptions.paymentMethod` / `billingAddress` when present; if null, still show plan/status and portal CTA (“Update in Stripe”). Optional: read default payment method from Stripe Customer for richer summary — **only if cheap**; do not block MVP on live Stripe Customer retrieve if DB fields suffice for step 04.

### 6. EXPIRY verification — extend tests, do not duplicate writers

Existing tests in `billing.test.ts` already cover `activateOrRenewCredits` EXPIRY + refill and `applySubscriptionUpdated` → `CANCELLED_PENDING`. Extend with:

- Cancel helper unit test (mock Stripe `subscriptions.update` with `cancel_at_period_end: true`).
- Portal session unit test (mock `billingPortal.sessions.create`).
- Assert renewal / period-end EXPIRY paths still hold; **grep/confirm** no new EXPIRY insert path was added outside lifecycle.

### 7. Env and Stripe Dashboard config

- **App env:** reuse `STRIPE_SECRET_KEY`, `SITE_URL` (return URL base). Usually **no new env vars**.
- **Dashboard:** Customer Portal must be enabled; configure allowed actions (payment method update, cancel at period end). Document requirements in handoff for step 05 `DEPLOYMENT.md` — do not rewrite full deployment docs in this step.

**return_url:** `https://{SITE_URL}/{locale}/profile/billing` (absolute).

## Risks / Trade-offs

- **[Race] In-app cancel vs webhook delay** → Prefer calling `applySubscriptionUpdated` after Stripe success for immediate UX; webhook remains idempotent.
- **[Portal cancel vs in-app cancel]** → Both set `cancel_at_period_end`; webhook handles either. Ensure Dashboard portal cancellation mode is “at period end,” not immediate — note in handoff.
- **[Missing stripeCustomerId]** → Block portal; steer INACTIVE/new members to Checkout which creates the customer.
- **[UNPAID admin freeze]** → Do not clear via portal optimism; lifecycle already refuses clearing UNPAID on active events.
- **[Payment method summary empty]** → Accept sparse DB fields + portal CTA rather than blocking on Stripe Customer retrieve (trade richer UI for fewer live Stripe calls in SSR).

## Migration Plan

1. Land package helpers + tests first (no route dependency).
2. Add billing + cancel routes; profile link already points at billing.
3. Enable/configure Customer Portal in Stripe test mode before staging smoke (step 05).
4. Rollback: remove routes / helpers; webhook lifecycle remains intact for existing subscriptions.

## Open Questions

- None blocking — prefer dedicated `/profile/billing/cancel` confirm page; optional Stripe Customer retrieve for payment method display can wait if DB fields are empty in seed.
