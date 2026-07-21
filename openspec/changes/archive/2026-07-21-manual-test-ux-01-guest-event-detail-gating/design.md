## Context

Public `/:locale/events/:id` already resolves an SSR `EventDetailViewer` (`guest` | `eligible` | `membership_required` | `past_due`) from session + `isBookingEligibleStatus` (`ACTIVE` | `CANCELLED_PENDING`). Checkout CTAs and notices already branch on that viewer. Credit totals still always render in `EventDetailCheckoutCard` whenever `showTicketControls` is true, and DETAILS always renders a calendar MetaCell with `formatEventDateTime`. Discover `EventCard` already hides date/credits for non-subscribed viewers; detail does not. Manual-test UX step 01 closes that gap. Product SoT: `.dev-plan/current-iteration/manual-test-ux-01-guest-event-detail-gating.md`; parent default = gate unless booking-eligible.

## Goals / Non-Goals

**Goals:**

- Guests and non–booking-eligible signed-in viewers do not see credit price/total or event date/time chrome on public detail.
- Booking-eligible members (`viewer.kind === "eligible"`) still see both for booking decisions.
- Visibility is decided on the server from existing `viewer` (or an equivalent boolean derived once in the route/page) — not a client-only CSS/JS hide.
- Guest unlock CTA, identity content, venue/address, hero, qty navigation affordance (when shown), and SEO (OG + JSON-LD including `startDate`) remain.
- Product feature + e2e guest detail assertions that currently require credits/date are updated in this step (or clearly noted for 05 if deferred — prefer update here because the scenario already asserts them).

**Non-Goals:**

- Booking transaction, book route, Stripe, waitlist domain changes.
- Map popup close control (step 05).
- Auth form width (step 02); native forms / preference i18n (step 03); membership benefits / page headers (step 04).
- Changing EventCard gating rules (already aligned in spirit).
- Hiding JSON-LD `startDate` or other crawl metadata.

## Decisions

1. **Eligibility predicate = existing `viewer.kind === "eligible"`**
   - **Choice:** Show credits and date/time only when `viewer.kind === "eligible"` (route already maps `isBookingEligibleStatus`). Guests, `membership_required` (INACTIVE etc.), and `past_due` get the gated view.
   - **Rationale:** Matches parent-guide default and booking gate; avoids inventing a second eligibility helper on the detail page.
   - **Alternatives:** Gate only literal guests (rejected — INACTIVE pre-subscribe would still see member chrome); use “any signed-in user” (rejected — contradicts parent open question default).

2. **Single boolean prop for member chrome**
   - **Choice:** Derive `showMemberBookingChrome = viewer.kind === "eligible"` in `EventDetailPage` (or pass from the route). Pass into checkout card as e.g. `showCreditTotal` / `showPricing`, and conditionally render the DETAILS calendar MetaCell.
   - **Rationale:** One named concept; island stays dumb; SSR owns the decision.
   - **Alternatives:** Pass full `viewer` into the island (unnecessary); hide via CSS class on body (fragile, still in HTML for guests).

3. **Credit surface = total row (and any unit-price display), not the whole checkout card**
   - **Choice:** Keep guest qty controls + unlock CTA when `showTicketControls` is true; omit the Total / `N CREDITS` row (and do not pass a visible unit price) when `showMemberBookingChrome` is false. Eligible (and only eligible) keep today’s total row.
   - **Rationale:** Step asks to hide credit price, not the unlock path or qty-as-`returnTo` navigation state.
   - **Alternatives:** Force `showTicketControls={false}` for non-eligible (rejected — removes qty preview and guest e2e qty-cap coverage without necessity).

4. **Date surface = DETAILS calendar MetaCell only**
   - **Choice:** Do not render the `when` / calendar MetaCell for non-eligible viewers. Other DETAILS fields (accessibility, languages, age groups, type, neighborhood) stay. Location address above the fold stays.
   - **Rationale:** That MetaCell is the visible date/time chrome; no other date chip remains on the page after prior Event Detail UX work.
   - **Alternatives:** Show date with blurred/placeholder copy (rejected — still leaks schedule shape); move date into checkout card for eligible only (out of scope redesign).

5. **SEO / JSON-LD unchanged**
   - **Choice:** Keep `schema.org/Event` `startDate` and OG tags for crawlers even when UI hides date.
   - **Rationale:** Public indexability is a hard product rule; gating is UX for human chrome, not a robots strip.
   - **Alternatives:** Strip `startDate` for guests (rejected — harms SEO and contradicts public detail).

6. **Docs + e2e in this step**
   - **Choice:** Update `docs/product/features/event-discovery.feature` guest scenario (remove “summary card shows total credits”; add omit credits/date). Update `e2e/specs/event-discovery.spec.ts` guest detail test that currently asserts `Gesamt|Total` and `Datum|Date` — invert those assertions (absent for guest) while keeping heading, unlock CTA, DETAILS presence, and qty cap.
   - **Rationale:** Assertions already exist and would fail; step verification allows targeted Playwright update.
   - **Alternatives:** Defer e2e to step 05 (risks red CI as soon as UI ships).

## Risks / Trade-offs

- **[Risk] Guest qty without visible credit total feels incomplete** → Mitigation: keep membership notice + unlock CTA; eligible path still shows total. Acceptable per step scope.
- **[Risk] `past_due` / `membership_required` users lose date while diagnosing why they cannot book** → Mitigation: parent default; membership CTA remains; reopen only if product asks.
- **[Risk] JSON-LD still exposes `startDate` while UI hides it** → Mitigation: intentional; document in design/tasks; not a bug.
- **[Trade-off] EventCard wording says “active subscription” while detail uses booking-eligible (`CANCELLED_PENDING` included)** → Accept; align detail with booking helper, not stricter “ACTIVE only.”
- **[Trade-off] openspec/specs are historical** → Still write deltas here; product SoT update is `docs/product/features/event-discovery.feature`.

## Migration Plan

1. Add `showMemberBookingChrome` (or equivalent) wiring in `EventDetailPage` + checkout card props.
2. Conditionally render credit total row and DETAILS date MetaCell.
3. Update guest/eligible Ladle story expectations if they screenshot credits/date.
4. Update Gherkin + Playwright guest detail assertions.
5. `bun run lint` && `bun run typecheck`; manual guest vs eligible on same event id.
6. Mark step 01 done in parent guide on merge. No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. Parent open question on INACTIVE vs member chrome is resolved by default: gate unless `eligible`.
