## ADDED Requirements

### Requirement: Booking quantity uses native select
Book and waitlist ticket-quantity fields SHALL use a native HTML `<select>` (or native number input) bound to the SSR form field name, not a HeroUI Select that depends on client hydration for visibility. Quantity bounds and booking-domain validation remain unchanged.

#### Scenario: Book page ticket count is a native select
- **WHEN** a booking-eligible member opens `/:locale/events/:id/book`
- **THEN** the ticket quantity control is a native `<select>` (or native number input) with a visible label
- **AND** submitting the form posts the selected quantity under the existing field name

#### Scenario: Waitlist join quantity matches book pattern
- **WHEN** a member opens the waitlist join form that collects ticket quantity
- **THEN** the quantity control uses the same native select/input pattern as the book form
