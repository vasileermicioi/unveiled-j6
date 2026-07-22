## ADDED Requirements

### Requirement: Public event detail gallery

The public event detail page SHALL show an image gallery at the end of the page when the event has one or more gallery images. Activating a gallery photo SHALL open a slider that allows previous/next navigation through the gallery. When the event has zero gallery images, the public detail page SHALL omit the gallery section (no empty-state block). The gallery SHALL be visible without authentication on the same public `/:locale/events/:id` surface as the rest of the detail content. Gallery display SHALL NOT require Discover-featured membership when gallery images exist. Expanding Event JSON-LD / Open Graph to include all gallery images is out of scope for this requirement unless a later SEO change mandates it.

#### Scenario: Guest views gallery on event detail

- **WHEN** a guest opens a public event detail URL for an event that has gallery images
- **THEN** they see a gallery section after the main detail content
- **AND** they can open a photo slider with previous and next navigation

#### Scenario: No gallery images

- **WHEN** an event has zero gallery images
- **THEN** the public detail page omits the gallery section
