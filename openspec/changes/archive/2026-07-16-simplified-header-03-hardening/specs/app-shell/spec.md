## ADDED Requirements

### Requirement: Header regression coverage

Ladle (or equivalent) stories SHALL cover guest slim header, member tools chrome, and admin entry. Automated e2e that previously asserted header links for How it works, Membership, or Sign up SHALL be updated to the new reachability paths (footer Navigation and/or in-page CTAs) or removed if obsolete. Stories and e2e SHALL NOT re-expand header IA. Proximity/layout selectors SHALL remain the only allowed e2e locator style per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Stories show slim guest chrome

- **WHEN** a developer opens AppShell / navbar guest stories
- **THEN** Sign up, How it works, and Membership are not present in the header region

#### Scenario: Stories cover member and admin chrome

- **WHEN** a developer opens AppNavbar (or AppShell) member and admin stories
- **THEN** marketing nav is Discover + FAQ and role tools / admin entry remain visible as applicable

#### Scenario: E2e does not require relocated links in the header

- **WHEN** Playwright asserts reachability of How it works, Membership, or Sign up after this change
- **THEN** those assertions target footer or in-page CTAs (or are removed), not the sticky header primary/auth chrome

#### Scenario: Header absence can be asserted with proximity selectors

- **WHEN** a guest header regression check is needed in e2e
- **THEN** the test MAY assert that Sign up / How it works / Membership are absent from the banner/header region using role/proximity selectors, without CSS-class-only theme assertions
