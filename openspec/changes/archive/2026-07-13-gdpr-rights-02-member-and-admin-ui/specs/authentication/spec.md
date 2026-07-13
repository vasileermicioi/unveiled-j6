## ADDED Requirements

### Requirement: GDPR profile and admin pages
The system SHALL provide SSR pages at `/:locale/profile/data-export`, `/:locale/profile/delete-account`, and `/:locale/admin/users/:id/delete-account` (`noindex`) that perform export download and anonymizing deletion via form POST (admin) or dedicated request flow (member), without client-only mutation modals. Member and admin deletion SHALL call the shared `anonymizeUserAccount` path. Export SHALL use the shared `buildUserDataExport` path and return a downloadable summary synchronously.

#### Scenario: Member export download
- **WHEN** a signed-in member requests a data export from `/:locale/profile/data-export`
- **THEN** they receive a downloadable JSON summary of their profile, bookings, and credit ledger generated on demand

#### Scenario: Member delete confirm
- **WHEN** a member confirms account deletion on `/:locale/profile/delete-account`
- **THEN** anonymization runs, the session ends, and prior credentials no longer work

#### Scenario: Admin assisted delete
- **WHEN** an admin confirms delete-account for a member on `/:locale/admin/users/:id/delete-account`
- **THEN** the same anonymization behavior as self-service applies and the admin remains signed in

#### Scenario: GDPR pages are noindex
- **WHEN** a crawler or browser requests any of the GDPR HTML pages
- **THEN** the response is marked `noindex`
