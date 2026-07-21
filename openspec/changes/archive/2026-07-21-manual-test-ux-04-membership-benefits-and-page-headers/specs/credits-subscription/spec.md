## ADDED Requirements

### Requirement: Membership marketing benefits presentation
The membership page SHALL present plan benefits as a vertical list. Each benefit SHALL include a distinct icon bullet and localized text. Horizontal three-up perk cards SHALL NOT be the default presentation.

#### Scenario: Vertical icon benefits on membership
- **WHEN** a user views `/:locale/membership`
- **THEN** benefits appear stacked vertically with icons
- **AND** each benefit remains readable in DE and EN

#### Scenario: Same presentation after subscribe
- **WHEN** an `ACTIVE` member views `/:locale/membership`
- **THEN** the benefits list remains a vertical icon-bullet stack (not a three-column perk card strip)
