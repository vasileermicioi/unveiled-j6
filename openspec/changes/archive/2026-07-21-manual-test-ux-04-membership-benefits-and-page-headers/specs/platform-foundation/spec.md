## ADDED Requirements

### Requirement: Shared page section headers on booking flows
Member flows that use the default on-yellow page title pattern SHALL use the shared `PageSectionHeader` (or documented equivalent), including booking and waitlist pages. Pages SHALL NOT invent one-off bare `Heading` title chrome that diverges from that pattern without an explicit product exception. The membership marketing hero card MAY retain its bordered hero composition; this requirement targets transactional member pages (book, confirm, waitlist), not the membership perk hero.

#### Scenario: Book event uses shared header
- **WHEN** a member opens the book-event page
- **THEN** the title/eyebrow treatment matches the shared page-header pattern used on Discover/FAQ-style surfaces

#### Scenario: Booking confirmation uses shared header
- **WHEN** a member opens the booking confirmation page
- **THEN** the page uses `PageSectionHeader` (eyebrow + headline) rather than a bare level-1 heading stack

#### Scenario: Waitlist join uses shared header
- **WHEN** a member opens the waitlist join page
- **THEN** the page header matches the shared `PageSectionHeader` pattern
