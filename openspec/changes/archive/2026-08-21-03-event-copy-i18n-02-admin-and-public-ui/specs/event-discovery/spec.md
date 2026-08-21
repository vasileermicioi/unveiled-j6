## ADDED Requirements

### Requirement: Public event copy follows URL locale
Public event detail, EventCards, map popups, Discover featured, saved list, waitlist join/cancel chrome, and event SEO/JSON-LD SHALL display `title_*` and `description_*` for the active `/:locale` (fallback: other locale, then canonical). Description SHALL be locale-resolved on public detail and in SEO/JSON-LD only (cards and map popups show title). `/de/events/:id` and `/en/events/:id` MAY show different title/description for the same event. Each locale URL’s HTML body, document title, meta description, and JSON-LD `name` / `description` MUST match that locale. Document title SHALL be `{resolved title} at {partner} — Unveiled Berlin`. Meta description and JSON-LD `description` SHALL remain a plain-text extract of the **resolved** Markdown description (existing truncate). `hreflang` already points at the other locale URL and SHALL NOT be used as an excuse to serve the same body copy on both URLs.

#### Scenario: Guest sees English title on /en
- **WHEN** a guest opens `/en/events/:id` for an event with `title_en = "Concert"` and `title_de = "Konzert"`
- **THEN** the identity title is "Concert"

#### Scenario: Guest sees German title on /de
- **WHEN** a guest opens `/de/events/:id` for that same event
- **THEN** the identity title is "Konzert"

#### Scenario: English detail uses English description
- **WHEN** a guest opens `/en/events/:id` for an event with distinct `description_en` and `description_de`
- **THEN** the identity description is the English Markdown (GFM-rendered)
- **AND** the page meta description and JSON-LD `description` are derived from that English Markdown

#### Scenario: EventCard title follows feed locale
- **WHEN** a member opens `/en/events` (or Discover / saved) for an event with `title_en = "Concert"` and `title_de = "Konzert"`
- **THEN** the EventCard title is "Concert"

#### Scenario: Map popup title follows map locale
- **WHEN** a member opens `/en/events/map` for that same event
- **THEN** the map popup title is "Concert"

#### Scenario: Document title matches page locale
- **WHEN** a guest opens `/en/events/:id` for an event titled "Concert" at partner "Venue"
- **THEN** the document title contains "Concert at Venue"
