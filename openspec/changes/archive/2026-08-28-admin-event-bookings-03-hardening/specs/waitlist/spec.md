## ADDED Requirements

### Requirement: Canonical waitlist Gherkin records cancel-all close
`docs/product/features/waitlist.feature` SHALL state that event cancel-all sets every `WAITING` entry for that event to `CANCELLED` and MUST NOT run automatic or manual promotion as a side effect. Promotion SHALL remain documented as triggered by single-booking admin cancel or an admin capacity increase — not by cancel-all. Playwright `e2e/specs/waitlist.spec.ts` SHALL include a test titled verbatim `Scenario: Cancel-all does not promote the waitlist`. The waitlist-closed email scenario MAY skip inbox assertion with an explicit no-harness reason and MUST NOT use `@skip-no-ui`.

#### Scenario: Cancel-all does not promote the waitlist
- **WHEN** an event is sold out, members are WAITING, and an admin cancels all confirmed bookings
- **THEN** those WAITING entries become CANCELLED
- **AND** no waitlist entry becomes PROMOTED as a result of cancel-all
- **AND** restored capacity is not consumed by promotion
- **AND** Playwright uses that Gherkin title verbatim

#### Scenario: Waitlist member receives waitlist-closed email
- **WHEN** an admin completes cancel-all for an event the member was WAITING on
- **THEN** the member receives an email that the waitlist is closed
- **AND** that email does not state that credits were returned
