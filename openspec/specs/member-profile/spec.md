# Member Profile

Authenticated member account home: tabbed membership manage surface and personal details, cultural preferences (“Vibes”) editor, password-change entry via Neon Auth / Better Auth UI, profile billing (Customer Portal + cancel), and profile tab navigation.

## Requirements

### Requirement: Profile identity and membership home

The system SHALL provide an authenticated membership home surface at `/:locale/profile` styled like the membership marketing card (headline/status, vertical perk list, primary CTA). The primary CTA for members with a linked Stripe customer SHALL open the Stripe Customer Portal via SSR form POST to manage the subscription. Members without a portal-eligible subscription SHALL see a CTA to `/:locale/membership` checkout. The account home SHALL NOT present a credit-wallet balance panel or a “Refill credits” control. Personal details (first name, last name, email) SHALL remain editable on `/:locale/profile/details` via SSR form POST. Identity persistence SHALL update `public.users` profile/email fields through a package-level helper (not route-only logic). Email changes SHALL remain aligned with Neon Auth / Better Auth identity (no second user store).

#### Scenario: View membership home

- **WHEN** a signed-in member opens `/profile`
- **THEN** they see a membership-style account panel (not a credit-wallet balance / refill panel)

#### Scenario: Manage subscription from profile home

- **WHEN** a signed-in member with a Stripe customer id chooses to manage their subscription from `/profile`
- **THEN** they are redirected to the Stripe Customer Portal (SSR form POST)

#### Scenario: Inactive member starts membership from profile home

- **WHEN** a signed-in member without an active portal-eligible subscription opens `/profile` and chooses to start/reactivate membership
- **THEN** they are taken to `/:locale/membership`

#### Scenario: View and edit identity

- **WHEN** a signed-in member submits updated first name, last name, or email on `/profile/details`
- **THEN** the account profile reflects the new values

#### Scenario: Guest blocked from profile

- **WHEN** an unauthenticated visitor requests `/:locale/profile`
- **THEN** they are redirected to sign in

#### Scenario: Guest blocked from personal details

- **WHEN** an unauthenticated visitor requests `/:locale/profile/details`
- **THEN** they are redirected to sign in

### Requirement: Location preference storage

Member profile location preference SHALL store `country`, `city`, and `zip_code` on `users.profile`. For this release, saves SHALL default or require `country = DE` and `city = berlin` with a valid Berlin `zip_code` validated via shared `validatePostalCode({ country, city, zipCode })`. The system SHALL NOT collect or persist `districts` arrays for active preference saves. Legacy `districts` keys SHALL be cleared or ignored on write. Unsupported country/city pairs and invalid postal codes SHALL be rejected with a typed validation error.

#### Scenario: Preference save stores zip under Germany/Berlin

- **WHEN** a member preference save includes a valid Berlin zip (country/city defaulted or explicit)
- **THEN** `profile.country`, `profile.city`, and `profile.zip_code` are stored and `districts` is not required

#### Scenario: Preference save clears legacy districts

- **WHEN** a member preference save successfully stores a location trio
- **THEN** `profile.districts` is cleared (null or absent) on the persisted profile

#### Scenario: Invalid zip rejected on preference save

- **WHEN** a preference save includes a malformed or non-Berlin zip under `(DE, berlin)`
- **THEN** the update fails validation without mutating location preference fields

#### Scenario: Unsupported city rejected on preference save

- **WHEN** a preference save includes a country/city pair that is not in the postal registry
- **THEN** the update fails validation without mutating location preference fields

### Requirement: Travel distance persistence

The system SHALL persist `users.profile.max_distance` as a positive integer kilometers within the configured bounds (inclusive **1–50** unless constants are updated in one place) when onboarding location or profile preferences are saved with a travel distance. Preference saves SHALL NOT clear `max_distance` to null as a blanket policy. Invalid, non-integer, missing (on location-touching saves), or out-of-range values SHALL be rejected with a typed validation error without mutating preference fields. Legacy `districts` SHALL still be cleared on location writes. GDPR anonymization SHALL continue to remove preference fields including `max_distance` (full profile wipe remains acceptable).

#### Scenario: Preference save keeps max_distance

- **WHEN** a member saves preferences including zip_code and max_distance = 10
- **THEN** profile.max_distance is 10 after save

#### Scenario: Out-of-range distance rejected

- **WHEN** a save includes max_distance outside the allowed bounds
- **THEN** the save is rejected with a validation error

#### Scenario: Non-integer distance rejected

