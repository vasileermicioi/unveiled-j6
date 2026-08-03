## ADDED Requirements

### Requirement: Create a single event accepts dateTimes list

Creating an event SHALL require at least one datetime value supplied as a list (`dateTimes`). The catalog SHALL persist sorted unique `date_times`, set denormalized primary `date_time` to the next upcoming instant (or earliest if all past), and compute `startTimeMinutes` and `weekday` from that primary datetime in Europe/Berlin. Until the admin multi-datetime form ships, the create SSR path MAY wrap a single posted datetime into a one-element list.

#### Scenario: Create a single event

- **WHEN** I create a new event with a title, partner, credit price, capacity, description, image, Berlin zip code, and one or more dateTimes
- **THEN** the event is added to the catalog
- **AND** its remaining capacity defaults to its total capacity
- **AND** its startTimeMinutes and weekday are computed from its primary/next dateTime

#### Scenario: Create with multiple dateTimes persists the list

- **WHEN** an admin create path (or catalog `createEvent`) supplies two or more dateTimes
- **THEN** the stored event has `date_times` length equal to the unique sorted input count
- **AND** denormalized `date_time` matches the primary/next rule
