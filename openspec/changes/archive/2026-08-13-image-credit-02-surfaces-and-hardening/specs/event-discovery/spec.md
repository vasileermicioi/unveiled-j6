## ADDED Requirements

### Requirement: Public captions for image credit
Public event detail SHALL show `images.credit` as a caption under the primary hero when non-empty, and in the gallery lightbox for that photo when non-empty. The caption SHALL be the stored string as-is (no automatic `Foto:` / `Photo:` prefix). Compact EventCards and map popups SHALL NOT show credit. When the partner logo has credit, DETAILS SHALL show it as a muted caption under the logo; when empty, no caption. Guests and members see the same ungated captions. `docs/product/features/event-discovery.feature` SHALL include scenarios titled `Hero shows credit`, `Gallery photo credit in lightbox`, `Empty credit omitted`, and `Cards omit credit`. Playwright SHALL use those titles verbatim. The Event detail entry in `docs/product/ui/ui-component-map.md` SHALL note hero, lightbox, and optional partner-logo captions.

#### Scenario: Hero shows credit
- **WHEN** I open a public event whose primary image has credit
- **THEN** I see that credit under the primary image

#### Scenario: Gallery photo credit in lightbox
- **WHEN** a gallery image has credit "Photo: Ada"
- **AND** I open that photo in the public gallery lightbox
- **THEN** I see the credit caption

#### Scenario: Empty credit omitted
- **WHEN** an image has NULL credit
- **THEN** public event detail does not show a credit caption for that image

#### Scenario: Cards omit credit
- **WHEN** I view Discover or the member feed
- **THEN** event cards do not show image credit
