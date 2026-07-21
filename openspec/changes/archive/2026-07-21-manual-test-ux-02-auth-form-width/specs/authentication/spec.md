## ADDED Requirements

### Requirement: Auth page layout stability
Auth pages (signup, login, and shared auth layout siblings) SHALL render the form card at the same content width as the page header/skeleton so the layout does not visibly shrink after client hydration.

#### Scenario: Signup card matches header width
- **WHEN** a guest opens `/:locale/signup`
- **THEN** the auth form card width matches the page header rule measure
- **AND** the width does not change after the auth UI hydrates

#### Scenario: Shared auth layout siblings stay aligned
- **WHEN** a guest opens `/:locale/login`, `/:locale/forgot-password`, or `/:locale/reset-password`
- **THEN** the auth form card uses the same content width as the shared auth page header/skeleton
- **AND** the width does not change after the auth UI hydrates
