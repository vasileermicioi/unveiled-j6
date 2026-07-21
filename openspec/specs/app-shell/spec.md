# App Shell

Sticky header and footer information architecture: guest / member / admin chrome, which destinations belong in the header vs footer and page CTAs, logo routing, and the Discover → Events CTA contract documented in `docs/product/ui/app-shell.md`.

## Requirements

### Requirement: Guest header chrome

The guest sticky header SHALL expose, left to right: wordmark logo (→ `/:locale` or existing guest home); primary nav **Discover** (`/:locale/discover`) as the theme primary CTA and **FAQ** (`/faq`) as text nav; language toggle DE|EN; and a **Log in** control (secondary). The guest header and mobile drawer SHALL NOT include How it works, Membership, Sign up, or a logo tagline. Product documentation (`docs/product/ui/app-shell.md`) MAY be updated in step 04; this step ships the chrome behavior.

#### Scenario: Guest desktop header is slim

- **WHEN** an unauthenticated visitor views any non-auth page at `lg+`
- **THEN** the header shows logo, Discover (→ `/discover`), FAQ, DE|EN, and Log in only (with no Sign up, How it works, Membership, or logo tagline in the header)

#### Scenario: Guest drawer matches slim IA

- **WHEN** an unauthenticated visitor opens the mobile navigation drawer on a non-auth page
- **THEN** the drawer lists Discover (→ `/discover`) and FAQ as primary nav, Log in as guest auth, and does not list Sign up, How it works, or Membership

#### Scenario: Guest auth hidden on auth pages

- **WHEN** a guest views an auth page (`/login`, `/signup`, etc.)
- **THEN** the header does not show Log in (existing auth-page guest-auth hide behavior preserved)

### Requirement: Primary nav Discover vs Browse events

The system SHALL label the primary marketing nav item as **Discover** / **Entdecken** for guests and non-booking-eligible `USER` members, linking to `/:locale/discover`, and as **Browse events** / **Events entdecken** for `USER` members with a booking-eligible subscription (`ACTIVE` or `CANCELLED_PENDING`), linking to `/:locale/events`. The same label and href SHALL apply in the sticky header and the mobile drawer. Active-state highlighting SHALL use the resolved href. Booking eligibility SHALL reuse `isBookingEligibleStatus` (or an equivalent flag derived from it) rather than a parallel definition.

#### Scenario: Guest and inactive member see Discover

- **WHEN** the viewer is a guest or a USER without a booking-eligible subscription
- **THEN** the top nav shows Discover / Entdecken linking to `/:locale/discover`

#### Scenario: Active member sees Browse events

- **WHEN** the viewer is a USER with a booking-eligible subscription
- **THEN** the top nav shows Browse events (localized) linking to `/:locale/events`

### Requirement: Member primary nav

Signed-in `USER` primary marketing nav SHALL be the Discover-or-Browse-events control (per Primary nav Discover vs Browse events) and FAQ, plus role tools (Saved with badge when count > 0, Bookings / My Tickets, credits badge, Profile, Logout) per existing member chrome. How it works and Membership SHALL NOT appear in the member header or drawer primary nav. Logo routing for `USER` SHALL be `/:locale/events` when the subscription is booking-eligible, and `/:locale/discover` when it is not.

#### Scenario: Non-active member header

- **WHEN** a USER without a booking-eligible subscription views the site at `lg+`
- **THEN** marketing nav shows Discover → `/discover` and FAQ, and Saved / Bookings / credits / Profile / Logout remain available
- **AND** the logo links to `/:locale/discover`

#### Scenario: Active member header

- **WHEN** a USER with a booking-eligible subscription views the site at `lg+`
- **THEN** marketing nav shows Browse events → `/events` and FAQ, and role tools remain available
- **AND** the logo links to `/:locale/events`

#### Scenario: Member drawer matches marketing swap

- **WHEN** a USER opens the mobile navigation drawer
- **THEN** the Discover/Browse-events label and href match subscription state, FAQ remains, and role tools remain available in the drawer

### Requirement: Admin shares slim marketing nav

Admin chrome SHALL retain admin entry / dashboard-focused links under `/admin/*`. Where admin shares marketing primary nav with other roles, that marketing set SHALL be Discover + FAQ only (same slim contract as guest/member marketing nav). Logo routing for `ADMIN` SHALL be `/admin`.

#### Scenario: Admin marketing nav is slim

- **WHEN** an `ADMIN` views the site header or drawer
- **THEN** marketing primary nav is Discover and FAQ only, and the admin dashboard entry remains available

### Requirement: Discover header CTA treatment

The Discover-or-Browse-events control in the sticky header and mobile navigation drawer SHALL be a theme button: `button--primary` (yellow fill) when its resolved href is the current page, and `button--secondary` when it is not — so yellow “you are here” highlighting is not shown on that control and FAQ at the same time. FAQ SHALL use the text nav treatment (`.nav-link`), with yellow active fill only when FAQ is current. Visuals SHALL come from theme tokens / `globals.css`, not per-route color, border, shadow, or typography utilities. Drop shadows SHALL NOT be introduced for this treatment.

#### Scenario: Discover reads as primary when current

- **WHEN** a guest views the header on Discover (`/:locale/discover`) at `lg+`
- **THEN** Discover uses theme primary button classes and FAQ is not yellow-filled

