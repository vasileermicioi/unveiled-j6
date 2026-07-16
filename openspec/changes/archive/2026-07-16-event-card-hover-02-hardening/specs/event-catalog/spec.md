## ADDED Requirements

### Requirement: EventCard hover documented in stories

`@unveiled/ui` EventCard Ladle stories SHALL include a state that demonstrates the hover/availability reveal (or an equivalent forced-visible strip) so theme reviews do not require a live browser hover. The product UI component map SHALL describe the EventCard hover contract as a flat border/outline emphasis with availability strip reveal, not a drop shadow.

#### Scenario: Story shows availability strip

- **WHEN** a developer opens the EventCard hover (or availability-visible) story
- **THEN** remaining capacity and ticket type are visible on the card media area

#### Scenario: Product map matches flat hover

- **WHEN** an implementer reads the EventCard entry in `docs/product/ui/ui-component-map.md`
- **THEN** the description states hover/focus reveals the availability strip and emphasizes the card with a flat border or outline, without prescribing a drop shadow