- **WHEN** a save includes max_distance that is not a finite integer (for example 10.5 or a non-numeric string)
- **THEN** the save is rejected with a validation error

#### Scenario: Location save with zip and distance round-trips

- **WHEN** a preference or onboarding location save includes a valid Berlin zip_code and max_distance within bounds
- **THEN** the persisted profile contains both zip_code and max_distance
- **AND** districts is cleared (null or absent)

### Requirement: Cultural preferences editor

The system SHALL provide `/:locale/profile/preferences` where signed-in members can edit interests (including Other + free text), moods, location (`country` / `city` / `zip_code` under Germany/Berlin defaults for this release), travel distance (`max_distance` in kilometers), timing, preferred days, preferred languages, and accessibility needs via SSR form POST. Allowed values SHALL reuse the onboarding preference allowlists for non-location fields; location SHALL use the shared postal registry (Berlin PLZ under `DE` / `berlin`) rather than the 12 Berlin Bezirke `districts` multi-select. The Vibes location editor SHALL show country and city as prefilled, non-editable Germany/Berlin display (submitted as `DE` / `berlin`) plus a native zip input and a native number input for travel distance, with locale labels (Country / Land, City / Stadt, PLZ / Zip code, travel-distance label + km unit) and a short hint that Unveiled currently serves Berlin. Travel distance SHALL be required when saving location fields. Persistence SHALL merge into `users.profile`, store the location trio, clear legacy `districts`, persist validated `max_distance` (integer km within configured bounds), set `behavior.preferences_updated_at` (Europe/Berlin semantics), and MUST NOT mutate `behavior.onboarding_step` or `profile.onboarding_complete`. Preference saves SHALL NOT clear `max_distance` to null as a blanket policy. Invalid or non-Berlin zip or invalid/missing `max_distance` SHALL be rejected with a user-visible / typed validation error without mutating preference fields.

#### Scenario: Edit cultural preferences ("Vibes")

- **WHEN** a signed-in member updates interests (including Other + free text), moods, location zip under Germany/Berlin, max_distance within bounds, timing, preferred days, languages (searchable list), or accessibility needs and saves on `/profile/preferences`
- **THEN** the preferences are persisted on their profile including `country`, `city`, `zip_code`, and `max_distance`
- **AND** `max_distance` is not cleared to `null` by policy

#### Scenario: Edit cultural preferences includes radius

- **WHEN** I update zip and travel distance on `/profile/preferences`
- **THEN** both values are saved on my profile
- **AND** country and city remain Germany / Berlin (not a free picker)
- **AND** I cannot multi-select hangout districts

#### Scenario: Edit cultural preferences zip

- **WHEN** I update my zip code (and other Vibes fields) on profile preferences
- **THEN** my profile preferences are saved including `country`, `city`, and `zip_code`
- **AND** country and city remain Germany / Berlin (not a free picker)
- **AND** I cannot multi-select hangout districts

#### Scenario: Preference save preserves onboarding state

- **WHEN** an onboarded member saves cultural preferences
- **THEN** `behavior.onboarding_step` and `profile.onboarding_complete` are unchanged
- **AND** `behavior.preferences_updated_at` is updated

#### Scenario: Invalid preference values rejected

- **WHEN** a preference payload contains a value outside the onboarding allowlists, an invalid location trio, or an invalid max_distance
- **THEN** the update fails validation without mutating preference fields

### Requirement: Password change entry

The system SHALL allow members to change their password through the Neon Auth / Better Auth UI flow reachable from profile (for example `/:locale/profile/security`), not via a custom application password database.

#### Scenario: Change password

- **WHEN** a member completes the auth password-change flow from the profile entry point
- **THEN** their password is updated by the auth provider

### Requirement: Profile navigation entry points

The system SHALL expose account-section navigation as the profile tablist to preferences, **billing** (`/:locale/profile/billing` — implemented page, not a stub-only path), password change, **data export** (`/:locale/profile/data-export`), **account deletion** (`/:locale/profile/delete-account`), personal details (`/:locale/profile/details`), and membership home (`/:locale/profile`). Membership refill-from-wallet SHALL NOT be required. The member app shell SHALL provide a Profile control linking to `/:locale/profile` for signed-in USERs. A stacked Account link card on `/profile` SHALL NOT be required once tabs ship.

#### Scenario: Profile links to preferences and billing

- **WHEN** a member views `/profile`
- **THEN** they can navigate via tabs to `/profile/preferences` and to `/profile/billing`

#### Scenario: Profile links to GDPR flows

- **WHEN** a member views `/profile`
- **THEN** they can navigate via tabs to `/profile/data-export` and to `/profile/delete-account`

