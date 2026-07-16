# App Shell

Sticky header and footer information architecture: guest / member / admin chrome, which destinations belong in the header vs footer and page CTAs, logo routing, and the Discover → Events CTA contract documented in `docs/product/ui/app-shell.md`.

## Requirements

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

### Requirement: Discover header CTA treatment

The Discover control in the sticky header and mobile navigation drawer SHALL be a theme button: `button--primary` (yellow fill) when it is the current page, and `button--secondary` when it is not — so yellow “you are here” highlighting is not shown on Discover and FAQ at the same time. FAQ SHALL use the text nav treatment (`.nav-link`), with yellow active fill only when FAQ is current. Visuals SHALL come from theme tokens / `globals.css`, not per-route color, border, shadow, or typography utilities. Drop shadows SHALL NOT be introduced for this treatment.

#### Scenario: Discover reads as primary when current

- **WHEN** a guest views the header on Discover (`/:locale`) at `lg+`
- **THEN** Discover uses theme primary button classes and FAQ is not yellow-filled

#### Scenario: FAQ active does not double-select Discover

- **WHEN** a guest views the header on FAQ
- **THEN** FAQ uses the active `.nav-link` yellow treatment and Discover uses secondary (not primary yellow)

#### Scenario: FAQ stays text nav

- **WHEN** a guest or member views primary marketing nav
- **THEN** FAQ uses the text / `.nav-link` treatment and is not styled as `button--primary`

#### Scenario: Drawer matches Discover active treatment

- **WHEN** a guest opens the mobile navigation drawer
- **THEN** Discover uses primary only when current, otherwise secondary, and FAQ remains text nav

### Requirement: Relocated destinations remain reachable

How it works (`/how-it-works`) and Membership (`/membership`) SHALL remain available as routes (direct URL / in-flow CTAs) but SHALL NOT appear in the sticky header or footer Navigation column. Footer Navigation SHALL list Discover and FAQ only. Sign up SHALL remain reachable via auth routes — not via guest header auth controls. Footer brand tagline MAY remain; it is not a header requirement.

#### Scenario: Footer Navigation is Discover and FAQ only

- **WHEN** a visitor reads the Footer Navigation column
- **THEN** Discover and FAQ (or equivalent locale labels) are listed and How it works / Membership are not

#### Scenario: Sign up remains outside header

- **WHEN** a guest needs to create an account
- **THEN** product docs do not require a Sign up control in the sticky header and still document signup via auth routes

### Requirement: Discover to Events CTA contract unchanged

The Discover → Events nav / CTA contract in `docs/product/ui/app-shell.md` SHALL remain: Discover link always points at `/:locale`; guests reach full event browse via signup/login landing on `/events` after auth/onboarding; Discover preview cards link to public `/events/:id`. This step SHALL NOT alter that contract while sliming header chrome.

#### Scenario: Discover CTA section still accurate

- **WHEN** an implementer re-reads the Discover → Events section after the Header rewrite
- **THEN** Discover still targets `/:locale`, preview cards still target public detail, and ungated `/events` list access is still not offered to guests

### Requirement: Header regression coverage

Ladle (or equivalent) stories SHALL cover guest slim header, member tools chrome, and admin entry. Automated e2e that previously asserted header/footer links for How it works, Membership, or Sign up SHALL be updated to direct URL / in-flow CTAs or removed if obsolete. Stories and e2e SHALL NOT re-expand header/footer IA. Proximity/layout selectors SHALL remain the only allowed e2e locator style per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Stories show slim guest chrome

- **WHEN** a developer opens AppShell / navbar guest stories
- **THEN** Sign up, How it works, and Membership are not present in the header region

#### Scenario: Stories cover member and admin chrome

- **WHEN** a developer opens AppNavbar (or AppShell) member and admin stories
- **THEN** marketing nav is Discover + FAQ and role tools / admin entry remain visible as applicable

#### Scenario: E2e does not require relocated links in the header or footer nav

- **WHEN** Playwright asserts reachability of How it works, Membership, or Sign up after this change
- **THEN** those assertions target direct URLs or in-flow CTAs (or are removed), not the sticky header or footer Navigation column

#### Scenario: Header absence can be asserted with proximity selectors

- **WHEN** a guest header regression check is needed in e2e
- **THEN** the test MAY assert that Sign up / How it works / Membership are absent from the banner/header region using role/proximity selectors, without CSS-class-only theme assertions
