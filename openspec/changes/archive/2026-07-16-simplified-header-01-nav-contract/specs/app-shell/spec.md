## ADDED Requirements

### Requirement: Guest header chrome

The guest sticky header SHALL expose, left to right: wordmark logo (→ `/:locale`); primary nav links **Discover** (`/:locale`) and **FAQ** (`/faq`); language toggle DE|EN; and a **Log in** control. The guest header SHALL NOT include How it works, Membership, Sign up, or a logo tagline. Product documentation (`docs/product/ui/app-shell.md`) SHALL describe this slim guest header exactly once under Header structure.

#### Scenario: Guest desktop header is slim

- **WHEN** an unauthenticated visitor views any non-auth page at `lg+`
- **THEN** product docs require the header to show logo, Discover, FAQ, DE|EN, and Log in only (with no Sign up, How it works, Membership, or logo tagline in the header)

#### Scenario: Guest header docs omit removed chrome

- **WHEN** an implementer reads the Header section of `docs/product/ui/app-shell.md` after this change
- **THEN** Sign up, How it works, and Membership are not listed under Header primary nav or guest auth

### Requirement: Member primary nav

Signed-in `USER` primary text nav SHALL be Discover (`/:locale`) and FAQ, plus role tools (Saved with badge when count > 0, Bookings / My Tickets, credits badge, Profile, Logout) per existing member chrome. How it works and Membership SHALL NOT appear in the member header primary nav. Logo routing for `USER` remains `/events`.

#### Scenario: Member header keeps tools, slim marketing nav

- **WHEN** a `USER` views the site at `lg+`
- **THEN** product docs require marketing text nav to be Discover and FAQ, with Saved / Bookings / credits / Profile / Logout still available

### Requirement: Admin shares slim marketing nav

Admin chrome SHALL retain admin entry / dashboard-focused links under `/admin/*`. Where admin shares marketing primary nav with other roles, that marketing set SHALL be Discover + FAQ only (same slim contract as guest/member marketing nav). Logo routing for `ADMIN` remains `/admin`.

#### Scenario: Admin marketing nav is slim

- **WHEN** an implementer reads admin Header structure in `docs/product/ui/app-shell.md` after this change
- **THEN** How it works and Membership are not required in admin primary marketing nav

### Requirement: Relocated destinations remain reachable

How it works (`/how-it-works`) and Membership (`/membership`) SHALL remain listed in the site footer Navigation column. Sign up SHALL remain reachable via Discover page CTAs and auth routes — not via guest header auth controls. Footer brand tagline MAY remain; it is not a header requirement.

#### Scenario: Footer still lists How it works and Membership

- **WHEN** a visitor reads the Footer Navigation column in product docs
- **THEN** How it works and Membership (or equivalent locale labels) are still listed

#### Scenario: Sign up remains outside header

- **WHEN** a guest needs to create an account
- **THEN** product docs do not require a Sign up control in the sticky header and still document signup via Discover/auth CTAs

### Requirement: Discover to Events CTA contract unchanged

The Discover → Events nav / CTA contract in `docs/product/ui/app-shell.md` SHALL remain: Discover link always points at `/:locale`; guests reach full event browse via signup/login landing on `/events` after auth/onboarding; Discover preview cards link to public `/events/:id`. This step SHALL NOT alter that contract while sliming header chrome.

#### Scenario: Discover CTA section still accurate

- **WHEN** an implementer re-reads the Discover → Events section after the Header rewrite
- **THEN** Discover still targets `/:locale`, preview cards still target public detail, and ungated `/events` list access is still not offered to guests