#### Scenario: Profile links to personal details

- **WHEN** a member views `/profile`
- **THEN** they can navigate via tabs to `/profile/details`

#### Scenario: Navbar profile entry

- **WHEN** a signed-in USER views the app shell
- **THEN** a Profile control links to `/:locale/profile`

### Requirement: Tabbed account navigation

The member account area SHALL expose **Membership** (home at `/:locale/profile`), Personal details, Vibes/Preferences, Billing, Change password, Export data, and Delete account as navigational tabs using the same link-tablist pattern as admin (`role="tablist"`, active tab via route). The previous Credit wallet tab label and wallet panel SHALL be removed. Each tab target SHALL remain an SSR page; identity and preference mutations SHALL continue as form POST on their dedicated routes.

#### Scenario: Account sections are tabs

- **WHEN** a signed-in member opens `/en/profile`
- **THEN** they see a horizontal tablist including Membership (not Credit wallet) and can open the other account destinations from tabs

#### Scenario: Deep links keep working

- **WHEN** a member opens `/en/profile/billing` (or another existing profile sub-route)
- **THEN** the billing tab is active and the billing page content is shown inside the account shell

#### Scenario: Billing nested routes keep billing tab active

- **WHEN** a member opens `/en/profile/billing/cancel`
- **THEN** the billing tab is active

### Requirement: Profile entry points for GDPR

The system SHALL expose navigation from the member profile area to data export and account deletion flows that resolve to working SSR pages (not stub-only 404 paths).

#### Scenario: Access export and deletion

- **WHEN** a member opens profile settings
- **THEN** they can reach data export and account deletion

### Requirement: Profile billing page

The system SHALL provide authenticated `/:locale/profile/billing` showing current plan (Basic Berlin / `BASIC_BERLIN`), subscription status, period end when known, and payment method / billing address summary when available on the subscription row, with CTAs for Stripe Customer Portal and cancel subscription. PAST_DUE members SHALL see recovery messaging plus the portal CTA. INACTIVE members SHALL see a reactivation CTA to membership Checkout. Mutations (open portal, cancel) SHALL be SSR form POSTs. Business logic for Stripe session creation and cancel-at-period-end SHALL live in `@unveiled/billing`, not only in route files.

#### Scenario: View billing information

- **WHEN** a member opens `/profile/billing`
- **THEN** they see plan and billing summary for their subscription

#### Scenario: Cancel subscription

- **WHEN** a member chooses cancel on the billing flow
- **THEN** cancellation is scheduled for period end per credits-subscription mechanics

#### Scenario: Guest blocked from billing

- **WHEN** an unauthenticated visitor requests `/:locale/profile/billing`
- **THEN** they are redirected to sign in

#### Scenario: Past due recovery CTA

- **WHEN** a member with `PAST_DUE` status opens `/profile/billing`
- **THEN** they see messaging to update payment and a Customer Portal CTA

#### Scenario: Inactive reactivation CTA

- **WHEN** a member with `INACTIVE` status opens `/profile/billing`
- **THEN** they can navigate to `/:locale/membership` to reactivate via Checkout

### Requirement: Phase 7 profile Playwright and Ladle coverage

The system SHALL ship Playwright coverage at `e2e/specs/profile.spec.ts` for in-scope `profile.feature` scenarios (identity, password-change entry, preferences, membership home / inactive checkout CTA, billing view/update/cancel entry points, and GDPR entry points) using verbatim Scenario titles and proximity selectors. Coverage SHALL assert membership home CTAs and that the account tablist precedes the account `PageSectionHeader` heading. Ladle SHALL include stories for profile billing, preferences, membership home, and GDPR export/delete confirm compositions (and related profile pages as needed). `Scenario: Access account deletion and data export` SHALL pass by asserting reachable export/delete entry points (and MAY assert page headings after navigation). Full export download and deletion mechanics MAY remain covered primarily in `auth.spec.ts`. Customer Portal deep hosted flows MAY assert SSR redirect / opt-in policy documented in `e2e/README.md` rather than requiring full Stripe Portal automation in default CI. Credit-wallet / refill account-home scenarios SHALL NOT remain as required profile e2e titles.

#### Scenario: Profile spec covers shipped surfaces

- **WHEN** `bun run test:e2e` executes `e2e/specs/profile.spec.ts`
- **THEN** identity, preferences, membership home, inactive checkout CTA, billing entry, and GDPR entry scenarios pass or record named env skips only

#### Scenario: Profile Ladle includes GDPR compositions

