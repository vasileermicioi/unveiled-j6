## ADDED Requirements

### Requirement: Phase 7 release evidence
The system SHALL demonstrate on staging: sold-out join → capacity frees → auto-promotion → email attempt, with seed documentation for the sold-out demo event (`Sold Out: Waitlist Demo Night` / `DEMO_DISCOVERY_TITLES.soldOutWaitlist`). `apps/web/DEPLOYMENT.md` SHALL document the demo path, seed title, and that Phase 7 is complete (do not start Phase 8). Ladle SHALL include stories for waitlist join/cancel page states used in the member UX.

#### Scenario: Client demo path
- **WHEN** the Phase 7 demo script is run on staging
- **THEN** waitlist join and promotion are observable end-to-end

#### Scenario: Sold-out seed documented for operators
- **WHEN** an operator reads `DEPLOYMENT.md` Phase 7 section
- **THEN** they find the sold-out demo event title/purpose and how to free capacity (admin capacity increase) to trigger promotion

#### Scenario: Waitlist Ladle stories load
- **WHEN** `bun run stories` (or `@unveiled/web` Ladle) is started after this change
- **THEN** waitlist join/cancel story states are available without runtime errors
