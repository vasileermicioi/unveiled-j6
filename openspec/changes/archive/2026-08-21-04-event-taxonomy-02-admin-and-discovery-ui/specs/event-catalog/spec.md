## ADDED Requirements

### Requirement: Category and type display use locale labels

Public and member surfaces SHALL NOT show raw taxonomy keys. EventCard category chip and public detail category eyebrow SHALL show the locale label for the stored category key (`cinema` → German “Kino”, English “Cinema”). Public detail DETAILS type SHALL show the locale label for the stored event-type key. Admin category and event-type selects SHALL show the same labels as option text (option values remain the keys). Unknown stored values MAY fall back to the raw string rather than failing the page.

#### Scenario: German detail shows Kino for cinema

- **WHEN** a guest opens `/de/events/:id` for an event with `category = "cinema"`
- **THEN** the category eyebrow is "Kino"

#### Scenario: English detail shows Cinema for cinema

- **WHEN** a guest opens `/en/events/:id` for an event with `category = "cinema"`
- **THEN** the category eyebrow is "Cinema"

#### Scenario: EventCard chip shows the locale label

- **WHEN** a member views an EventCard for an event with `category = "cinema"` on `/de/events` (or Discover / saved)
- **THEN** the category chip text is "Kino"
- **AND** the chip does not show `cinema`

#### Scenario: German detail type uses the locale label

- **WHEN** a guest opens `/de/events/:id` for an event with `event_type = "theater_play"`
- **THEN** the DETAILS type value is the German type label (not `theater_play`)

#### Scenario: Admin selects show locale labels

- **WHEN** an admin opens create or edit event on General
- **THEN** category and event-type options display locale labels
- **AND** submitted values are the taxonomy keys
