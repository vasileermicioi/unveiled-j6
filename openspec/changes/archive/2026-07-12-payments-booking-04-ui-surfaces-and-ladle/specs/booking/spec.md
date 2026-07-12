## ADDED Requirements

### Requirement: My Tickets list
The system SHALL provide an authenticated, paginated SSR `/bookings` list of the member’s bookings ordered by most recent, with empty state and redemption-oriented ticket presentation. Page size SHALL be 20. Pagination SHALL use GET `?page=` with SSR links and SHALL work without client-only fetching. The list SHALL NOT offer member self-cancel or refund actions.

#### Scenario: Member views tickets
- **WHEN** a signed-in member with at least one booking visits `/bookings`
- **THEN** they see their tickets with redemption information affordances and can paginate via `?page=` without client-only fetching

#### Scenario: Empty tickets list
- **WHEN** a signed-in member has no bookings
- **THEN** they see an empty state on `/bookings`

#### Scenario: My Tickets is read-only for members
- **WHEN** a member views `/bookings`
- **THEN** no member-facing action exists to cancel a booking or request a refund

### Requirement: My Tickets navigation
The system SHALL expose a signed-in member navigation link labeled per locale inventory (`Meine Tickets` / `My Tickets`) that routes to `/:locale/bookings`.

#### Scenario: Member opens My Tickets from nav
- **WHEN** a signed-in USER uses the app shell navigation
- **THEN** a My Tickets link is available and navigates to their bookings list
