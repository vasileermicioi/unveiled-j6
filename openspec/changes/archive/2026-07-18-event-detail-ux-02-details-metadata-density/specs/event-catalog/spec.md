## ADDED Requirements

### Requirement: Public event detail below-fold metadata

The public event detail page SHALL present below-the-fold DETAILS metadata in a dense, scannable layout that uses horizontal space on medium and large viewports (multi-column label/value grid), rather than a single sparse vertical list inside a wide empty card. LOCATION SHALL show the address and embedded map with chrome that does not leave large unused bands beside the map content. Visual language SHALL remain consistent with Discover EventCard density (uppercase labels, clear hierarchy) while staying on the event-detail surface.

#### Scenario: DETAILS uses horizontal space on large viewport

- **WHEN** a user views an event detail page with multiple metadata fields on a large viewport
- **THEN** DETAILS fields appear in a multi-column grid
- **AND** large empty horizontal regions inside the DETAILS card are avoided

#### Scenario: LOCATION shows address and full-width map

- **WHEN** the event has coordinates
- **THEN** the LOCATION block shows the address and a map that spans the content width of its card
