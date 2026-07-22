## MODIFIED Requirements

### Requirement: Public event detail gallery

The public event detail page SHALL show an image gallery at the end of the page when the event has one or more gallery images. Activating a gallery photo SHALL open a slider that allows previous/next navigation through the gallery. When the event has zero gallery images, the public detail page SHALL omit the gallery section (no empty-state block). The gallery SHALL be visible without authentication on the same public `/:locale/events/:id` surface as the rest of the detail content. Gallery display SHALL NOT require Discover-featured membership when gallery images exist. Expanding Event JSON-LD / Open Graph to include all gallery images is out of scope for this requirement unless a later SEO change mandates it. Product Gherkin in `docs/product/features/event-discovery.feature` and the Event detail entry in `docs/product/ui/ui-component-map.md` SHALL describe the end-of-page gallery and slider. After demo seed has run, at least one upcoming featured event SHALL have multiple gallery images visible on its public detail page.

#### Scenario: Guest views gallery on event detail

- **WHEN** a guest opens a public event detail URL for an event that has gallery images
- **THEN** they see a gallery section after the main detail content
- **AND** they can open a photo slider with previous and next navigation

#### Scenario: No gallery images

- **WHEN** an event has zero gallery images
- **THEN** the public detail page omits the gallery section

#### Scenario: Featured demo event includes gallery

- **WHEN** demo seed has run
- **THEN** at least one upcoming featured event has multiple gallery images visible on its public detail page

#### Scenario: Product docs describe public gallery

- **WHEN** an agent reads `docs/product/features/event-discovery.feature` and the Event detail entry in `ui/ui-component-map.md`
- **THEN** they describe the end-of-page gallery thumbnails and prev/next slider for non-empty galleries
