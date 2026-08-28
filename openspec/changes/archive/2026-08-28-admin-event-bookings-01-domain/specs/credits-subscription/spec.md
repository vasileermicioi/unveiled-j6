## ADDED Requirements

### Requirement: Credit refunds
The system SHALL record REFUND ledger entries for (1) the existing admin manual goodwill refund and (2) event-level cancel-all, where the refunded amount equals each cancelled booking's total_credits when that amount is greater than 0. Single-booking admin cancel SHALL still NOT write a REFUND. Manual refunds remain available as a separate support gesture.

#### Scenario: Event cancel-all writes REFUND ledger rows
- **WHEN** an admin cancels all confirmed bookings for an event
- **THEN** each member who was charged credits receives that amount back
- **AND** a REFUND ledger entry is recorded per refunded booking with a unique idempotency key
