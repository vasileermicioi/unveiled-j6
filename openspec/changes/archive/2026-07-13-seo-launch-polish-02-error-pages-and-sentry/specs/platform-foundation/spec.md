## ADDED Requirements

### Requirement: Branded error pages
The system SHALL render HeroUI 403 and 500 error pages consistent with the app shell (brand yellow backdrop), without exposing stack traces to end users. Wrong-role access SHOULD prefer redirect or 404 when leaking resource existence is undesirable; a generic 403 composition SHALL still exist for true forbidden HTML responses.

#### Scenario: Forbidden
- **WHEN** a true forbidden HTML response is rendered for an authenticated user who is not allowed to perform the action
- **THEN** a branded 403 page is shown without a stack trace

#### Scenario: Wrong-role admin prefers safe redirect
- **WHEN** a signed-in USER navigates to an admin-only URL under `/:locale/admin`
- **THEN** the request is rejected by redirect to `/:locale` (or 404) rather than confirming admin resource existence via a distinct 403 page

#### Scenario: Server error
- **WHEN** an unhandled server error occurs on an HTML page request
- **THEN** a branded 500 page is shown without a stack trace

### Requirement: Optional Sentry
The system SHALL initialize Sentry when `SENTRY_DSN` is configured, keep reporting PII-free, and MUST remain functional when the DSN is unset. Sentry SHALL NOT be gated behind cookie consent (strictly necessary error tracking).

#### Scenario: No DSN
- **WHEN** `SENTRY_DSN` is absent
- **THEN** the app starts without Sentry and without throwing

#### Scenario: DSN configured
- **WHEN** `SENTRY_DSN` is set to a valid DSN
- **THEN** Sentry initializes without throwing and does not require cookie consent to be enabled
