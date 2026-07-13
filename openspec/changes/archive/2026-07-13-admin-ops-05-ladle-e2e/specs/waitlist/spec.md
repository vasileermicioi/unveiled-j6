## ADDED Requirements

### Requirement: Admin waitlist Playwright coverage
The system SHALL implement Playwright coverage for `waitlist.feature` scenarios `Admin visibility` and `Admin can manually trigger promotion for a specific entry` in `e2e/specs/waitlist.spec.ts` now that `/admin/waitlist` and promote confirm pages exist. Specs SHALL use verbatim Gherkin titles and proximity selectors. Skips SHALL only use documented env/harness reasons (not “UI not built”). Ladle SHALL include stories for admin waitlist list and promote confirm states.

#### Scenario: Admin waitlist visibility is executable
- **WHEN** an ADMIN opens `/admin/waitlist` in e2e with seeded waitlist data
- **THEN** entries across events are visible with status (and skip history when present)

#### Scenario: Admin manual promote is executable
- **WHEN** an ADMIN promotes a WAITING entry that fits available capacity via the promote confirm page
- **THEN** the promotion transaction runs for that entry and the scenario passes (or skips only for documented env prerequisites)

#### Scenario: Admin waitlist Ladle stories load
- **WHEN** Ladle is started after this change
- **THEN** admin waitlist list and promote confirm stories are available without runtime errors
