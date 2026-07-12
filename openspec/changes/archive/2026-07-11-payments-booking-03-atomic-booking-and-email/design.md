## Context

Steps 01–02 delivered `bookings` / `credit_ledger`, `createTxDb` (Neon Pool + `SELECT FOR UPDATE`), Stripe Checkout, webhook-driven `ACTIVE` subscriptions, and stub `@unveiled/email`. Event detail and the member feed still point guests at login/membership and show a “booking coming” placeholder for active members — there is no `bookEvent`, no `/events/:id/book` routes, and no Resend confirmation.

Canonical behavior: `docs/product/features/booking.feature`, gate table in `credits-subscription.feature`, transaction sketch in `docs/product/database/schema-overview.md`, routes in `docs/product/sitemap/sitemap.md`. Step plan: `.dev-plan/current-iteration/payments-booking-03-atomic-booking-and-email.md`.

App runtime is Cloudflare Workers; transactional writes must use per-request `createTxDb` + `pool.end()` (same pattern as Stripe webhooks). Packages must not depend on `apps/web`.

## Goals / Non-Goals

**Goals:**

- Single transactional `bookEvent` that is the only purchase writer of bookings + `BOOKING` ledger rows.
- SSR book + confirm pages with auth/subscription gates matching the product gate table.
- Redemption generation for all SECRET_CODE modes + VOUCHER.
- Resend confirmation email with ICS after successful commit; same sender API reusable later by comps/waitlist.
- Package tests for success, insufficient credits, sold-out, PAST_DUE, idempotent retry; email unit tests without live Resend.
- Wire event-detail (and remove feed “booking coming” for eligible members) to the book route.

**Non-Goals:**

- Paginated `/bookings` list, Ladle stories, Playwright (steps 04–05).
- Waitlist join/promotion UI or routes (Phase 7) — sold-out is a hard reject.
- Admin cancel, admin comp UI, Customer Portal, member self-cancel/refund.
- Daily partner codes cron.

## Decisions

### 1. Booking domain lives in `@unveiled/db`

```
packages/db/src/booking/
  index.ts           # public exports
  book-event.ts      # bookEvent(+ options)
  eligibility.ts     # subscription gate helpers + typed errors
  redemption.ts      # SECRET_CODE / VOUCHER generation
  errors.ts          # InsufficientCredits, SoldOut, PastDue, Ineligible, …
```

- `bookEvent(txDb, input)` runs inside `db.transaction(async (tx) => { … })` using the Pool client.
- Input: `{ userId, eventId, ticketsCount, idempotencyKey, skipCreditCharge?: boolean }`.
- Return: `{ booking, redemption, created: boolean }` — `created: false` on idempotent hit.
- Export from `@unveiled/db` (or `@unveiled/db/booking` if package exports are already split; prefer main index re-export like `catalog`).

**Alternatives:** Put domain in `apps/web/app/lib` — rejected (AGENTS: business logic in packages). New `@unveiled/booking` package — rejected as overkill for one domain module when catalog already lives under `@unveiled/db`.

### 2. Transaction order (normative)

Inside one transaction:

1. If a booking exists for `(userId, idempotencyKey)` → return it (no further mutation).
2. `SELECT … FOR UPDATE` event row; load user + subscription (lock user row when charging credits).
3. Eligibility: allow only `ACTIVE` | `CANCELLED_PENDING`; throw typed errors for `PAST_DUE` / `INACTIVE` / `UNPAID` / missing.
4. Validate `ticketsCount` ∈ {1,2,3}.
5. Capacity: `remainingCapacity >= ticketsCount` else sold-out error.
6. Credits: unless `skipCreditCharge`, require `users.credits >= creditPrice * ticketsCount`.
7. Decrement `remainingCapacity`; decrement `users.credits` when charging.
8. Generate redemption (may update `events.secret_code` for first `SHARED_GENERATED` booking while row locked).
9. Insert booking `status = CONFIRMED` with redemption fields, `partnerId` from event, `totalCredits` = price×qty (0 if skip charge).
10. If charging: insert ledger `type = BOOKING`, `amount = -totalCredits`, `balanceAfter = new balance`, `idempotencyKey = booking:{userId}:{idempotencyKey}` (or similar unique key).
11. Commit.

Email and ICS are **outside** the transaction — after commit succeeds.

### 3. Redemption rules

| ticketType | mode | Behavior |
|---|---|---|
| `SECRET_CODE` | `MANUAL` | Copy event `secret_code` into booking `redemptionInfo` |
| `SECRET_CODE` | `SHARED_GENERATED` | If event `secret_code` null/empty, generate once, persist on event, reuse; else reuse existing |
| `SECRET_CODE` | `UNIQUE_PER_BOOKING` | Generate fresh code per booking; do not overwrite event-level code |
| `VOUCHER` | n/a | `redemptionInfo` = promo code; `redemptionUrl` = `eventWebsiteUrl` |

`redemptionType` mirrors event `ticketType`. Codes: URL-safe alphanumeric, length ~8–10 (crypto random); document helper in `redemption.ts`.

### 4. SSR routes and gates

```
apps/web/app/routes/[locale]/events/[id]/book.tsx          # GET form + POST
apps/web/app/routes/[locale]/events/[id]/book/confirm.tsx # GET only
```

