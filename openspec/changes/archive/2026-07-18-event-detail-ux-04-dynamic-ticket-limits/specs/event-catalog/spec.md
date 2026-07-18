## ADDED Requirements

### Requirement: Detail checkout quantity affordance
The public event detail summary card ticket quantity control SHALL use guest max 3 and signed-in max derived from session credits and event remaining capacity (see booking ticket-count bounds). Quantity on detail remains navigation state only (`qty` query) and SHALL NOT create bookings or ledger entries.

#### Scenario: Eligible member sees credit-aware max on detail
- **WHEN** an eligible member opens event detail with enough credits for more than 3 tickets and sufficient capacity
- **THEN** the quantity control can increase beyond 3 up to that computed max

#### Scenario: Guest detail qty stays at three
- **WHEN** a guest opens the same bookable event detail page
- **THEN** the quantity control does not offer a value above 3
