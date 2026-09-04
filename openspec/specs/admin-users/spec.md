# Admin Users

Admin-only Membership HQ: domain operations (list/search, detail aggregates, credit adjust/refund, freeze/unfreeze) plus SSR list and detail pages under `/:locale/admin/users`.

## Requirements

### Requirement: Admin member list and detail queries
The system SHALL expose admin-only domain operations to list members (sorted by name then email by default), filter by name/email/role, subscription status (including no-subscription), credit range, booking-count range, event-open-count range, and registration date range, and sort by member name, role, subscription, credits, bookings, event opens, or registration date in either direction with a stable default (display name, then email, then id). List and count operations SHALL apply identical filter predicates. Soft-deleted members (`deleted_at` set) SHALL be excluded from the list and SHALL NOT be returned as a successful detail load. Detail loads SHALL return a member detail aggregate including preferences, history counts, and available behavior fields.

#### Scenario: List members for Membership HQ
- **WHEN** an admin requests the member list
- **THEN** all non-deleted member accounts are returned sorted by display name, then email

#### Scenario: Search members by name, email, or role
- **WHEN** an admin lists members with a search query and/or role filter
- **THEN** only members matching the name/email query and role (when provided) are returned

#### Scenario: Member detail aggregate
- **WHEN** an admin loads member detail for an existing non-deleted user
- **THEN** the result includes profile preferences, subscription status when present, history counts (bookings, waitlist, saved events), and available behavior JSON fields without inventing missing analytics

#### Scenario: Range and enum filters compose
- **WHEN** an admin lists members with subscription `ACTIVE`, credits `10..17`, and created `2026-01-01..2026-12-31` sorted by created desc
- **THEN** list and count agree and every row matches all three predicates

#### Scenario: No-subscription filter
- **WHEN** an admin lists members with subscription filter `NONE`
- **THEN** only members with no subscription row are returned, and list and count agree

#### Scenario: Numeric range filters
- **WHEN** an admin lists members with a credits, booking-count, or event-open-count min/max range
- **THEN** only members whose value falls inside the inclusive range are returned, and list and count agree

#### Scenario: Registration date range uses calendar days
- **WHEN** an admin lists members with a created from/to date range
- **THEN** only members registered within the Europe/Berlin calendar-day bounds (inclusive, `from <= to`) are returned

#### Scenario: Sortable member list
- **WHEN** an admin lists members sorted by any of member, role, subscription, credits, bookings, event opens, or created in either direction
- **THEN** rows are ordered by the requested key and direction with a deterministic tiebreak (display name, then email, then id), and omitting sort preserves the name-asc default

#### Scenario: Invalid filter input is ignored
- **WHEN** an admin lists members with an invalid filter or sort value (unknown enum, malformed date, inverted range end, unknown sort key)
- **THEN** the invalid predicate is ignored without error and remaining valid predicates still apply

### Requirement: Membership HQ list and detail pages
The system SHALL provide SSR admin pages at `/:locale/admin/users` and `/:locale/admin/users/:id` that are ADMIN-only and `noindex`. The list page SHALL show one Member column (display name linked to member detail on line one, email on line two), Role, Subscription, Credits, Bookings, Event opens, Created (registration date, Europe/Berlin calendar day), and Actions. Every data column SHALL be sortable ascending/descending via header links that preserve active filters. A single SSR GET filter bar SHALL offer name/email search via `q`, role and subscription dropdowns (subscription includes all five statuses plus no-subscription), numeric min/max for credits, bookings, and event opens, and a from/to registration date range, plus a reset-filters link. Filters, sort, and pagination SHALL compose through query params; invalid filter or sort input SHALL be ignored without error. The list SHALL paginate results. The detail page SHALL show preferences, history counts, and available behavior analytics fields without inventing missing metrics, and SHALL expose links to forthcoming mutation paths under `/:locale/admin/users/:id/*` (adjust-credits, freeze, comp-ticket, refund). Soft-deleted or unknown members SHALL yield a not-found response on detail.