- **WHEN** Ladle stories for profile are reviewed after gdpr-rights step 03
- **THEN** export/delete confirm states are present alongside billing/preferences stories

#### Scenario: GDPR entry is not Phase-8 deferred

- **WHEN** coverage matrix lists `Access account deletion and data export` after this change
- **THEN** status is `pass` (or env skip) — not deferred for missing GDPR UI

#### Scenario: Coverage matrix profile rows leave unshipped

- **WHEN** Phase 7 closes
- **THEN** `profile.feature` rows are `pass`, `skip`, or `deferred` — not `unshipped`

#### Scenario: Profile e2e asserts tabs above header

- **WHEN** a signed-in member opens `/profile` in Playwright
- **THEN** the account tablist is above the account page heading (proximity / layout order)

### Requirement: Product docs and BDD match membership home

`docs/product/features/profile.feature`, sitemap, UI maps, and Playwright coverage SHALL describe `/profile` as the membership manage home (Stripe portal CTA; membership checkout when ineligible) with tablist above `PageSectionHeader`, and SHALL NOT describe a credit-wallet / refill account-home tab.

#### Scenario: Profile feature file has no credit-wallet account home

- **WHEN** an implementer reads `docs/product/features/profile.feature`
- **THEN** account-home scenarios describe membership manage (not credit wallet / refill)

#### Scenario: Coverage matrix tracks membership home e2e

- **WHEN** an implementer reads `docs/product/testing/coverage-matrix.md` profile rows
- **THEN** Playwright entries match the membership-home scenarios (or explicit skip with reason)

#### Scenario: Sitemap profile row is membership home

- **WHEN** an implementer reads the `/profile` row in `docs/product/sitemap/sitemap.md`
- **THEN** the blurb describes membership manage home, not a credit-wallet tab

### Requirement: GDPR profile Ladle coverage

The system SHALL provide Ladle stories for member GDPR compositions `DataExportPage` and `DeleteAccountPage` (confirm + error where applicable) under `apps/web/app/components/profile/`, and for `AdminDeleteAccountForm` confirm/error under `apps/web/app/components/admin/`.

#### Scenario: Export and delete confirm stories exist

- **WHEN** an implementer opens Ladle after this change
- **THEN** DataExport, DeleteAccount confirm/error, and AdminDeleteAccount confirm/error stories load

### Requirement: Profile preferences use native localized controls
The cultural preferences editor at `/:locale/profile/preferences` SHALL use the same native HTML form controls and DE/EN option-label contract as onboarding preference steps. Persistence, allowlists, and SSR form POST behavior remain unchanged except that travel distance (`max_distance`) is collected via a native number input beside zip, preferred languages use the searchable multi-select pattern, and interests may include Other with free text (`interests_other`).

#### Scenario: Profile vibes editor shows native checkboxes
- **WHEN** a signed-in member opens `/profile/preferences`
- **THEN** multi-value preference fields (other than the languages searchable control) render as native checkboxes with visible labels
- **AND** preferred languages use native checkboxes inside a searchable client-side filter control (not HeroUI Select)
- **AND** when Other is selected under interests, a native text input or textarea captures `interests_other`
- **AND** travel distance is shown as a native number input with locale label and km unit
- **AND** accessibility uses a native checkbox with a short option label under a section title

#### Scenario: Profile preference options follow locale
- **WHEN** a member views `/de/profile/preferences`
- **THEN** option labels are German according to onboarding locale maps
- **AND** under `/en/profile/preferences` the same options are English

### Requirement: Profile interests Other shares onboarding free-text rules
The cultural preferences editor at `/:locale/profile/preferences` SHALL offer the same `Other` interest checkbox and free-text field as onboarding step 2. Persistence and validation SHALL match: `Other` in `interests` requires trimmed non-empty `interests_other` (max 100 characters); when `Other` is absent, `interests_other` SHALL be null. Labels SHALL be EN `Other` / DE `Sonstiges`.

#### Scenario: Profile Other interest requires text
- **WHEN** a signed-in member selects Other on `/profile/preferences` and submits without free text
- **THEN** the save is rejected with a validation error

#### Scenario: Profile Other interest saves free text
- **WHEN** a signed-in member selects Other, enters free text, and saves preferences
- **THEN** `interests` contains `Other` and `interests_other` stores the trimmed text

### Requirement: Profile accessibility section shares onboarding chrome
The cultural preferences editor at `/:locale/profile/preferences` SHALL present accessibility with the same question + yes-checkbox chrome and shared copy keys as onboarding step 4 (EN `Accessibility needed?` / `Yes`, DE `Barrierefreiheit benötigt?` / `Ja`). The persisted value SHALL remain a boolean posted as `accessibility`.

