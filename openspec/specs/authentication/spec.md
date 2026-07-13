# Authentication

Member signup, login, logout, password reset, route protection, and role-based post-login routing — plus GDPR data export / account anonymization domain APIs and automated browser coverage for implementable Gherkin scenarios.

## Requirements

### Requirement: On-demand data export
The system SHALL generate a downloadable summary of a member's profile, bookings, and credit ledger synchronously on request without an asynchronous batch job.

#### Scenario: Export data
- **WHEN** a signed-in member requests a data export
- **THEN** a complete summary of their profile, bookings, and ledger is produced on demand

#### Scenario: Export excludes deleted accounts
- **WHEN** a data export is requested for a user whose `deleted_at` is set
- **THEN** the export is rejected with a typed already-deleted error and no payload is returned

### Requirement: Account anonymization
The system SHALL anonymize personally identifiable profile data on account deletion, set `deleted_at`, disable login via Neon Auth, retain booking and credit-ledger rows for legal retention, and cancel any active subscription as part of deletion. The same anonymization path SHALL serve self-service and admin-assisted deletion.

#### Scenario: Delete account
- **WHEN** account deletion is processed
- **THEN** PII is anonymized, financial history remains attached to the anonymized user id, and prior credentials no longer authenticate

#### Scenario: Deletion distinct from cancel
- **WHEN** a member only cancels their subscription
- **THEN** the account is not anonymized; deletion remains a separate action

#### Scenario: Admin-assisted deletion shares path
- **WHEN** an admin processes account deletion on a member's behalf
- **THEN** the same anonymization behavior applies as a self-service deletion

#### Scenario: Already-deleted is rejected
- **WHEN** anonymization is requested for a user who already has `deleted_at` set
- **THEN** the operation fails with a typed already-deleted error and Auth disable / subscription cancel side effects are not re-run

### Requirement: GDPR profile and admin pages
The system SHALL provide SSR pages at `/:locale/profile/data-export`, `/:locale/profile/delete-account`, and `/:locale/admin/users/:id/delete-account` (`noindex`) that perform export download and anonymizing deletion via form POST (admin) or dedicated request flow (member), without client-only mutation modals. Member and admin deletion SHALL call the shared `anonymizeUserAccount` path. Export SHALL use the shared `buildUserDataExport` path and return a downloadable summary synchronously.

#### Scenario: Member export download
- **WHEN** a signed-in member requests a data export from `/:locale/profile/data-export`
- **THEN** they receive a downloadable JSON summary of their profile, bookings, and credit ledger generated on demand

#### Scenario: Member delete confirm
- **WHEN** a member confirms account deletion on `/:locale/profile/delete-account`
- **THEN** anonymization runs, the session ends, and prior credentials no longer work

#### Scenario: Admin assisted delete
- **WHEN** an admin confirms delete-account for a member on `/:locale/admin/users/:id/delete-account`
- **THEN** the same anonymization behavior as self-service applies and the admin remains signed in

#### Scenario: GDPR pages are noindex
- **WHEN** a crawler or browser requests any of the GDPR HTML pages
- **THEN** the response is marked `noindex`

### Requirement: Automated browser coverage for auth flows

Each implementable Gherkin scenario in `docs/product/features/auth.feature` SHALL have a Playwright test in `e2e/specs/auth.spec.ts` with a title matching the scenario line (or Scenario Outline plus example row). Google OAuth when CI cannot complete the provider flow SHALL use `test.skip` with an explicit reason. GDPR export/delete and admin-processed deletion SHALL pass once `gdpr-rights` ships, or use `test.skip` only with an explicit Neon Auth / env / harness reason naming the blocker (not “Phase 9 — not built”).

#### Scenario: Core auth loop is E2E-verified

- **WHEN** `bun run test:e2e` executes `e2e/specs/auth.spec.ts`
- **THEN** signup, login, logout, validation outlines, route protection, and role-based redirects are asserted
- **AND** any skipped scenario documents the blocker or deferral owner in the skip message

#### Scenario: Credentials come from environment

- **WHEN** an auth test needs a seeded USER or ADMIN account
- **THEN** it reads `E2E_USER_*` / `E2E_ADMIN_*` (or creates a disposable signup) and NEVER hardcodes production passwords in the spec file

#### Scenario: Password reset does not require mailbox delivery

- **WHEN** the password-reset request scenario runs
- **THEN** the test asserts the forgot-password success UI feedback only
- **AND** does not require verifying email delivery in CI

#### Scenario: GDPR scenarios no longer Phase-9 stubs

- **WHEN** gdpr-rights step 03 completes
- **THEN** the four GDPR scenarios in `auth.spec.ts` pass or skip only with Neon Auth / env / harness reasons

### Requirement: Phase 4½ release gate

The authentication domain's Phase 4½ done-when criteria SHALL include Playwright coverage for all implementable `auth.feature` scenarios, with explicitly marked skips only for optional Google OAuth CI limitations (and any remaining named Neon Auth / harness blockers for GDPR if still present), and that suite SHALL run as part of the CI E2E job. GDPR flows are no longer deferred solely as “Phase 9.”

#### Scenario: Auth E2E is part of phase gate

- **WHEN** Phase 4½ is declared complete
- **THEN** `e2e/specs/auth.spec.ts` is included in the CI E2E job
- **AND** every skip in that file cites the deferral owner or blocker in the skip message

#### Scenario: Auth coverage remains env-driven

- **WHEN** CI runs auth E2E
- **THEN** credentials come from `E2E_USER_*` / `E2E_ADMIN_*` secrets (or disposable signup)
- **AND** production passwords are never hardcoded in the spec file

### Requirement: GDPR auth Playwright close-out

The system SHALL implement Playwright coverage in `e2e/specs/auth.spec.ts` for `auth.feature` scenarios `Request a data export`, `Request account deletion`, `Account deletion is distinct from subscription cancellation`, and `Admin can process account deletion on a member's behalf`, now that member and admin GDPR SSR pages exist. Specs SHALL use verbatim Gherkin titles and proximity selectors. Destructive tests SHALL use disposable onboarded members (not shared `E2E_USER_*`). Skips SHALL only use documented Neon Auth, env, or harness reasons — not “Phase 9” or “not built.”

#### Scenario: Member data export is E2E-verified

- **WHEN** `Scenario: Request a data export` runs
- **THEN** a signed-in member can obtain an on-demand downloadable export summary from profile settings

#### Scenario: Member account deletion is E2E-verified

- **WHEN** `Scenario: Request account deletion` runs
- **THEN** confirming deletion anonymizes the account, ends the session, and prior credentials no longer work

#### Scenario: Deletion distinct from subscription cancel is E2E-verified

- **WHEN** `Scenario: Account deletion is distinct from subscription cancellation` runs
- **THEN** account deletion also cancels the subscription as part of the same action, and cancelling a subscription alone does not anonymize the account

#### Scenario: Admin-assisted deletion is E2E-verified

- **WHEN** `Scenario: Admin can process account deletion on a member's behalf` runs
- **THEN** admin confirm on `/admin/users/:id/delete-account` applies the same anonymization behavior as self-service