#### Scenario: Open members list
- **WHEN** an admin opens Membership HQ at `/:locale/admin/users`
- **THEN** they see one Member column (name link plus email line), role, subscription status, credits, booking count, event-open count, and Created date, sorted by display name then email by default

#### Scenario: Search and filter members
- **WHEN** an admin submits a name/email query, role filter, subscription filter, numeric min/max, and/or created from/to range on the members list
- **THEN** the list shows only matching non-deleted members and preserves filters across sort and pagination

#### Scenario: Sort members via header links
- **WHEN** an admin activates a data-column header sort link
- **THEN** rows reorder by that column and direction (same column toggles direction; a new column uses member/role/subscription to asc and credits/bookings/event-opens/created to desc) with a deterministic tiebreak (display name, then email, then id), and active filters are preserved

#### Scenario: Sort and filter compose through pagination
- **WHEN** an admin filters by subscription and sorts by Created desc, then moves to page 2
- **THEN** page 2 keeps the same filter and sort with correctly clamped results

#### Scenario: Reset filters
- **WHEN** an admin activates the reset-filters link
- **THEN** the list returns to the unfiltered default sort with page reset

#### Scenario: Invalid filter input is ignored
- **WHEN** an admin lists members with an invalid filter or sort value (unknown enum, malformed date, inverted range end, unknown sort key)
- **THEN** the invalid predicate is ignored without error and remaining valid predicates still apply

#### Scenario: Open member detail
- **WHEN** an admin opens a member detail page at `/:locale/admin/users/:id`
- **THEN** preferences, history counts, and available behavior analytics are visible, with empty states when data is sparse

#### Scenario: Membership HQ is admin-only and noindex
- **WHEN** a non-admin requests `/admin/users` or `/admin/users/:id`, or an admin views those pages
- **THEN** non-admins are denied access and admin responses include `robots: noindex`

#### Scenario: Detail links to mutation paths
- **WHEN** an admin views a member detail page
- **THEN** links to adjust-credits, freeze, comp-ticket, and refund paths for that member id are present

### Requirement: Admin credit adjust and refund
The system SHALL allow admins to change a member credit balance with a reason via `ADMIN_ADJUST` ledger entries and to issue support `REFUND` ledger entries decoupled from booking cancellation. Zero-amount adjustments MUST be rejected. Credit balance MUST remain non-negative. Refund amounts MUST be positive.

#### Scenario: Adjust credits
- **WHEN** an admin adjusts credits with a non-zero amount and reason
- **THEN** the balance updates and an `ADMIN_ADJUST` ledger row is recorded with the new `balance_after`

#### Scenario: Reject zero adjustment
- **WHEN** an admin attempts to adjust credits by exactly 0
- **THEN** the adjustment is rejected and the balance and ledger are unchanged

#### Scenario: Reject adjustment that would go negative
- **WHEN** an admin adjusts credits by a negative amount greater than the member's current balance
- **THEN** the adjustment is rejected and the balance and ledger are unchanged

#### Scenario: Manual refund
- **WHEN** an admin issues a manual credit refund with a positive amount and description
- **THEN** the member's credit balance increases by that amount and a `REFUND` ledger row is recorded, without cancelling any booking

### Requirement: Admin freeze and unfreeze
The system SHALL set subscription status to `UNPAID` on freeze and `ACTIVE` on unfreeze while preserving plan, payment method, billing address, and Stripe ids, independent of Stripe `PAST_DUE` handling. Freeze SHALL apply only from `ACTIVE`; unfreeze SHALL apply only from `UNPAID`.

#### Scenario: Freeze active member
- **WHEN** an admin freezes a member with `ACTIVE` subscription
- **THEN** status becomes `UNPAID` and Stripe identifiers, plan, payment method, and billing address remain intact

#### Scenario: Unfreeze frozen member
- **WHEN** an admin unfreezes a member whose subscription status is `UNPAID`
- **THEN** status becomes `ACTIVE` without clearing Stripe identifiers

