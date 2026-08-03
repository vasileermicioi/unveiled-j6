## Context

Parent feature `event-multi-datetime`, step 03 (final) — consumer surfaces + hardening after schema/domain (01) and admin form UI (02).

Current state:

- Catalog stores non-empty `date_times` + denormalized primary/next `date_time`; create/update/clone and admin forms already post `dateTimes: Date[]`.
- Discovery upcoming/sort already uses any-future / next-upcoming rules in `@unveiled/db`.
- Read UIs still format a single `event.dateTime`: `EventDetailPage` DETAILS MetaCell, `@unveiled/ui` `EventCard`, admin events/featured tables, book/confirm ICS (`buildEventIcs`), booking ticket card, booking-confirmation email.
- Map popups (`EventMap` island) currently show title/partner/address only — no datetime chrome yet.
- Product Gherkin / ui-component-map / gaps still under-describe multi-datetime display and event-scoped booking.

Constraints: HeroUI-only detail chrome; SSR-only mutations (no new mutation modals); Europe/Berlin formatting; proximity Playwright selectors; theme-owned visuals; guests/non–booking-eligible continue to omit date/credit chrome (existing discovery gating — do not reopen).

## Goals / Non-Goals

**Goals:**

- Detail: booking-eligible viewers see **all** datetimes listed; next upcoming emphasized in summary/DETAILS date presentation.
- Cards / feed / map previews: show **next upcoming** datetime (not an arbitrary past slot).
- Admin list/featured: primary/next + optional simple `+N` when `dateTimes.length > 1`.
- Booking confirm / ICS / email: next upcoming for calendar/time fields; booking stays event-scoped (no slot picker).
- Align product SoT + OpenSpec deltas + e2e/fixtures; mark parent guide step 03 done.

**Non-Goals:**

- Per-slot booking, capacity, or waitlist windows.
- Recurrence / RRULE builders.
- Partner portal.
- Changing guest date-gating (guests still omit date chrome).
- Dropping denormalized `date_time` or redesigning indexes.

## Decisions

1. **Display source of truth: `dateTimes` for lists; denormalized `dateTime` for “next”**
   - **Choice:** Pass full `dateTimes` into detail (and any surface that lists all). Compact surfaces (EventCard, map popup, admin table primary cell, ICS/email) use denormalized `dateTime` (already synced to next upcoming / earliest-if-all-past on write). Do not recompute “next” in the UI beyond formatting unless a stale mapper is found.
   - **Rationale:** Matches step 01 denormalization; avoids divergent client clocks.
   - **Alternatives:** Recompute next from `dateTimes` at render (rejected unless a bug proves denormalized drift).

2. **Detail chrome: list all; emphasize next**
   - **Choice:** Booking-eligible DETAILS (and summary date chrome if present) render every datetime in Europe/Berlin order; visually emphasize the next upcoming (primary label / first highlighted row). Guests and non–eligible viewers keep omitting date chrome entirely (existing requirement).
   - **Rationale:** Step-plan outcome + parent “list all on detail”; preserve credit/date gating.
   - **Alternatives:** Show dates to guests (rejected — conflicts with shipped gating); show only next on detail (rejected — step plan requires full list).

3. **Admin `+N` affordance stays minimal**
   - **Choice:** Date column shows `formatEventDateTime(dateTime)` plus optional text like `+2` when `dateTimes.length > 1` (`length - 1`). No tooltip island required for MVP; skip if copy/layout friction is high — primary datetime alone is acceptable minimum, prefer `+N` when cheap.
   - **Rationale:** Step plan: “keep simple.”
   - **Alternatives:** Full list in table cell (noisy); hover tooltip island (unnecessary).

4. **Map popup: add next-upcoming line**
   - **Choice:** Extend marker payload + popup DOM with formatted next upcoming datetime (same locale formatter as cards). Still link to public detail; no booking from popup.
   - **Rationale:** Step plan explicitly includes map popups.
   - **Alternatives:** Leave map without time (incomplete vs step plan).

5. **Booking / ICS / email: next upcoming only**
   - **Choice:** Confirm page, `buildEventIcs`, booking confirmation email, and ticket card continue to take a single instant = event’s denormalized `dateTime`. Document in `gaps-and-decisions.md`: MVP booking is event-scoped; calendar artifacts use next upcoming.
   - **Rationale:** Locked parent decision; no slot picker.
   - **Alternatives:** Multi-VEVENT ICS (deferred); force member to pick a slot (out of scope).

6. **Canonical docs live in `docs/product/`; OpenSpec deltas mirror behavior**
   - **Choice:** Update feature files, schema overview (already partially updated), ui-component-map, gaps. OpenSpec capability deltas for `event-discovery`, `booking`, `admin-events` so archive sync stays coherent. AGENTS.md product SoT remains `docs/product/`.
   - **Rationale:** Project convention + openspec archive workflow.

7. **E2E scope**
   - **Choice:** Admin smoke: create/edit with ≥2 datetimes (add/remove), assert persisted list on edit re-open or detail. Discovery: feed still excludes fully past multi-datetime events; optionally assert card shows next upcoming when fixture has past+future. Proximity selectors only.
   - **Rationale:** Parent release criteria + step verification.

## Risks / Trade-offs

- **[Risk] Step-plan scenario says “guest or member” sees datetimes** → Mitigation: interpret under “Booking-eligible member sees date” heading; keep guest omit-date; document in gaps if wording conflict appears.
- **[Risk] EventCard type only has `dateTime`** → Mitigation: keep single field for cards; ensure mappers pass denormalized next; multi-list only on detail.
- **[Risk] SEO JSON-LD `startDate` is single** → Mitigation: keep next upcoming `dateTime` (acceptable for MVP); note in gaps if multi-occurrence SEO becomes a follow-up.
- **[Risk] Waitlist / check-in windows still keyed off primary** → Mitigation: out of scope to change; already parent-accepted.
- **[Trade-off] Admin `+N` without full list** → Accepted for table density.

## Migration Plan

1. Wire detail / card / admin / map / booking-email display helpers.
2. Update product docs + OpenSpec deltas + fixtures/stories.
3. Add/adjust Playwright; run lint + typecheck (+ e2e when env available).
4. Mark step 03 done in parent guide.
5. Rollback: revert UI/docs PR; data model unchanged.

## Open Questions

- None blocking — event-scoped booking + next-upcoming calendar display locked by parent guide. Slot-level booking is an explicit follow-up parent feature if product asks later.
