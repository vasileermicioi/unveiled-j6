## ADDED Requirements

### Requirement: Membership HQ list and detail pages
The system SHALL provide SSR admin pages at `/:locale/admin/users` and `/:locale/admin/users/:id` that are ADMIN-only and `noindex`. The list page SHALL show members sorted by display name then email, support search by name/email via `q` and optional role filter via query param, paginate results, and show summary columns for role, subscription status, credits, booking count, and event-open count. The detail page SHALL show preferences, history counts, and available behavior analytics fields without inventing missing metrics, and SHALL expose links to forthcoming mutation paths under `/:locale/admin/users/:id/*` (adjust-credits, freeze, comp-ticket, refund). Soft-deleted or unknown members SHALL yield a not-found response on detail.

#### Scenario: Open members list
- **WHEN** an admin opens Membership HQ at `/:locale/admin/users`
- **THEN** they see members sorted by name then email with summary columns for role, subscription status, credits, booking count, and event-open count

#### Scenario: Search and filter members
- **WHEN** an admin submits a name/email query and/or role filter on the members list
- **THEN** the list shows only matching non-deleted members and preserves filters across pagination

#### Scenario: Open member detail
- **WHEN** an admin opens a member detail page at `/:locale/admin/users/:id`
- **THEN** preferences, history counts, and available behavior analytics are visible, with empty states when data is sparse

#### Scenario: Membership HQ is admin-only and noindex
- **WHEN** a non-admin requests `/admin/users` or `/admin/users/:id`, or an admin views those pages
- **THEN** non-admins are denied access and admin responses include `robots: noindex`

#### Scenario: Detail links to mutation paths
- **WHEN** an admin views a member detail page
- **THEN** links to adjust-credits, freeze, comp-ticket, and refund paths for that member id are present