**GET `/book`:**

- No session → 302 sign-in (preserve return URL).
- Load subscription: `INACTIVE`/`UNPAID`/missing → 302 `/:locale/membership`; `PAST_DUE` → render frozen message (no form POST); `ACTIVE`/`CANCELLED_PENDING` → form.
- Form: HeroUI `Select` tickets 1–3; hidden `idempotencyKey` (UUID minted on GET); copy “SECURE RSVP // NO REFUNDS”; primary submit.
- Prefer saturated yellow / low chrome per design-tokens note for book+confirm.

**POST `/book`:**

- Same gate checks server-side (never trust client).
- `createTxDb` → `bookEvent` → `pool.end()`.
- On success → 302 `/:locale/events/:id/book/confirm?booking=<bookingId>`.
- On typed errors → re-render form with Alert (insufficient credits / sold-out / past due); do not offer waitlist.

**GET `/book/confirm`:**

- Auth required; load booking by id; verify `booking.userId === session.user.id` and `booking.eventId === :id`.
- Show redemption (copy control via HeroUI), ICS download link/button, `support@unveiled.berlin`.
- ICS: either same-route query `?format=ics` or a tiny sibling route — prefer confirm route responding with `text/calendar` when `?download=ics` to avoid an extra file.

**Idempotency key:** generated server-side on GET and submitted as hidden field so double-submit / back-button POST retries safely. Do not regenerate on validation error re-render of the same attempt (preserve posted key).

### 5. Event detail + feed CTA wiring

- `EventDetailPage`: when session user is book-eligible and event is bookable → primary Link/Button to `/:locale/events/:id/book`; guests keep sign-in; ineligible → membership or frozen messaging consistent with gates.
- `EventFeedPage`: remove or replace `bookingComing*` alert for `subscriptionActive` members so they proceed to event detail → book (no new feed book modal).

Pass session/subscription into detail from the route (mirror feed’s `subscriptionActive` pattern); do not trust client-only checks.

### 6. `@unveiled/email` confirmation + ICS

```
packages/email/src/
  index.ts
  resend-client.ts       # send via fetch or resend SDK
  booking-confirmation.ts # build subject/body DE|EN + attach ICS
  ics.ts                 # build VEVENT from event fields (Europe/Berlin)
```

- Env: `RESEND_API_KEY`; from-address `DAILY_CODES_FROM_EMAIL` (reuse until a dedicated booking-from exists — document in handoff).
- `sendBookingConfirmation({ to, locale, event, booking, redemption })` builds HTML/text + `.ics` attachment, calls Resend.
- **Retry policy (this step):** fire-and-forget after commit; on failure log structured error (booking id, user id) and **do not** roll back the booking. No automatic retry queue in Phase 6 — confirm page remains source of truth; step 05/ops can resend manually if needed. Export builder separately so tests assert content without network.
- Comp/waitlist will call the same `sendBookingConfirmation` later.

**Alternatives:** Include email inside the DB transaction — rejected (external I/O must not hold locks). Sync retry loop in request — rejected on Workers latency; log-only is enough for MVP.

### 7. Tests

- `@unveiled/db` booking tests against transactional client / test DB (or drizzle mock tx if already used): success path, insufficient credits (capacity unchanged), sold-out, PAST_DUE, concurrent capacity race if feasible, idempotent second call.
- `@unveiled/email`: unit-test ICS + template builders; mock `fetch` for send wrapper.
- Scripts: `bun --filter @unveiled/db test` (booking suite) and email test script; plus root `lint` / `typecheck`.

## Risks / Trade-offs

- **[Email lost after successful book]** → Mitigation: confirm page always shows redemption; log failures with booking id; optional admin/resend later.
- **[SHARED_GENERATED race]** → Mitigation: generate under event `FOR UPDATE` so only one writer populates `secret_code`.
- **[booking.feature “non-ACTIVE → membership” vs PAST_DUE frozen]** → Mitigation: implement **credits-subscription gate table** (PAST_DUE frozen message); document divergence from the coarser booking.feature line.
- **[Sold-out waitlist scenario in booking.feature]** → Mitigation: Phase 6 rejects without waitlist UI per parent guide; Phase 7 owns waitlist offer.
- **[Workers + Pool]** → Mitigation: per-request pool + `end()`; same as webhooks.
- **[Double charge without idempotency]** → Mitigation: unique `(user_id, idempotency_key)` + ledger unique key; preserve key across POST retries.

## Migration Plan

1. Implement booking domain + tests; implement email builders + tests.
2. Add book/confirm routes; wire detail/feed CTAs; remove booking-coming placeholder for active members.
3. Document Resend env vars for step 05 `DEPLOYMENT.md`.
4. Rollback: remove routes/CTA wiring; domain module unused — DB rows remain forward-compatible.

## Open Questions

- Exact from-address for booking mail vs daily codes — default to `DAILY_CODES_FROM_EMAIL` unless product adds a dedicated var in integrations doc during apply.
- ICS download UX: query on confirm vs `data:`/blob island — prefer server `text/calendar` response (no new client island) unless HeroUI download pattern already exists.
- Whether feed should deep-link straight to `/book` from cards — prefer detail → book to keep one composition; only change detail CTA + remove “coming soon” on feed.