#### Scenario: Profile preferences accessibility mirrors Languages
- **WHEN** a signed-in member views `/profile/preferences`
- **THEN** accessibility has the accessibility question above its Yes/Ja checkbox, parallel to the Languages block
- **AND** the option label is the short affirmative (EN `Yes`, DE `Ja`)

### Requirement: Profile preferred languages share onboarding searchable multi-select
The cultural preferences editor at `/:locale/profile/preferences` SHALL use the same searchable preferred-languages multi-select as onboarding step 4: client-side filter only, `DE`/`EN` first when the filter is empty, remaining options A–Z by locale label, `Non-Verbal` not offered, values validated against `@unveiled/auth/constants` `PREFERRED_LANGUAGES`, and selected values still submitted when they do not match the active filter.

#### Scenario: Profile languages searchable list pins DE and EN
- **WHEN** a signed-in member opens the languages control on `/profile/preferences` with an empty filter
- **THEN** the first two options are German and English (locale labels)
- **AND** typing in the filter narrows the visible options client-side
- **AND** Non-Verbal is not offered

### Requirement: Account page chrome order and width

Member account pages under `/:locale/profile*` SHALL render the profile tablist **above** the shared `PageSectionHeader` (eyebrow + headline + rule), matching admin tab-above-title order. The tablist, page header (including the header rule), and primary content card SHALL share the same admin-width content shell (`max-w-7xl`) so the header is not wider than the card. Member account pages SHALL use the shared `PageSectionHeader` pattern used by other member surfaces such as Saved and My Tickets, instead of a standalone heading plus muted subtitle-only intro. Page-level muted subtitles under the title SHALL NOT be shown; essential instructional copy for destructive or GDPR flows MAY remain in card body content below the header.

#### Scenario: Tabs above account title

- **WHEN** a signed-in member opens `/en/profile` or another `/en/profile/*` tab route
- **THEN** the account tablist appears above the account `PageSectionHeader` title

#### Scenario: Header matches content column width

- **WHEN** a signed-in member opens `/en/profile`
- **THEN** the page header rule aligns to the same column width as the tab track and content card

#### Scenario: Profile header matches member app chrome

- **WHEN** a signed-in member opens `/en/profile`
- **THEN** the page intro uses the same eyebrow + headline header component pattern as `/en/saved`
- **AND** a muted subtitle line is not shown directly under the page title

#### Scenario: Account subpages share PageSectionHeader

- **WHEN** a signed-in member opens `/en/profile/details`, `/en/profile/preferences`, `/en/profile/billing`, `/en/profile/security`, `/en/profile/data-export`, or `/en/profile/delete-account`
- **THEN** each page intro uses `PageSectionHeader` with a localized eyebrow and headline

### Requirement: Product docs and Playwright match Vibes preference options

`docs/product/features/profile.feature` Scenario “Edit cultural preferences ("Vibes")” and `e2e/specs/profile.spec.ts` SHALL describe / exercise the shipped Vibes editor: interests (including Other + free text), moods, location as `country` / `city` / `zip_code` under Germany/Berlin defaults, **travel distance (`max_distance` in kilometers)**, timing, preferred days, searchable languages, and accessibility needs — and SHALL NOT require or show Bezirk hangout multi-select. Coverage-matrix rows for that Scenario SHALL match the updated title/assertions and MUST NOT claim “no travel radius”.

#### Scenario: Profile feature file Vibes has zip and travel distance

- **WHEN** an implementer reads the Vibes scenario in `docs/product/features/profile.feature`
- **THEN** it mentions updating interests (including Other + free text), location zip under Germany/Berlin, travel distance (`max_distance`), languages (searchable list), or accessibility needs as implemented
- **AND** travel distance is part of the Vibes form (required when saving location fields)
- **AND** 12 Bezirke / hangout districts multi-select is not required
- **AND** the scenario does not state “travel radius is not part of the Vibes form”

#### Scenario: Profile e2e Vibes asserts zip and travel distance

- **WHEN** `e2e/specs/profile.spec.ts` runs Scenario Edit cultural preferences ("Vibes")
- **THEN** the preferences form shows zip under Germany/Berlin (not Bezirk checkboxes)
- **AND** the preferences form shows a travel-distance control (native number / labeled how-far copy)
- **AND** the test does not assert that travel distance / radius is absent
- **AND** saving preferences with a valid zip and distance still succeeds
