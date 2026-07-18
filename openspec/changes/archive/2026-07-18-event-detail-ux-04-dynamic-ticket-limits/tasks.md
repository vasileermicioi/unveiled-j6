## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/event-detail-ux-04-dynamic-ticket-limits.md` and this change’s proposal/design/specs
- [x] 1.2 Confirm `bookEvent` already enforces capacity + credits after ticket-count validation
- [x] 1.3 Grep and list all hard `3` ticket caps (`MAX_QTY`, `ticketsCount > 3`, `TICKET_OPTIONS`)

## 2. Domain helper & eligibility

- [x] 2.1 Implement `maxBookableTickets` in `@unveiled/db` booking module (guest → 3; signed-in → credits ∩ capacity; `creditPrice <= 0` → capacity-only) and export it
- [x] 2.2 Add unit tests for the helper (include 17 credits / price 2 / capacity ≥ 8 → max 8; guest → 3; zero credits → 0)
- [x] 2.3 Relax `assertValidTicketCount` to integer ≥ 1 only (remove hard upper bound of 3); update error message
- [x] 2.4 Update eligibility/booking tests so `ticketsCount = 4` is allowed by shape check and succeeds when credits/capacity allow

## 3. Detail checkout wiring

- [x] 3.1 Load session user credits in `[locale]/events/[id].tsx`; compute `maxQty` via helper; clamp `defaultQty` / `qty` query
- [x] 3.2 Thread `maxQty` through `EventDetailPage` into `EventDetailCheckoutCard`
- [x] 3.3 Replace island `MAX_QTY = 3` with prop-driven clamp; disable + at max (and when max is below 1)

## 4. Book (and waitlist) select wiring

- [x] 4.1 Extend `TicketCountSelect` to accept `maxQty` (or options list) and render HeroUI Select items `1..maxQty`
- [x] 4.2 Wire `BookEventPage` / book route with credits + remaining capacity (or precomputed `maxQty`); clamp default qty
- [x] 4.3 Align waitlist join `TicketCountSelect` with the same max helper if it still assumes 3 (no UX redesign); note deferral for 05 if skipped

## 5. Verification & handoff

- [x] 5.1 Run `bun run lint` (exit 0)
- [x] 5.2 Run `bun run typecheck` (exit 0)
- [x] 5.3 Run package booking/eligibility (and helper) tests — exit 0; include qty = 4 when eligible
- [x] 5.4 Confirm guest max 3 and member 17 / price 2 / capacity ≥ 8 → max 8 (unit or manual)
- [x] 5.5 Mark step 04 accurately in `.dev-plan/current-iteration/event-detail-ux-parent-guide.md` after merge (correct premature “done”)
- [x] 5.6 Leave Gherkin / `docs/product` sync for step 05; prepare PR/handoff linking this change id and parent guide
