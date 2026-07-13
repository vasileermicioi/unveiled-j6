## ADDED Requirements

### Requirement: Admin waitlist SSR surfaces
The system SHALL provide `/:locale/admin/waitlist` listing and `/:locale/admin/waitlist/:id/promote` confirm/POST pages for ADMIN users, with `robots: noindex`. The list page SHALL support optional `eventId` and `status` filters and pagination. Manual promote SHALL call the shared promote domain path (including out-of-queue support) and MUST NOT use client-only mutation modals.

#### Scenario: List admin waitlist
- **WHEN** an admin opens `/:locale/admin/waitlist` with optional event and status filters
- **THEN** matching waitlist entries are listed with status and skip-history visible and filters preserved across pagination

#### Scenario: Promote from admin waitlist
- **WHEN** an admin confirms manual promote on a `WAITING` entry
- **THEN** the shared promote domain runs and the admin sees the updated entry state on the waitlist list (or promote page error if promotion fails)

#### Scenario: Admin waitlist surfaces are admin-only
- **WHEN** a non-admin requests `/admin/waitlist` or `/admin/waitlist/:id/promote`
- **THEN** access is denied
