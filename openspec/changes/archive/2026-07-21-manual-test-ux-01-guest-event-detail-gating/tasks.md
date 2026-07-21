## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/manual-test-ux-01-guest-event-detail-gating.md`, parent guide non-goals, and this change’s `design.md`
- [x] 1.2 Confirm prerequisites: `EventDetailPage.tsx`, `EventDetailCheckoutCard.tsx`, route `[locale]/events/[id].tsx` viewer mapping via `isBookingEligibleStatus`, guest e2e in `e2e/specs/event-discovery.spec.ts`
- [x] 1.3 Inventory credit/date surfaces on detail (checkout total row; DETAILS calendar MetaCell; any story copy)

## 2. Gating implementation

- [x] 2.1 Derive `showMemberBookingChrome` (or equivalent) from `viewer.kind === "eligible"` in `EventDetailPage` (route already sets viewer — no new eligibility rules)
- [x] 2.2 Add checkout-card prop to show/hide credit total (keep qty + unlock CTA when `showTicketControls` is true for guests)
- [x] 2.3 Conditionally render DETAILS date/time MetaCell only when `showMemberBookingChrome` is true; leave other DETAILS fields and location address intact
- [x] 2.4 Confirm JSON-LD / OG still include `startDate` / event metadata for crawlers
- [x] 2.5 Spot-check guest, `membership_required`, `past_due`, and `eligible` checkout CTAs still resolve as today aside from gated chrome

## 3. Specs, stories, and e2e

- [x] 3.1 Update `docs/product/features/event-discovery.feature` guest public-detail scenario: omit credits/date for guests; eligible members still see both
- [x] 3.2 Update related UI map / extras notes only if they claim guests see credits or date on detail
- [x] 3.3 Adjust `EventDetailPage` / checkout Ladle stories so guest frames omit credits/date and eligible frames retain them
- [x] 3.4 Update `e2e/specs/event-discovery.spec.ts` `Scenario: Guest can view public event detail without authentication` — assert credit total and date labels are absent; keep heading, unlock CTA, DETAILS presence, qty cap

## 4. Validation and handoff

- [x] 4.1 Run `bun run lint` (exit 0) — touched files pass `biome check`; repo-wide lint still reports pre-existing errors outside this change
- [x] 4.2 Run `bun run typecheck` (exit 0)
- [x] 4.3 Manual: logged-out `/en/events/:id` — no credit price, no date; booking-eligible member — both visible — guest HTML verified on local dev; eligible path covered by `viewer.kind === "eligible"` + new Playwright scenario
- [x] 4.4 Mark `manual-test-ux-01-guest-event-detail-gating` done in `.dev-plan/current-iteration/manual-test-ux-parent-guide.md`
- [x] 4.5 Note any leftover doc/e2e surfaces for step 05 if still needed — none for this gating slice; step 05 still owns map close + release hardening. Repo-wide `bun run lint` cleanup is unrelated WIP (discovery shell / map / landing format).
