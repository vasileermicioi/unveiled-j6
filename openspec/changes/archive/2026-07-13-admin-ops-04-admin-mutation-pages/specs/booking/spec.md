## ADDED Requirements

### Requirement: Admin cancel booking page
The system SHALL provide `/:locale/admin/bookings/:id/cancel` as an SSR confirm + POST page for ADMIN users (`robots: noindex`) that cancels a `CONFIRMED` booking with a required reason, restores capacity, triggers waitlist processing, and MUST NOT refund credits as part of cancellation. The page MUST NOT use client-only mutation modals. Membership HQ member detail SHALL expose links to cancel confirmed bookings for that member.

#### Scenario: Cancel via admin page
- **WHEN** an admin submits cancel with a reason for a confirmed booking
- **THEN** booking status becomes `CANCELLED`, capacity and waitlist side effects run, credits are unchanged by the cancel, and the admin is redirected away from the confirm page

#### Scenario: Cancel page rejects non-confirmed booking
- **WHEN** an admin opens or submits cancel for a booking that is not `CONFIRMED`
- **THEN** the cancel does not change booking status and an on-page error or not-allowed state is shown

#### Scenario: Cancel page is admin-only
- **WHEN** a non-admin requests `/admin/bookings/:id/cancel`
- **THEN** access is denied
