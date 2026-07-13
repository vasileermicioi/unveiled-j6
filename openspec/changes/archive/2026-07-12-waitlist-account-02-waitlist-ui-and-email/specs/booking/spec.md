## MODIFIED Requirements

### Requirement: Sold-out without waitlist (Phase 6)
The Phase 6 requirement that sold-out bookings reject without a waitlist offer is superseded for Phase 7 member UX. The system SHALL still reject the booking transaction itself when remaining capacity is less than the requested ticket count (no booking row created). For authenticated eligible members, the system SHALL offer waitlist join instead of only showing a closed sold-out error with no member path.

#### Scenario: Sold out — automatic waitlist offer
- **WHEN** remaining capacity is less than the requested ticket count
- **THEN** the booking is not created and the member is offered waitlist join

#### Scenario: Insufficient capacity still rejects booking
- **WHEN** a book POST fails with sold-out / capacity error
- **THEN** no booking or credit ledger mutation occurs for that attempt
