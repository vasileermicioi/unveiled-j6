## MODIFIED Requirements

### Requirement: Create a single event accepts dateTimes list

Creating an event SHALL require at least one datetime value supplied as a list (`dateTimes`). Admin create and edit SSR paths SHALL post the editable datetime list (not a single wrapped field) into `dateTimes` together with a parallel `occurrenceCreditPrices` list of equal length (one credit price per complete datetime row). The catalog SHALL persist sorted `date_times` with matching `occurrence_credit_prices`, set denormalized primary `date_time` to the next upcoming instant (or earliest if all past), set denormalized `credit_price` to that primary occurrence’s price, and compute `startTimeMinutes` and `weekday` from that primary datetime in Europe/Berlin. Duplicate instants SHALL be rejected (paired path). The admin form SHALL NOT post a separate event-level `credit_price` field that overrides row credits.

#### Scenario: Create a single event

- **WHEN** I create a new event with a title, partner, per-datetime credit prices, capacity, description, image, Berlin zip code, and one or more dateTimes
- **THEN** the event is added to the catalog
- **AND** its remaining capacity defaults to its total capacity
- **AND** its startTimeMinutes and weekday are computed from its primary/next dateTime

#### Scenario: Create with multiple dateTimes persists the list

- **WHEN** an admin create path (or catalog `createEvent`) supplies two or more dateTimes with matching credit prices
- **THEN** the stored event has `date_times` length equal to the unique sorted input count
- **AND** denormalized `date_time` matches the primary/next rule
- **AND** `occurrence_credit_prices` follow that datetime order

### Requirement: Editable list of event datetimes

Admin create, edit, and clone forms SHALL present event datetimes as an editable list. Each row SHALL include a date, a time (when timing mode is `TIME_SLOT`), and a credit price. The admin SHALL be able to add and remove rows inplace before submitting the SSR form. The system SHALL reject submit when zero complete datetime rows remain. The form SHALL display the sum of the listed credit prices. The form SHALL NOT show a separate event-level Credits field; `events.credit_price` is derived from the primary occurrence on write.

#### Scenario: Add and remove datetimes on create

- **WHEN** I am on the new-event form
- **AND** I add a second datetime row and remove one row
- **THEN** submitting persists exactly the remaining datetime values on the event

#### Scenario: Per-datetime credits persist

- **WHEN** I create an event with two datetime rows priced 1 and 3 credits
- **THEN** the stored `occurrence_credit_prices` are 1 and 3 in datetime order
- **AND** denormalized `credit_price` equals the primary/next slot’s price

#### Scenario: Total credits shown on the form

- **WHEN** the datetime list has rows priced 2 and 5
- **THEN** the form shows a total of 7 credits for the list

#### Scenario: Edit datetimes inplace

- **WHEN** I edit an event that already has multiple datetimes
- **THEN** I see all values as editable rows including each row’s credits
- **AND** I can add or remove rows and save

#### Scenario: Empty datetime list rejected on admin form

- **WHEN** an admin submits create or edit with no complete datetime rows
- **THEN** the form is re-rendered with an error
- **AND** no catalog write occurs

### Requirement: Admin clones an event

Admins SHALL clone an existing event via a dedicated SSR page `/:locale/admin/events/:id/clone` with form POST (no client-only modal). The form SHALL be prefilled from the source event (at least a source summary and an editable datetime list copied from the source, including each row’s credit price from `occurrence_credit_prices`) and SHALL require at least one datetime before confirm. The admin SHALL be able to add or remove datetime rows inplace before submit. Clone POST SHALL persist the submitted `dateTimes` together with `occurrenceCreditPrices` (not flatten to `source.creditPrice` when row credits are posted). Primary image upload SHALL NOT be required on clone (source image id is reused by the catalog clone operation). For `VOUCHER_PROMO` or `VOUCHER_PDF` source events, the clone form SHALL require new redemption inventory using create-mode semantics. On success, a new catalog event exists and the admin is redirected to a sensible admin events surface (edit of the new event or the events list). Entry points SHALL exist on the Events list and/or event edit page. The admin Events UI SHALL NOT offer series create.

#### Scenario: Clone event from catalog list

- **WHEN** an admin opens clone for an existing event
- **THEN** the datetime list is prefilled from the source event including each row’s credits
- **AND** when the admin edits the list if needed and confirms
- **THEN** a new event appears in the catalog with the copied title, the submitted dateTimes, and the submitted occurrence credit prices

#### Scenario: Clone voucher event requires inventory

- **WHEN** an admin clones a `VOUCHER_PROMO` or `VOUCHER_PDF` event without providing new inventory
- **THEN** the clone is rejected until inventory is provided

#### Scenario: Clone entry points visible

- **WHEN** an admin views the Events list or an event edit page
- **THEN** a Clone action linking to `/:locale/admin/events/:id/clone` is available
- **AND** no Event series create CTA is shown
