## Context

Ticket quantity is hard-capped at 3 in three places today:

1. `apps/web/app/islands/EventDetailCheckoutCard.tsx` — `MAX_QTY = 3` clamps +/− controls.
2. `apps/web/app/islands/TicketCountSelect.tsx` — fixed `TICKET_OPTIONS` 1–3 (book + waitlist forms).
3. `packages/db/src/booking/eligibility.ts` — `assertValidTicketCount` rejects `ticketsCount > 3`.

`bookEvent` already enforces remaining capacity and credits after the shape check. Product Gherkin still says “1 and 3”; docs/e2e sync is step 05. Parent guide marks 04 done and an incomplete archive exists, but the hard cap remains in code.

Source brief: `.dev-plan/current-iteration/event-detail-ux-04-dynamic-ticket-limits.md`. Depends on checkout card props from step 01. Detail route loads session + subscription for `viewer` but does **not** yet pass `users.credits` into the page.

## Goals / Non-Goals

**Goals:**

- Guests keep a 1–3 preview on the detail checkout card.
- Signed-in viewers (detail + book) see max = `min(floor(credits / creditPrice), remainingCapacity)` (UI treats 0 as disabled / no increase).
- Booking transaction accepts any integer ≥ 1 that passes capacity and credit checks — no reject solely for count > 3.
- Shared pure helper used by SSR wiring and (where practical) waitlist qty options.
- Unit tests cover helper math and qty > 3 when eligible.

**Non-Goals:**

- Layout/map polish (01–03).
- Full `docs/product/` / Playwright rewrites (05).
- Changing credit refill amounts or subscription eligibility gates.
- Redesigning waitlist UX.
- Admin comp-ticket qty rules (unless they already import the shared helper).
- Client-side booking mutations (SSR `/events/:id/book` POST remains).

## Decisions

1. **Helper location: `@unveiled/db` booking module**
   - **Choice:** Add `maxBookableTickets({ creditPrice, remainingCapacity, credits, viewerKind })` next to eligibility (e.g. `packages/db/src/booking/max-bookable-tickets.ts` or in `eligibility.ts`), export via `booking/index.ts` / package root.
   - **Rules:**
     - `viewerKind === "guest"` → `3`
     - signed-in → `max(0, min(floor(credits / creditPrice), remainingCapacity))`
     - if `creditPrice <= 0` → use `remainingCapacity` only (defensive; signed-in)
   - **Rationale:** One source for UI max and waitlist option upper bound; packages must not depend on `apps/web`.
   - **Alternatives:** Helper only in `apps/web/app/lib` (rejected; waitlist/booking domain would duplicate); hardcode per surface (rejected).

2. **`assertValidTicketCount`: shape only (≥ 1 integer)**
   - **Choice:** Validate `Number.isInteger(ticketsCount) && ticketsCount >= 1`. Drop the `> 3` upper bound and update error copy accordingly. Leave capacity (`SOLD_OUT`) and credits (`INSUFFICIENT_CREDITS`) as authoritative in `bookEvent`.
   - **Rationale:** Step plan prefers cheap shape check; server remains SoT; avoids a second capacity check before the lock.
   - **Alternatives:** Pass `remainingCapacity` into `assertValidTicketCount` (extra API surface; redundant with `bookEvent`); keep artificial max 3 for members (rejected by product).

3. **Viewer kind for max calculation**
   - **Choice:** Guests → 3. Any signed-in session (eligible, membership_required, past_due) → credits ∩ capacity using `users.credits` from the DB (same id as session user).
   - **Rationale:** Parent open question resolved — inactive/past_due still see credit-aware max; booking gate still blocks ineligible POST.
   - **Alternatives:** Cap non-eligible signed-in users at 3 (rejected; parent says credits + capacity for signed-in).

4. **Detail route wiring**
   - **Choice:** When session exists, load `users.credits` (and keep subscription → `viewer`). Compute `maxQty = maxBookableTickets(...)` with `event.creditPrice`, `event.remainingCapacity`. Pass `maxQty` into `EventDetailPage` → `EventDetailCheckoutCard`. Clamp `defaultQty` / `qty` query to `[1, maxQty]` when `maxQty >= 1`; if `maxQty === 0`, keep controls disabled / qty at 1 display with + disabled (book path already errors).
   - **Rationale:** Credits are not on the session object today; route already hits auth DB for subscription.
   - **Alternatives:** Trust client-supplied max (rejected); compute only on book page (rejected; detail must show correct +/−).

5. **`EventDetailCheckoutCard` API**
   - **Choice:** Add required (or defaulted) `maxQty: number` prop; replace module-level `MAX_QTY = 3` with prop-driven clamp; disable + when `qty >= maxQty` (and when `maxQty < 1`).
   - **Rationale:** Guest SSR passes `3`; members pass computed max.
   - **Alternatives:** Island fetches credits client-side (rejected; SSR-only data).

6. **`TicketCountSelect` dynamic options**
   - **Choice:** Accept `maxQty` (or `options: number[]`) prop; build HeroUI `Select` items `1..maxQty` (minimum one option when `maxQty >= 1`). `BookEventPage` already has `availableCredits` — also pass `remainingCapacity` (or precomputed `maxQty`) from the book route. Waitlist join reuses the same prop if it currently assumes 3.
   - **Rationale:** Hard rule — Select, no radios/checkboxes; shared island for book + waitlist.
   - **Alternatives:** Separate selects per surface (rejected).

7. **Tests**
   - **Choice:** Unit-test `maxBookableTickets` (guest 3; 17 credits / price 2 / capacity 10 → 8; capacity binds; creditPrice ≤ 0 → capacity; zero credits → 0). Update eligibility test so `assertValidTicketCount(4)` does **not** throw; add/adjust booking tests so qty 4 succeeds when credits/capacity allow (integration or existing book-event tests if present).
   - **Rationale:** Step verification explicitly requires qty = 4 when eligible.
   - **Alternatives:** Only manual QA (insufficient for domain change).

## Risks / Trade-offs

- **[Risk] Parent guide / archive already mark 04 done** → Mitigation: implement residual debt; flip parent guide to accurate state on merge.
- **[Risk] Product Gherkin still says 1–3 until 05** → Mitigation: implement against this delta; keep package tests green; leave feature-file sync to 05.
- **[Risk] Waitlist still calls `assertValidTicketCount`** → Mitigation: shape-only check allows qty > 3; pass dynamic `maxQty` into waitlist `TicketCountSelect` so UI cannot offer impossible options without redesigning waitlist.
- **[Risk] `maxQty === 0` UX awkward on detail** → Mitigation: disable +/− / primary as today for sold-out/unaffordable; do not invent new empty states beyond existing sold-out/membership messaging.
- **[Trade-off] UI max is UX-only** → Server still rejects over-capacity / under-credit; no trust of client max.
- **[Trade-off] Spec deltas vs `docs/product/` until 05** → Acceptable per step plan.

## Migration Plan

1. Add `maxBookableTickets` + unit tests; relax `assertValidTicketCount`; update booking/eligibility tests.
2. Thread `maxQty` through detail route → page → checkout island; clamp qty query.
3. Thread dynamic options through `TicketCountSelect` / book (and waitlist if shared).
4. `bun run lint` && `bun run typecheck` && package booking tests.
5. Manual/unit: guest max 3; member 17 / price 2 / capacity ≥ 8 → max 8.
6. Update parent guide step 04 honestly. Rollback = revert PR. No DB/env migration.

## Open Questions

- None blocking. If waitlist option wiring is noisy, ship detail + book + domain first and note waitlist touchpoint for 05 (per step plan).
