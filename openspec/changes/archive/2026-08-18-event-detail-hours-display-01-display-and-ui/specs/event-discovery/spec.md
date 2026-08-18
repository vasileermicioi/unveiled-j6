## MODIFIED Requirements

### Requirement: Guest sees partner attribution with optional opening hours

Public event detail SHALL show the hosting partner’s name and logo in the DETAILS card partner attribution area (not as a floating sticker on the hero). When the partner has `has_opening_hours` true and a valid schedule with at least one open weekday, the same attribution area SHALL list **working days only** (weekdays that are not marked closed), Monday→Sunday among remaining days, Europe/Berlin wall times as `HH:MM – HH:MM`. Closed weekdays SHALL be omitted (no Closed / Geschlossen rows). When `has_opening_hours` is false, hours are null, the week is malformed, or every weekday is closed, the hours list MUST be omitted while name/logo behavior remains unchanged. Hours visibility SHALL NOT depend on booking eligibility (guests and members see the same hours when enabled).

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

## ADDED Requirements

### Requirement: DETAILS Date omits time when partner has opening hours

When DETAILS shows Date chrome (booking-eligible members only), and the hosting partner’s opening-hours list is visible on that page, each Date line SHALL be the Europe/Berlin calendar date (weekday, day, month, year) **without** clock time. Multiple occurrences on the same Berlin calendar day SHALL collapse to one line. The next upcoming occurrence’s date SHALL remain emphasized. When the hours list is omitted, Date lines SHALL keep date **and** time (current formatter). Guests and other non-eligible viewers SHALL continue to omit Date chrome entirely. The checkout card datetime `<select>` (when two or more future slots exist) SHALL still show full slot date+time so members can pick an occurrence.

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
