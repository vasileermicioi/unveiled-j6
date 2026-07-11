## ADDED Requirements

### Requirement: Proximity selectors (gap G7 remediation)
The system SHALL assert MVP Playwright scenarios with proximity/layout selectors. Standing use of `page.locator('input[name=…]')` for fields that should expose accessible names is forbidden; native file inputs MAY use `page.locator` / `setInputFiles` only with an inline `// BDD exception: file-input` comment.

#### Scenario: Admin date fields are label-addressable
- **WHEN** an e2e test fills an event date or time on an admin form
- **THEN** it uses an accessible name (`getByLabel` or equivalent) rather than a bare `input[name=…]` locator, unless a named deferral documents why not

#### Scenario: File inputs keep the documented exception
- **WHEN** an e2e test uploads an event image or partner logo via a native file input
- **THEN** any `page.locator` / `setInputFiles` call is accompanied by an inline `// BDD exception: file-input` comment

#### Scenario: Remaining locator debt is named
- **WHEN** Phase 5.5 step 03 completes and a non-file `page.locator` remains in `admin-events.spec.ts` or `e2e/fixtures/admin.ts`
- **THEN** that locator is listed as a named deferral (file path, purpose, reason, target phase)

### Requirement: MVP @skip-no-ui gate
Phase 5.5 SHALL NOT leave MVP-required scenarios tagged `@skip-no-ui` without an explicit deferral recording scenario name, reason, and target phase. Post-MVP portal/check-in/QR skips MAY remain.

#### Scenario: Remote URL event image
- **WHEN** Phase 5.5 step 03 completes
- **THEN** "Supply the event image as a remote URL" either has a passing Playwright test without `@skip-no-ui` or is listed as a named deferral

#### Scenario: Post-MVP partner portal and QR skips remain
- **WHEN** Phase 5.5 step 03 completes
- **THEN** `admin-partners` portal-access and venue QR scenarios may remain tagged `@skip-no-ui` without being treated as MVP gate failures
