## ADDED Requirements

### Requirement: Canonical waitlist Gherkin rejects unpublished events
`docs/product/features/waitlist.feature` SHALL add a one-liner that joining an unpublished event fails. Playwright `e2e/specs/waitlist.spec.ts` SHALL include the matching title. When the only honest assertion is domain-level (public detail 404 leaves no waitlist CTA), the titled test MAY `test.skip` pointing at the existing `joinWaitlist` unpublished package test. The system SHALL NOT add `@skip-no-ui`.

#### Scenario: Join unpublished fails
- **WHEN** a member joins the waitlist for an unpublished event
- **THEN** no waitlist row is written