#### Scenario: Browse events reads as primary when current

- **WHEN** an active USER views the header on `/events` at `lg+`
- **THEN** Browse events uses theme primary button classes and FAQ is not yellow-filled

#### Scenario: FAQ active does not double-select Discover/Browse

- **WHEN** a guest or member views the header on FAQ
- **THEN** FAQ uses the active `.nav-link` yellow treatment and Discover/Browse events uses secondary (not primary yellow)

#### Scenario: FAQ stays text nav

- **WHEN** a guest or member views primary marketing nav
- **THEN** FAQ uses the text / `.nav-link` treatment and is not styled as `button--primary`

#### Scenario: Drawer matches Discover/Browse active treatment

- **WHEN** a guest or member opens the mobile navigation drawer
- **THEN** Discover/Browse events uses primary only when its href is current, otherwise secondary, and FAQ remains text nav

### Requirement: Relocated destinations remain reachable

How it works (`/how-it-works`) and Membership (`/membership`) SHALL remain available as routes (direct URL / in-flow CTAs) but SHALL NOT appear in the sticky header or footer Navigation column. Footer Navigation SHALL list Discover and FAQ only. Sign up SHALL remain reachable via auth routes — not via guest header auth controls. Footer brand tagline MAY remain; it is not a header requirement.

#### Scenario: Footer Navigation is Discover and FAQ only

- **WHEN** a visitor reads the Footer Navigation column
- **THEN** Discover and FAQ (or equivalent locale labels) are listed and How it works / Membership are not

#### Scenario: Sign up remains outside header

- **WHEN** a guest needs to create an account
- **THEN** product docs do not require a Sign up control in the sticky header and still document signup via auth routes

### Requirement: Discover to Events CTA contract unchanged

The Discover → Events nav / CTA contract SHALL be: guests and non-booking-eligible members use Discover (`/:locale/discover`) for the curated featured preview; booking-eligible members use Browse events → `/:locale/events` for the full feed; guests reach full event browse via signup/login and an active subscription (inactive members land on Discover, not the full feed); Discover preview cards link to public `/events/:id`. Footer Navigation MAY keep Discover → `/:locale/discover` without swapping to Browse events in this step.

#### Scenario: Discover CTA section still accurate

- **WHEN** an implementer reads the shipped Discover ↔ Browse chrome after this change
- **THEN** guests/non-active members target Discover, active members target `/events`, preview cards still target public detail, and ungated `/events` list access is still not offered to guests or inactive members

### Requirement: Header regression coverage

Ladle (or equivalent) stories SHALL cover guest slim header, member tools chrome (including inactive Discover vs active Browse events when stories exist), and admin entry. Automated e2e that previously asserted header/footer links for How it works, Membership, or Sign up SHALL be updated to direct URL / in-flow CTAs or removed if obsolete. Stories and e2e SHALL NOT re-expand header/footer IA. Playwright SHALL cover active-member Browse events nav visibility with proximity/layout selectors only per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Stories show slim guest chrome

- **WHEN** a developer opens AppShell / navbar guest stories
- **THEN** Sign up, How it works, and Membership are not present in the header region

#### Scenario: Stories cover member and admin chrome

- **WHEN** a developer opens AppNavbar (or AppShell) member and admin stories
- **THEN** marketing nav is Discover or Browse events (by membership) + FAQ and role tools / admin entry remain visible as applicable

#### Scenario: E2e does not require relocated links in the header or footer nav

- **WHEN** Playwright asserts reachability of How it works, Membership, or Sign up after this change
- **THEN** those assertions target direct URLs or in-flow CTAs (or are removed), not the sticky header or footer Navigation column

#### Scenario: Header absence can be asserted with proximity selectors

- **WHEN** a guest header regression check is needed in e2e
- **THEN** the test MAY assert that Sign up / How it works / Membership are absent from the banner/header region using role/proximity selectors, without CSS-class-only theme assertions

#### Scenario: Active member Browse events nav is covered

- **WHEN** Playwright runs the featured Discover browse/nav smoke
- **THEN** an active USER session asserts Browse events (localized) linking to `/events` in the primary nav

### Requirement: Product docs document Discover vs Browse events nav

`docs/product/ui/app-shell.md` and related i18n inventory SHALL document the primary marketing nav swap: guests and non-booking-eligible `USER` members see **Discover** / **Entdecken** → `/:locale/discover`; booking-eligible `USER` members see **Browse events** / **Events entdecken** → `/:locale/events` (sticky header and mobile drawer). USER logo home SHALL be documented as `/events` when booking-eligible and `/discover` otherwise. Footer Navigation MAY keep Discover → `/discover` without Browse events parity unless a later product decision changes it.

#### Scenario: App shell docs match shipped nav

- **WHEN** a reader opens `docs/product/ui/app-shell.md`
- **THEN** they see Discover vs Browse events label/href rules by audience
- **AND** USER logo home split by booking eligibility is described

#### Scenario: I18n inventory includes Browse events strings

- **WHEN** a reader opens `docs/product/extras/content-i18n-inventory.md`
- **THEN** Discover / Entdecken and Browse events / Events entdecken appear as shell nav strings consistent with shipped copy
