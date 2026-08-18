## MODIFIED Requirements

### Requirement: BDD coverage for detail layout and partner attribution

Gherkin scenarios for the two-row public detail layout and partner logo/name attribution (including **working-day** opening hours when enabled) SHALL have matching Playwright tests using proximity-only selectors, or a named deferral recorded in the coverage matrix with owner and target phase. Eligible-member DETAILS Date scenarios SHALL assert date-only lines when partner hours are visible and date+time lines when hours are omitted. Playwright titles SHALL match Gherkin `Scenario:` lines verbatim. Environment skips (`DATABASE_URL`) MAY remain as named `test.skip` reasons. The system SHALL NOT add `data-testid` for these scenarios.

#### Scenario: Coverage matrix lists new detail layout scenarios

- **WHEN** this feature is marked released
- **THEN** `docs/product/testing/coverage-matrix.md` includes rows for the new event-discovery detail layout, partner attribution, partner opening-hours, and eligible-member Date scenarios (pass or explicit deferral)

#### Scenario: Guest sees partner attribution

- **WHEN** a guest opens a public event detail URL for a seeded partner with a logo
- **THEN** the partner name and logo are visible in the DETAILS attribution area
- **AND** the logo is not overlaid on the event hero as a floating badge

#### Scenario: Guest sees partner opening hours

- **WHEN** that partner has opening hours enabled with a valid weekly schedule
- **THEN** the DETAILS attribution area lists the open weekday hours
- **AND** closed weekdays are not listed

#### Scenario: Hours omitted when disabled

- **WHEN** the partner has `has_opening_hours` false
- **THEN** event detail does not show an opening-hours list

#### Scenario: Eligible member Date is date-only when partner has hours

- **GIVEN** the hosting partner has opening hours enabled with at least one open weekday
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open "/events/:id"
- **THEN** DETAILS Date lists occurrence dates without clock times
- **AND** partner working-day hours remain visible in the attribution area

#### Scenario: Eligible member Date keeps time when partner has no hours

- **GIVEN** the hosting partner has `has_opening_hours` false
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open "/events/:id"
- **THEN** DETAILS Date lists date and time
- **AND** no opening-hours list is shown

#### Scenario: Large viewport two-row layout is documented and smoke-tested

- **WHEN** a guest or member views public event detail
- **THEN** product Gherkin describes lg+ row 1 (title/location | checkout) and row 2 (hero | Markdown description)
- **AND** Playwright covers a proximity smoke for identity, checkout CTA, hero, and description without CSS-module hashes

#### Scenario: Docs and e2e titles align

- **WHEN** event-detail-hours-display hardening completes
- **THEN** shipped Playwright titles for in-scope hours and Date scenarios match Gherkin `Scenario:` lines
- **OR** the coverage matrix lists a named deferral with owner

### Requirement: Guest sees partner attribution with optional opening hours

Public event detail SHALL show the hosting partner’s name and logo in the DETAILS card partner attribution area (not as a floating sticker on the hero). When the partner has `has_opening_hours` true and a valid schedule with at least one open weekday, the same attribution area SHALL list **working days only** (weekdays that are not marked closed), Monday→Sunday among remaining days, Europe/Berlin wall times as `HH:MM – HH:MM`. Closed weekdays SHALL be omitted (no Closed / Geschlossen rows). When `has_opening_hours` is false, hours are null, the week is malformed, or every weekday is closed, the hours list MUST be omitted while name/logo behavior remains unchanged. Hours visibility SHALL NOT depend on booking eligibility (guests and members see the same hours when enabled).

`docs/product/features/event-discovery.feature` SHALL state open days only and closed weekdays absent for `Guest sees partner opening hours`. The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL state working-day hours (closed days omitted). `docs/product/extras/content-i18n-inventory.md` SHALL still document Closed / Geschlossen for other surfaces (admin partner form) and SHALL state that the public detail hours list no longer shows that label.

#### Scenario: Guest sees partner attribution

- **WHEN** a guest opens a public event detail for an event whose partner has a logo
- **THEN** they see the partner name and logo in the DETAILS attribution area
- **AND** the logo is not rendered as a floating sticker on top of the event hero image

#### Scenario: Guest sees partner opening hours

- **WHEN** that partner has opening hours enabled with a valid weekly schedule that includes open and closed days
- **THEN** the DETAILS attribution area lists the open weekday hours
- **AND** closed weekdays are not listed

#### Scenario: Hours omitted when disabled

- **WHEN** the partner has `has_opening_hours` false
- **THEN** event detail does not show an opening-hours list

### Requirement: DETAILS Date omits time when partner has opening hours

When DETAILS shows Date chrome (booking-eligible members only), and the hosting partner’s opening-hours list is visible on that page, each Date line SHALL be the Europe/Berlin calendar date (weekday, day, month, year) **without** clock time. Multiple occurrences on the same Berlin calendar day SHALL collapse to one line. The next upcoming occurrence’s date SHALL remain emphasized. When the hours list is omitted, Date lines SHALL keep date **and** time (current formatter). Guests and other non-eligible viewers SHALL continue to omit Date chrome entirely. The checkout card datetime `<select>` (when two or more future slots exist) SHALL still show full slot date+time so members can pick an occurrence.

`docs/product/features/event-discovery.feature` SHALL include scenarios titled `Eligible member Date is date-only when partner has hours` and `Eligible member Date keeps time when partner has no hours`. Playwright titles SHALL match those `Scenario:` lines verbatim. Playwright SHALL assert Date/Datum lines omit clock time when hours are visible and include clock time when hours are omitted, using proximity to DETAILS Date chrome (not the hours list and not the checkout datetime select). `Booking-eligible member sees tickets, credits and date on event detail` SHALL NOT assume Date chrome includes clock time when partner hours are visible. The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL state Date = date-only when hours are visible, date+time otherwise, and that checkout select still uses full datetime. Same-day collapse MAY remain unit-tested without a dedicated Playwright title. Environment skips (`DATABASE_URL`) MAY remain as named `test.skip` reasons. The system SHALL NOT add `data-testid` for these scenarios.

#### Scenario: Eligible member Date is date-only when partner has hours

- **GIVEN** the hosting partner has opening hours enabled with at least one open weekday
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open "/events/:id"
- **THEN** DETAILS Date lists occurrence dates without clock times
- **AND** partner working-day hours remain visible in the attribution area

#### Scenario: Eligible member Date keeps time when partner has no hours

- **GIVEN** the hosting partner has `has_opening_hours` false
- **AND** I am signed in as a booking-eligible member
- **WHEN** I open "/events/:id"
- **THEN** DETAILS Date lists date and time
- **AND** no opening-hours list is shown

#### Scenario: Same-day slots collapse when time is omitted

- **GIVEN** two occurrences on the same Europe/Berlin calendar day at different times
- **AND** the hosting partner has published opening hours
- **AND** I am a booking-eligible member
- **WHEN** I open "/events/:id"
- **THEN** DETAILS Date shows that calendar day once
