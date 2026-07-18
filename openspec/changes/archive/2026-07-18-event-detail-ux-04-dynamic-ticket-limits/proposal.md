## Why

Ticket quantity is hard-capped at 3 in the detail checkout card, book-page select, and `assertValidTicketCount`, even when a member has enough credits and the event has remaining capacity. Guests can keep a simple 1–3 preview; signed-in members need a credit- and capacity-aware max so the UI matches what the booking transaction already enforces for credits and capacity.

## What Changes

- Add a pure helper (e.g. `maxBookableTickets`) for guest vs signed-in max qty rules.
- Pass computed `maxQty` into `EventDetailCheckoutCard` (+/− clamp) and dynamic options into `TicketCountSelect` / `BookEventPage`.
- Relax `assertValidTicketCount` to integer ≥ 1 only (no hard upper bound of 3); capacity and credits remain authoritative in `book-event`.
- Wire event detail route/page with session credits + remaining capacity so signed-in viewers get the dynamic max; clamp `qty` query / defaults to that max.
- Unit tests for the helper and booking/eligibility cases with `ticketsCount > 3` when eligible.
- Align waitlist `requestedQty` with the same helper if it still assumes 3 (no waitlist UX redesign).

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `booking`: Ticket count selection bounds — guests 1–3 preview; signed-in max = `min(floor(credits / creditPrice), remainingCapacity)` (creditPrice ≤ 0 → capacity-only); booking accepts any integer ≥ 1 that passes capacity and credit checks (no reject solely for count > 3).
- `event-catalog`: Detail checkout quantity affordance — guest max 3; signed-in max from session credits + remaining capacity; qty remains `qty` query navigation state only.

## Impact

- **Domain:** `packages/db/src/booking/eligibility.ts` (`assertValidTicketCount`); new helper (prefer `@unveiled/db` booking helpers); `book-event` / waitlist call sites; unit tests.
- **UI islands:** `EventDetailCheckoutCard.tsx`, `TicketCountSelect.tsx`.
- **Pages/routes:** `EventDetailPage.tsx`, `[locale]/events/[id].tsx`, `BookEventPage.tsx` (and waitlist join if shared select).
- **Unchanged:** Layout/map (01–03); full product Gherkin / Playwright rewrites (05); credit refill amounts; subscription gates; admin comp-ticket qty rules unless they import the helper.
- **Depends on:** `event-detail-ux-01-hero-checkout-layout` (checkout card props surface); preferably after 03 for full-page QA.
- **Consumed by:** `event-detail-ux-05-hardening`.
- **Source brief:** `.dev-plan/current-iteration/event-detail-ux-04-dynamic-ticket-limits.md`.
- **Verification:** `bun run lint`, `bun run typecheck`, package booking/eligibility tests (include qty = 4 when credits/capacity allow); guest max 3; member 17 credits / price 2 / capacity ≥ 8 → max 8.
- **Note:** Parent guide currently marks step 04 done and an incomplete archive exists, but hard `MAX_QTY = 3` / `ticketsCount > 3` remain in code — treat as residual debt and mark the parent guide honestly after merge.
