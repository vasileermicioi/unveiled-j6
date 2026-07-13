## ADDED Requirements

### Requirement: GDPR profile Ladle coverage
The system SHALL provide Ladle stories for member GDPR compositions `DataExportPage` and `DeleteAccountPage` (confirm + error where applicable) under `apps/web/app/components/profile/`, and for `AdminDeleteAccountForm` confirm/error under `apps/web/app/components/admin/`.

#### Scenario: Export and delete confirm stories exist
- **WHEN** an implementer opens Ladle after this change
- **THEN** DataExport, DeleteAccount confirm/error, and AdminDeleteAccount confirm/error stories load

## MODIFIED Requirements

### Requirement: Phase 7 profile Playwright and Ladle coverage
The system SHALL ship Playwright coverage at `e2e/specs/profile.spec.ts` for in-scope `profile.feature` scenarios (identity, password-change entry, preferences, wallet, refill, billing view/update/cancel entry points, and GDPR entry points) using verbatim Scenario titles and proximity selectors. Ladle SHALL include stories for profile billing, preferences, and GDPR export/delete confirm compositions (and related profile pages as needed). `Scenario: Access account deletion and data export` SHALL pass by asserting reachable export/delete entry points (and MAY assert page headings after navigation). Full export download and deletion mechanics MAY remain covered primarily in `auth.spec.ts`. Customer Portal deep hosted flows MAY assert SSR redirect / opt-in policy documented in `e2e/README.md` rather than requiring full Stripe Portal automation in default CI.

#### Scenario: Profile spec covers shipped surfaces
- **WHEN** `bun run test:e2e` executes `e2e/specs/profile.spec.ts`
- **THEN** identity, preferences, wallet, refill, billing entry, and GDPR entry scenarios pass or record named env skips only

#### Scenario: Profile Ladle includes GDPR compositions
- **WHEN** Ladle stories for profile are reviewed after gdpr-rights step 03
- **THEN** export/delete confirm states are present alongside billing/preferences stories

#### Scenario: GDPR entry is not Phase-8 deferred
- **WHEN** coverage matrix lists `Access account deletion and data export` after this change
- **THEN** status is `pass` (or env skip) — not deferred for missing GDPR UI
