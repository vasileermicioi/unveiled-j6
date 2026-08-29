## ADDED Requirements

### Requirement: Admin preview of event detail
Admins SHALL open `/:locale/admin/events/:id/preview` to see the event rendered with the same `EventDetailPage` layout as public `/:locale/events/:id`. The page SHALL be `noindex`, ADMIN-only, and available for unpublished events. Booking, waitlist, and save mutations SHALL NOT run from preview. Default chrome is the guest checkout card; `?audience=member` SHALL show booking-eligible date/credit chrome without enabling POST. A missing event SHALL return the same admin 404 as other event confirm pages. The Events catalog and event edit page SHALL offer a Preview entry to this route.

#### Scenario: Preview draft detail
- **WHEN** an admin opens preview for an unpublished event
- **THEN** they see the locale title, image, and description as on public detail
- **AND** guests opening `/events/:id` still do not see the event

#### Scenario: Preview does not book
- **WHEN** an admin is on the detail preview
- **THEN** there is no form POST that creates a booking, waitlist entry, or save row

#### Scenario: Member audience is read-only
- **WHEN** an admin opens preview with `?audience=member`
- **THEN** they see booking-eligible date and credit chrome
- **AND** the primary checkout control does not navigate to book, waitlist, or login

#### Scenario: Non-admin cannot open event preview
- **WHEN** a guest or USER requests `/:locale/admin/events/:id/preview`
- **THEN** access is denied per existing admin route guards (guest → login, USER → locale home)

#### Scenario: Preview entry from catalog and edit
- **WHEN** an admin views the Events catalog or an event edit page
- **THEN** a Preview action linking to `/:locale/admin/events/:id/preview` is available
