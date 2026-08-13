## ADDED Requirements

### Requirement: Admin events feature documents occurrence credits
`docs/product/features/admin-events.feature` SHALL include scenarios for add/remove datetime rows with per-row credits, the list total, range generation from start/end plus time slots, rebuild-from-scratch, partner opening-hours default slots on create, and closed-day skip. The create scenario SHALL say “one or more dateTimes” and credits per datetime (not a single event-level credit price). Playwright titles in `e2e/specs/admin-events.spec.ts` SHALL match those Scenario lines verbatim. Native datetime and credit controls SHALL be asserted with `getByLabel` (and `nth` / layout filters when several “Credits” labels exist). The parked skip `ALLOW_MULTI_DATETIME_UI=false` SHALL NOT remain on `Scenario: Add and remove datetimes on create`. Environment skips (`E2E_ADMIN_*`, R2) MAY remain as named `test.skip` reasons. The system SHALL NOT add `data-testid` for these scenarios.

#### Scenario: Coverage traces admin occurrence-credit scenarios
- **WHEN** the coverage matrix is updated for this feature
- **THEN** it includes rows for the new admin-events scenarios (pass or explicit environment skip)
- **AND** none of those rows use `@skip-no-ui` as the reason the UI is unbuilt

#### Scenario: Add and remove datetimes on create
- **WHEN** I am on the new-event form
- **AND** I add a second datetime row, set a credit price on each remaining row, and remove one row
- **THEN** submitting persists exactly the remaining datetime values and their credits on the event

#### Scenario: Per-datetime credits persist
- **WHEN** I create an event with two datetime rows priced 1 and 3 credits
- **THEN** the stored `occurrence_credit_prices` are 1 and 3 in datetime order
- **AND** denormalized `credit_price` equals the primary/next slot’s price

#### Scenario: Total credits shown on the form
- **WHEN** the datetime list has rows priced 2 and 5
- **THEN** the form shows a total of 7 credits for the list

#### Scenario: Range and two time slots generate a grid
- **WHEN** I set a start date, end date, and time slots 10:00 at 1 credit and 18:00 at 3 credits
- **THEN** the datetime list has one row per date × each time
- **AND** morning rows are priced 1 and evening rows are priced 3

#### Scenario: Changing the end date rebuilds from scratch
- **WHEN** a generated list exists and I have manually added an extra row
- **AND** I change the builder end date
- **THEN** the list is replaced by a fresh expansion
- **AND** the manually added row is gone

#### Scenario: Create prefills slots from partner open times
- **WHEN** I am on the new-event form and select a partner open 10:00–18:00 weekdays and closed Sunday
- **THEN** the builder shows a 10:00 time slot by default

#### Scenario: Closed weekdays omitted from expansion
- **WHEN** that partner is selected and I generate a range that includes Sunday with the default 10:00 slot
- **THEN** Sunday is not in the datetime list
- **AND** open weekdays in range are

## MODIFIED Requirements

### Requirement: Product docs describe clone not series
`docs/product/features/admin-events.feature`, `docs/product/sitemap/sitemap.md`, and `docs/product/ui/ui-component-map.md` SHALL document `/admin/events/:id/clone` (ADMIN clone flow) and SHALL NOT document `/admin/events/series/new` as a current MVP route. An inline date-range builder on create, edit, and clone event forms is a current MVP surface (not a separate series route). Feature scenarios SHALL include clone acceptance coverage (happy path and entry points; voucher inventory reject when practical) and SHALL NOT require series-create scenarios. Canonical Gherkin SHALL include the inline builder, per-datetime credits, and partner-hours defaults (this hardening step). `docs/product/ui/ui-component-map.md` Events row SHALL mention per-row credits, the list total, and the range builder. `docs/product/extras/gaps-and-decisions.md` SHALL NOT describe admin add/remove datetime UI as parked or `ALLOW_MULTI_DATETIME_UI = false`.

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

#### Scenario: UI map and Gherkin describe the inline builder
- **WHEN** a reader opens `admin-events.feature` and the Events row of `ui-component-map.md`
- **THEN** both describe per-datetime credits and the inline date-range builder on create/edit/clone
- **AND** neither describes admin multi-datetime UI as parked
