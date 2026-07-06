## ADDED Requirements

### Requirement: Phase 3 release gate

Phase 3 onboarding SHALL be complete when staging supports the full four-step wizard, onboarding guards, skip-age flow, and membership redirect without console errors on `/de` and `/en`.

#### Scenario: Client demo acceptance

- **WHEN** the client runs the Phase 3 demo on staging
- **THEN** they can sign up, complete all onboarding steps (including skip on age), land on membership, and a returning complete user skips the wizard

#### Scenario: No console errors on onboarding routes

- **WHEN** an incomplete USER loads each onboarding step on staging in DE and EN
- **THEN** the browser console shows no errors

#### Scenario: Preferences persisted for admin intel

- **WHEN** onboarding completes on staging
- **THEN** `users.profile` contains the captured arrays and flags even though feed ranking is not yet implemented