### Requirement: Admin member mutation pages
The system SHALL expose dedicated SSR pages with form POST for adjust-credits, freeze/unfreeze, comp-ticket, and refund under `/:locale/admin/users/:id/*`, restricted to ADMIN, with `robots: noindex`, and MUST NOT use client-only mutation modals. Successful mutations SHALL redirect back to the member detail page. Domain validation failures SHALL re-render the same page with an on-page error message.

#### Scenario: Adjust credits via page
- **WHEN** an admin submits the adjust-credits form with a non-zero integer amount and a reason
- **THEN** the domain adjust runs and the admin is redirected to member detail with the updated balance reflected

#### Scenario: Freeze or unfreeze via page
- **WHEN** an admin confirms freeze on an ACTIVE member or unfreeze on an UNPAID member
- **THEN** the subscription status updates via the billing freeze helpers and the admin returns to member detail

#### Scenario: Comp ticket via page
- **WHEN** an admin submits the comp-ticket form selecting an event for the member
- **THEN** a confirmed booking is created through the shared booking path with `skipCreditCharge` and the admin returns to member detail

#### Scenario: Manual refund via page
- **WHEN** an admin submits the refund form with a positive amount and a reason
- **THEN** a `REFUND` ledger entry is written, credits increase, and the admin returns to member detail

#### Scenario: Mutation pages are admin-only
- **WHEN** a non-admin requests any `/:locale/admin/users/:id/{adjust-credits|freeze|comp-ticket|refund}` path
- **THEN** access is denied

### Requirement: Membership HQ Ladle and Playwright coverage
The system SHALL provide Ladle stories for Membership HQ list/detail (existing or extended) and for adjust-credits, freeze, refund, and comp-ticket mutation confirm forms under `apps/web/app/components/admin/`. The Membership HQ list stories SHALL cover the shipped filter-table layout: one merged Member column (display name linked to member detail on line one, email on line two), Created registration-date column (Europe/Berlin calendar day, including empty), sortable header states, filtered and filtered-empty states, in DE and EN. Playwright SHALL cover `admin-users.feature` scenarios in `e2e/specs/admin-users.spec.ts` with verbatim titles and proximity selectors, exercising SSR list/detail and mutation pages (detail panel Gherkin maps to `/admin/users/:id` + linked form pages) plus merged-cell display, Created column, sortable headers, every column filter (subscription enum, credits/bookings/event-opens numeric ranges, created date range) composing with sort, pagination, and reset. Soft-deleted members remain out of list/detail success paths.

#### Scenario: Mutation confirm stories load
- **WHEN** Ladle is started after this change
- **THEN** adjust-credits, freeze (freeze/unfreeze/unavailable), refund, and comp-ticket story states render without runtime errors

#### Scenario: Admin-users scenarios are executable
- **WHEN** `bun run test:e2e -- e2e/specs/admin-users.spec.ts` runs with admin credentials and `DATABASE_URL` available
- **THEN** list, search, summary, detail, adjust, freeze/unfreeze, and comp-ticket scenarios pass, or skip only with documented env prerequisites

#### Scenario: Filter-table stories cover merged cells and Created dates
- **WHEN** Ladle builds the Membership HQ list stories
- **THEN** merged Member cells (name link + muted email line), Created dates (set and empty), sorted-header states, filtered states, and a filtered-empty state render in DE and EN without runtime errors

#### Scenario: Filter coverage stays green
- **WHEN** `e2e/specs/admin-users.spec.ts` runs with admin credentials and `DATABASE_URL`
- **THEN** the filter/sort scenarios (merged member display, Created column, sortable headers, every column filter composing with pagination and reset) pass and the matrix shows no silent skips

### Requirement: Admin member detail shows interests_other
When a member profile includes a non-empty `interests_other` value, the Membership HQ detail page at `/:locale/admin/users/:id` SHALL display that free-text interest alongside other preference fields. When `interests_other` is null or empty, the detail page SHALL omit the field or show the same empty-state pattern used for other sparse preference values.

