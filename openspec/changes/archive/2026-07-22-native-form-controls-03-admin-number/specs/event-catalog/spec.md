## ADDED Requirements

### Requirement: Admin event numeric fields

Admin event create/edit forms SHALL use native HTML `<input type="number">` for credit price and total capacity (and any shared admin number primitive). HeroUI `NumberField` SHALL NOT be required for those fields. Bounds and SSR field names remain unchanged (`credit_price`, `total_capacity`). Native number inputs SHALL be associated with an accessible label and MAY be wrapped in HeroUI `Label` / `Surface` / `Field` chrome. Theme styling SHALL use shared admin native number classes from `globals.css` (e.g. `.admin-native-number`).

#### Scenario: Capacity is a native number input

- **WHEN** an admin opens Create Event
- **THEN** total capacity is a native number input with an accessible label and posts the existing field name on submit

#### Scenario: Credit price is a native number input

- **WHEN** an admin opens Create Event
- **THEN** credit price is a native number input with an accessible label and posts the existing field name (`credit_price`) on submit

#### Scenario: Numeric bounds and defaults unchanged

- **WHEN** an admin creates an event without overriding numeric fields
- **THEN** credit price defaults to at least 1 and total capacity defaults to 10 (matching existing product/parser defaults)
- **AND** client-side min constraints remain ≥ 1 for both fields
