## Why

Steps 01–02 shipped multi-datetime storage and admin form editing, but consumer read surfaces still render a single `dateTime` (detail DETAILS, EventCard, admin tables, booking confirm / ICS / email). Product Gherkin, schema notes, and e2e also still under-document the multi-datetime + event-scoped booking model. This final step closes parent feature `event-multi-datetime`.

## What Changes

- Public/member event detail: list **all** datetimes (Europe/Berlin); booking-eligible date chrome emphasizes **next upcoming**; guests keep existing omit-date gating.
- Cards / feed / map previews: show next upcoming datetime (denormalized `dateTime` is already primary/next — verify and fix any mapper that still picks an arbitrary slot).
- Admin catalog / featured columns: primary/next datetime; optional simple `+N` when more than one datetime exists.
- Booking confirmation, ICS, and email: use next upcoming datetime; bookings remain **event-scoped** (no slot picker).
- Update canonical product docs (`admin-events`, `event-discovery`, schema overview, ui-component-map, gaps/decisions) plus OpenSpec deltas; add/adjust e2e (admin multi-datetime smoke + discovery still future-only).
- Sweep fixtures/stories and remaining single-`dateTime` assumptions in mappers.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-discovery`: Detail date chrome lists all datetimes for booking-eligible viewers (emphasize next upcoming); cards/map previews show next upcoming; product docs/e2e align.
- `booking`: Bookings stay event-scoped (no datetime slot selection); confirm / ICS / email use next upcoming datetime for calendar display.
- `admin-events`: Admin events/featured list columns show next upcoming (+ optional `+N` when multiple); e2e covers add/remove datetime smoke end-to-end with discovery future-only.

## Impact

- **UI:** `EventDetailPage` DETAILS / summary date chrome; `@unveiled/ui` `EventCard`; map marker preview copy; `AdminEventsTable` / `AdminFeaturedTable` (+ add-results rows as needed).
- **Booking / email:** `book/confirm` ICS (`buildEventIcs`), `BookingTicketCard`, `packages/email` booking-confirmation / waitlist promotion time fields.
- **Mappers:** `catalog-mappers.ts`, SEO `startDate`, any remaining single-slot assumptions.
- **Docs / BDD:** `docs/product/features/{event-discovery,admin-events,booking}.feature`, `schema-overview.md`, `ui-component-map.md`, `gaps-and-decisions.md`; Playwright under `e2e/`.
- **Fixtures:** Ladle stories / seed helpers that still assume one datetime shape for display.
- **Source brief:** `.dev-plan/current-iteration/03-event-multi-datetime-03-surfaces-and-hardening.md`
- **Parent:** `.dev-plan/current-iteration/03-event-multi-datetime-parent-guide.md`
- **Depends on:** `event-multi-datetime-02-admin-form-ui` (done)
- **Verification:** `bun run lint`; `bun run typecheck`; targeted admin + discovery e2e when env available
