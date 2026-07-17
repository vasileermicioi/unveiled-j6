## ADDED Requirements

### Requirement: Detail page does not charge credits

The public event detail page SHALL NOT create bookings or ledger entries. Ticket quantity controls on detail, if shown, SHALL only influence navigation into the existing SSR booking or auth `returnTo` flow. Credit deduction for purchases SHALL continue to occur only through the Booking domain on the dedicated `/:locale/events/:id/book` SSR form POST (or equivalent booking-domain writers such as waitlist promotion / admin comp — not from detail).

#### Scenario: Guest quantity does not book

- **WHEN** a guest changes ticket quantity on event detail
- **THEN** no booking row is created
- **AND** continuing requires authentication before any credit charge

#### Scenario: Eligible member quantity only deep-links

- **WHEN** an eligible member adjusts ticket quantity on event detail and follows the primary book CTA
- **THEN** they navigate to `/:locale/events/:id/book` (optionally with a quantity query)
- **AND** no booking or ledger write occurs until the book page SSR POST succeeds
