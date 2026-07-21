## ADDED Requirements

### Requirement: Primary nav Discover vs Browse events

The system SHALL label the primary marketing nav item as **Discover** / **Entdecken** for guests and non-booking-eligible `USER` members, linking to `/:locale/discover`, and as **Browse events** / **Events entdecken** for `USER` members with a booking-eligible subscription (`ACTIVE` or `CANCELLED_PENDING`), linking to `/:locale/events`. The same label and href SHALL apply in the sticky header and the mobile drawer. Active-state highlighting SHALL use the resolved href. Booking eligibility SHALL reuse `isBookingEligibleStatus` (or an equivalent flag derived from it) rather than a parallel definition.

#### Scenario: Guest and inactive member see Discover

- **WHEN** the viewer is a guest or a USER without a booking-eligible subscription
- **THEN** the top nav shows Discover / Entdecken linking to `/:locale/discover`

#### Scenario: Active member sees Browse events

- **WHEN** the viewer is a USER with a booking-eligible subscription
- **THEN** the top nav shows Browse events (localized) linking to `/:locale/events`

## MODIFIED Requirements

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

### Requirement: Discover to Events CTA contract unchanged

The Discover → Events nav / CTA contract SHALL be: guests and non-booking-eligible members use Discover (`/:locale/discover`) for the curated featured preview; booking-eligible members use Browse events → `/:locale/events` for the full feed; guests reach full event browse via signup/login and an active subscription (inactive members land on Discover, not the full feed); Discover preview cards link to public `/events/:id`. Footer Navigation MAY keep Discover → `/:locale/discover` without swapping to Browse events in this step.

#### Scenario: Discover CTA section still accurate

- **WHEN** an implementer reads the shipped Discover ↔ Browse chrome after this change
- **THEN** guests/non-active members target Discover, active members target `/events`, preview cards still target public detail, and ungated `/events` list access is still not offered to guests or inactive members
