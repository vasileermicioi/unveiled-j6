## MODIFIED Requirements

### Requirement: Discover Partner venues uses featured partners

Discover (`/:locale/discover`) SHALL render the Partner venues logo marquee from admin-curated `featured_partners` (ordered by `sort_order`, display up to 8), not from an automatic slice of all partners. When the curated list is empty, the Partner venues section SHALL be omitted. Featured events behavior on Discover is unchanged.

#### Scenario: Guest sees curated partner venues

- **GIVEN** at least one partner is admin-featured and at least one other partner is not
- **WHEN** a guest visits Discover
- **THEN** the featured partner appears in Partner venues
- **AND** the non-featured partner does not appear solely for being in the catalog

#### Scenario: Empty featured partners hides section

- **GIVEN** no featured partners exist
- **WHEN** a guest visits Discover
- **THEN** the Partner venues section is not shown
