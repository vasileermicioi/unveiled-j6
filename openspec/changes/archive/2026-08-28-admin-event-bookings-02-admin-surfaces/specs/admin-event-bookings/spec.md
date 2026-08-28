## Purpose

Gives admins a Bookings tab to inspect tickets per event and a dedicated SSR confirm flow to cancel every confirmed booking on that event, with credits and vouchers returned and the waitlist closed rather than promoted.

## ADDED Requirements

### Requirement: Admin Bookings tab
The system SHALL add an ADMIN chrome tab Buchungen / Bookings (after Events) at `/:locale/admin/bookings`. The index SHALL list events that have at least one booking or waitlist entry, with confirmed, used, cancelled, and waiting counts, via GET pagination and optional title/partner filters. Guests and USER members SHALL NOT access the tab.

#### Scenario: Admin opens the Bookings tab
- **WHEN** I am signed in as ADMIN and open the Bookings tab
- **THEN** I see events with booking and waitlist counts
- **AND** I can open an event's booking list

### Requirement: Per-event booking list
The system SHALL render `/:locale/admin/events/:id/bookings` as an ADMIN SSR list of that event's bookings (status filter + page). CONFIRMED rows SHALL offer the existing single-cancel page. When at least one CONFIRMED booking exists, the page SHALL offer Cancel all confirmed bookings linking to the confirm page. The Events catalog SHALL include a Bookings row action to this list.

#### Scenario: Admin views bookings for one event
- **WHEN** I open bookings for an event that has confirmed tickets
- **THEN** I see each booking's member, status, occurrence, tickets, and credits charged
- **AND** I can open single-booking cancel
- **AND** I see Cancel all confirmed bookings

#### Scenario: Empty event bookings
- **WHEN** I open bookings for an event with no bookings
- **THEN** I see the empty copy "No bookings for this event" / "Keine Buchungen für dieses Event"
- **AND** I do not see a working cancel-all submit

### Requirement: Cancel-all confirm is an SSR form
The system SHALL expose `/:locale/admin/events/:id/bookings/cancel-all` as a dedicated confirm page with form POST (no client-only modal, no localStorage draft). The page SHALL require a reason, summarize confirmed/comp/USED/waitlist counts, and state that credits and vouchers return, the waitlist is closed, and the event stays in the catalog. Successful POST SHALL run cancel-all, send post-commit emails, and redirect to the per-event list.

#### Scenario: Admin cancels all bookings from the confirm page
- **WHEN** I confirm cancel-all with a reason
- **THEN** I return to the event bookings list
- **AND** confirmed bookings show as cancelled
- **AND** I see success copy that credits and vouchers were returned

#### Scenario: Cancel-all confirm rejects an empty reason
- **WHEN** I submit cancel-all without a reason
- **THEN** no bookings change
- **AND** the confirm page shows an error
