## ADDED Requirements

### Requirement: Discover header CTA treatment

The Discover control in the sticky header and mobile navigation drawer SHALL use the theme primary affordance (`button button--primary`: yellow fill + dark text + dark border via theme tokens). FAQ SHALL use the secondary / text nav treatment (`.nav-link`). Visuals SHALL come from theme tokens / `globals.css`, not per-route color, border, shadow, or typography utilities. Drop shadows SHALL NOT be introduced for this treatment.

#### Scenario: Discover reads as primary in guest header

- **WHEN** a guest views the header on a pointer device at `lg+`
- **THEN** Discover is visually primary relative to FAQ and Log in, using theme primary button classes, without drop shadows

#### Scenario: FAQ stays secondary text nav

- **WHEN** a guest or member views primary marketing nav
- **THEN** FAQ uses the text / `.nav-link` treatment and is not styled as `button--primary`

#### Scenario: Drawer matches Discover primary treatment

- **WHEN** a guest opens the mobile navigation drawer
- **THEN** Discover uses the same primary theme affordance and FAQ remains text nav

## MODIFIED Requirements

### Requirement: Guest header chrome

The guest sticky header SHALL expose, left to right: wordmark logo (→ `/:locale`); primary nav **Discover** (`/:locale`) as the theme primary CTA and **FAQ** (`/faq`) as text nav; language toggle DE|EN; and a **Log in** control (secondary). The guest header and mobile drawer SHALL NOT include How it works, Membership, Sign up, or a logo tagline. Product documentation (`docs/product/ui/app-shell.md`) SHALL remain aligned with this shipped chrome.

#### Scenario: Guest desktop header is slim

- **WHEN** an unauthenticated visitor views any non-auth page at `lg+`
- **THEN** the header shows logo, Discover, FAQ, DE|EN, and Log in only (with no Sign up, How it works, Membership, or logo tagline in the header)

#### Scenario: Guest drawer matches slim IA

- **WHEN** an unauthenticated visitor opens the mobile navigation drawer on a non-auth page
- **THEN** the drawer lists Discover and FAQ as primary nav, Log in as guest auth, and does not list Sign up, How it works, or Membership

#### Scenario: Guest auth hidden on auth pages

- **WHEN** a guest views an auth page (`/login`, `/signup`, etc.)
- **THEN** the header does not show Log in (existing auth-page guest-auth hide behavior preserved)

### Requirement: Member primary nav

Signed-in `USER` primary text/marketing nav SHALL be Discover (`/:locale`, theme primary CTA) and FAQ, plus role tools (Saved with badge when count > 0, Bookings / My Tickets, credits badge, Profile, Logout) per existing member chrome. How it works and Membership SHALL NOT appear in the member header or drawer primary nav. Logo routing for `USER` SHALL be `/events`.

#### Scenario: Member header keeps tools, slim marketing nav

- **WHEN** a `USER` views the site at `lg+`
- **THEN** marketing nav is Discover and FAQ, and Saved / Bookings / credits / Profile / Logout remain available

#### Scenario: Member drawer keeps tools, slim marketing nav

- **WHEN** a `USER` opens the mobile navigation drawer
- **THEN** marketing links are Discover and FAQ only, and role tools remain available in the drawer

### Requirement: Admin shares slim marketing nav

Admin chrome SHALL retain admin entry / dashboard-focused links under `/admin/*`. Where admin shares marketing primary nav with other roles, that marketing set SHALL be Discover + FAQ only (same slim contract as guest/member marketing nav). Logo routing for `ADMIN` SHALL be `/admin`.

#### Scenario: Admin marketing nav is slim

- **WHEN** an `ADMIN` views the site header or drawer
- **THEN** marketing primary nav is Discover and FAQ only, and the admin dashboard entry remains available
