## ADDED Requirements

### Requirement: Shared page section header
The web app SHALL provide a reusable `PageSectionHeader` composition (HeroUI primitives only) that renders a muted uppercase eyebrow, a primary page/section headline, and a full-width horizontal rule beneath the headline, matching the Discover live-preview header treatment on the brand yellow page background.

#### Scenario: Discover uses shared header
- **WHEN** a guest opens locale home `/:locale`
- **THEN** the events section header is rendered via the shared `PageSectionHeader` pattern (eyebrow + headline + rule)

#### Scenario: FAQ uses shared header
- **WHEN** a visitor opens `/:locale/faq`
- **THEN** the FAQ page header uses the same ruled section-header pattern (not a one-off unstyled stack)

#### Scenario: Auth pages use shared header
- **WHEN** a visitor opens `/:locale/login` or `/:locale/signup`
- **THEN** the auth page shows an eyebrow + headline section header with the shared bottom rule above the auth form
