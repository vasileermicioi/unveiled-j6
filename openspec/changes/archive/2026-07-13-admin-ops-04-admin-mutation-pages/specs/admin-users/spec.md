## ADDED Requirements

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
