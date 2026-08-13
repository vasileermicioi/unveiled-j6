## ADDED Requirements

### Requirement: Date-range occurrence builder
Admin create, edit, and clone event forms SHALL offer a range builder: an inclusive start date, an inclusive end date, and one or more time slots each with a clock time and a credit price. The occurrence list SHALL be the cartesian product of each Europe/Berlin calendar date in that range and each time slot. Changing start date, end date, or any time-slot row SHALL replace the occurrence list from scratch (manual add/remove of list rows is discarded). The system SHALL reject a generated list that is empty or that exceeds 52 occurrences. Submit SHALL persist the generated (or subsequently edited) list via the existing SSR form POST. When timing mode is `ALL_DAY`, the builder SHALL still expand dates but SHALL emit one row per date at Europe/Berlin midnight using the first time slot’s credit price (time-of-day on additional slots is ignored). The builder SHALL live on create/edit/clone event forms; the system SHALL NOT revive `/admin/events/series/new`.

#### Scenario: Range and two time slots generate a grid
- **WHEN** I set start 2026-09-01, end 2026-09-03, and time slots 10:00 at 1 credit and 18:00 at 3 credits
- **THEN** the datetime list has six rows (each date × each time)
- **AND** morning rows are priced 1 and evening rows are priced 3

#### Scenario: Changing the end date rebuilds from scratch
- **WHEN** a generated list exists and I have manually added an extra row
- **AND** I change the builder end date
- **THEN** the list is replaced by a fresh expansion
- **AND** the manually added row is gone

#### Scenario: Over-cap range is rejected
- **WHEN** start, end, and time slots would produce more than 52 occurrences
- **THEN** the form shows an error
- **AND** no catalog write occurs on submit

#### Scenario: Empty generated list rejected on submit
- **WHEN** the rebuilt datetime list has zero complete rows (including start after end, or every date skipped)
- **THEN** the form is re-rendered with an error
- **AND** no catalog write occurs

#### Scenario: ALL_DAY expands one row per date
- **WHEN** timing mode is `ALL_DAY` and I generate 2026-09-01 through 2026-09-02 with slots 10:00 at 1 credit and 18:00 at 3 credits
- **THEN** the datetime list has two rows (one per date at Berlin midnight)
- **AND** each row is priced 1 (first slot’s credits)

### Requirement: Partner opening hours default time slots
On the **create** event form, when the admin selects a partner with `has_opening_hours` true and a valid week, the builder’s default time-slot rows SHALL be the distinct `open` times from open weekdays, sorted. Range expansion SHALL skip dates whose Berlin weekday is marked closed on that partner. When the partner has no published hours, the default time slot SHALL be 19:30 at 1 credit and every calendar day in range SHALL be included. On **edit**, changing partner SHALL NOT overwrite existing datetimes or builder fields.

#### Scenario: Create prefills slots from partner open times
- **WHEN** I am on the new-event form and select a partner open 10:00–18:00 weekdays and closed Sunday
- **THEN** the builder shows a 10:00 time slot by default

#### Scenario: Closed weekdays omitted from expansion
- **WHEN** that partner is selected and I generate 2026-09-05 (Saturday) through 2026-09-07 (Monday) with the default 10:00 slot
- **THEN** Sunday is not in the datetime list
- **AND** Saturday and Monday are

#### Scenario: No published hours includes every calendar day
- **WHEN** I select a partner with `has_opening_hours` false and generate 2026-09-05 through 2026-09-07 with the default 19:30 slot
- **THEN** the datetime list includes Saturday, Sunday, and Monday

#### Scenario: Edit partner change does not overwrite datetimes
- **WHEN** I edit an event that already has datetime rows and builder fields
- **AND** I change the partner
- **THEN** the datetime list and builder fields are unchanged

## MODIFIED Requirements

### Requirement: Product docs describe clone not series
`docs/product/features/admin-events.feature`, `docs/product/sitemap/sitemap.md`, and `docs/product/ui/ui-component-map.md` SHALL document `/admin/events/:id/clone` (ADMIN clone flow) and SHALL NOT document `/admin/events/series/new` as a current MVP route. An inline date-range builder on create, edit, and clone event forms is allowed (not a separate series surface). Feature scenarios SHALL include clone acceptance coverage (happy path and entry points; voucher inventory reject when practical) and SHALL NOT require series-create scenarios. Canonical Gherkin for the inline builder MAY wait for the parent feature’s hardening step.

#### Scenario: Feature file documents clone
- **WHEN** a reader opens `docs/product/features/admin-events.feature`
- **THEN** it includes clone acceptance scenarios
- **AND** it has no required series-create scenarios (no `/admin/events/series/new`)

#### Scenario: Sitemap lists clone not series
- **WHEN** a reader opens `docs/product/sitemap/sitemap.md`
- **THEN** it lists `/admin/events/:id/clone` for ADMIN
- **AND** it does not list `/admin/events/series/new` as a current MVP route

#### Scenario: UI component map describes clone
- **WHEN** a reader opens the Events row in `docs/product/ui/ui-component-map.md`
- **THEN** admin events document SSR CRUD and clone
- **AND** they do not describe series create as a current surface