#### Scenario: Detail shows Other interest text
- **WHEN** an admin opens a member detail page for a user whose profile has `interests` containing `Other` and a non-empty `interests_other`
- **THEN** the free-text interest is visible in the preferences section

#### Scenario: Detail omits empty interests_other
- **WHEN** an admin opens a member detail page for a user with no `interests_other`
- **THEN** the preferences section does not invent a placeholder value for that field

### Requirement: Admin member detail preference intel matches preference options

The Membership HQ detail page at `/:locale/admin/users/:id` SHALL present member preference intel using the shipped allowlists and fields: location as stored `country` / `city` / `zip_code` (Germany/Berlin + Berlin PLZ for this release) instead of a districts multi-select list; preferred languages from the member language catalog (not Non-Verbal); `interests_other` when set (per existing interests_other requirement). The preference row label SHALL describe zip/location (not “Districts” / “Bezirke”). When legacy `max_distance` is non-null, Membership HQ detail SHALL show the travel distance in kilometers as remnant intel. When `max_distance` is null, the travel-distance / radius row MUST be omitted or shown as unset — the page MUST NOT invent a numeric value. The page MUST NOT invent Bezirk multi-select chrome or informal district shorthand labels for missing data.

#### Scenario: Detail shows travel distance when set

- **WHEN** an admin opens a member detail page for a user whose `max_distance` is a stored integer km
- **THEN** the preferences section shows the travel distance in km

#### Scenario: Detail omits null travel distance

- **WHEN** an admin opens a member detail page for a user whose `max_distance` is null
- **THEN** the preferences section does not show travel distance / radius as an active preference with an invented value

#### Scenario: Detail shows zip location and languages

- **WHEN** an admin opens a member detail page for a user with a Berlin `zip_code` under Germany/Berlin and preferred language codes from the member catalog
- **THEN** the stored zip (and country/city when shown) and language values are visible in the preferences section
- **AND** the page does not present a districts multi-select list as the location preference
- **AND** the page does not invent Non-Verbal or informal district shorthand labels for missing data

### Requirement: Product Gherkin and e2e match zip preference intel

`docs/product/features/admin-users.feature` and `e2e/specs/admin-users.spec.ts` SHALL describe Membership HQ member detail preference intel using location as stored `country` / `city` / `zip_code` (Germany/Berlin + Berlin PLZ for this release), not a districts multi-select list, and optional legacy travel distance when `max_distance` is non-null. Scenarios SHALL note that null `max_distance` means no travel-distance row (omit or unset — MUST NOT invent a value) and that `max_distance` is not actively collected in onboarding/Vibes. Playwright titles SHALL match Gherkin verbatim; selectors SHALL remain proximity/layout only. Coverage-matrix rows SHALL be updated (pass or named skip).

#### Scenario: Admin-users feature file describes zip and optional legacy travel-distance intel

- **WHEN** an implementer reads the expand-detail / intel scenario in `docs/product/features/admin-users.feature`
- **THEN** preferences include zip/location (and country/city when shown) instead of districts
- **AND** the scenario states that when `max_distance` is null there is no travel-distance / radius preference row
- **AND** the scenario treats non-null `max_distance` as legacy remnant intel (not an actively collected preference)

#### Scenario: Admin-users e2e asserts zip preference row

- **WHEN** Playwright runs the expand-detail / intel scenario against a member with a Berlin zip
- **THEN** the detail preferences section shows the zip (and does not present a districts multi-select list as location)

#### Scenario: Admin-users docs allow legacy travel distance when set

- **WHEN** an implementer reads admin-users product Gherkin and coverage-matrix notes after this step
- **THEN** showing travel distance in km for non-null `max_distance` remains consistent with shipped Membership HQ intel
- **AND** notes do not claim travel distance is still collected in onboarding or Vibes
