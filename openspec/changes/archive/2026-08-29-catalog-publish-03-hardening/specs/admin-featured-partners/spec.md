## ADDED Requirements

### Requirement: Canonical featured-partners Gherkin records featured publish
`docs/product/features/admin-partners.feature` SHALL include featured-partner publish/unpublish behavior with the titles below. Playwright `e2e/specs/admin-partners.spec.ts` SHALL map 1:1. Existing title **Add by searching existing partners** SHALL keep its name; its steps SHALL state that add creates an unpublished featured row and points at the featured-partner publish confirm. **Admin remove from featured partners keeps venue** SHALL still assert Discover Partner venues no longer lists the partner after remove. Selectors SHALL be proximity/layout only. Env skips (`E2E_ADMIN_*`, R2) MAY remain. The system SHALL NOT add `@skip-no-ui` for these MVP scenarios.

#### Scenario: Add featured partner stays off Discover until publish
- **WHEN** an admin adds a partner to featured and does not publish the featured row
- **THEN** the partner is on `/admin/featured-partners` as Draft
- **AND** a guest on `/:locale/discover` does not see that partner in Partner venues

#### Scenario: Publish featured partner shows on Discover
- **WHEN** an admin confirms publish on a featured partner
- **THEN** a guest on `/:locale/discover` may see that partner in Partner venues
- **AND** the partner remains on `/admin/featured-partners` as Published

#### Scenario: Unpublish featured partner keeps venue
- **WHEN** an admin confirms unpublish on a featured partner
- **THEN** Discover Partner venues omits it
- **AND** the partner remains on `/admin/partners` and `/admin/featured-partners`
