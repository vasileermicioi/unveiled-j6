## ADDED Requirements

### Requirement: Admin preview of Browse and Discover cards
Admins SHALL open `/:locale/admin/events/:id/preview/browse` to see the event as a single event card in the Browse events grid (member viewer, no save form) and `/:locale/admin/events/:id/preview/discover` to see it as a single event card in the Discover featured grid (guest viewer). Both pages SHALL be `noindex`, ADMIN-only, and available for unpublished events and for events that are not on the featured list. Card CTAs SHALL go to the admin detail preview (`/:locale/admin/events/:id/preview`), not to public `/:locale/events/:id`. Neither page SHALL list other catalog events, load featured/partner catalogs, or run save/book/waitlist POST. Preview chrome SHALL switch among Detail, Browse events, and Discover via SSR links. A missing event SHALL return the same admin 404 as other event confirm pages.

#### Scenario: Preview browse card
- **WHEN** an admin opens the browse preview for an event
- **THEN** they see one event card with the same title, zip, and next datetime treatment as member `/events`
- **AND** the page does not list other catalog events

#### Scenario: Preview discover card
- **WHEN** an admin opens the discover preview for an event that is not featured
- **THEN** they still see one Discover-styled event card
- **AND** live `/:locale/discover` is unchanged

#### Scenario: Card preview CTA stays in admin preview
- **WHEN** an admin follows the card CTA on browse or discover preview
- **THEN** they land on `/:locale/admin/events/:id/preview`
- **AND** they do not open public `/:locale/events/:id`

#### Scenario: Non-admin cannot open card previews
- **WHEN** a guest or USER requests `/:locale/admin/events/:id/preview/browse` or `.../preview/discover`
- **THEN** access is denied per existing admin route guards (guest → login, USER → locale home)

#### Scenario: Preview chrome switches surfaces
- **WHEN** an admin is on any of the three event preview pages
- **THEN** they can switch among Detail, Browse events, and Discover via links
- **AND** the current surface is marked as the active page
