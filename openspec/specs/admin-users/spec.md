# Admin Users

Admin-only Membership HQ: domain operations (list/search, detail aggregates, credit adjust/refund, freeze/unfreeze) plus SSR list and detail pages under `/:locale/admin/users`.

## Requirements

### Requirement: Admin member list and detail queries
The system SHALL expose admin-only domain operations to list members (sorted by name then email), filter by name/email/role, and load a member detail aggregate including preferences, history counts, and available behavior fields. Soft-deleted members (`deleted_at` set) SHALL be excluded from the list and SHALL NOT be returned as a successful detail load.

#### Scenario: List members for Membership HQ
- **WHEN** an admin requests the member list
- **THEN** all non-deleted member accounts are returned sorted by display name, then email

#### Scenario: Search members by name, email, or role
- **WHEN** an admin lists members with a search query and/or role filter
- **THEN** only members matching the name/email query and role (when provided) are returned

#### Scenario: Member detail aggregate
- **WHEN** an admin loads member detail for an existing non-deleted user
- **THEN** the result includes profile preferences, subscription status when present, history counts (bookings, waitlist, saved events), and available behavior JSON fields without inventing missing analytics

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
The system SHALL provide Ladle stories for Membership HQ list/detail (existing or extended) and for adjust-credits, freeze, refund, and comp-ticket mutation confirm forms under `apps/web/app/components/admin/`. Playwright SHALL cover `admin-users.feature` scenarios in `e2e/specs/admin-users.spec.ts` with verbatim titles and proximity selectors, exercising SSR list/detail and mutation pages (detail panel Gherkin maps to `/admin/users/:id` + linked form pages). Soft-deleted members remain out of list/detail success paths.

#### Scenario: Mutation confirm stories load
- **WHEN** Ladle is started after this change
- **THEN** adjust-credits, freeze (freeze/unfreeze/unavailable), refund, and comp-ticket story states render without runtime errors

#### Scenario: Admin-users scenarios are executable
- **WHEN** `bun run test:e2e -- e2e/specs/admin-users.spec.ts` runs with admin credentials and `DATABASE_URL` available
- **THEN** list, search, summary, detail, adjust, freeze/unfreeze, and comp-ticket scenarios pass, or skip only with documented env prerequisites
