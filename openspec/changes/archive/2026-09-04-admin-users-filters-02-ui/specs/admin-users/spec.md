## MODIFIED Requirements

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
