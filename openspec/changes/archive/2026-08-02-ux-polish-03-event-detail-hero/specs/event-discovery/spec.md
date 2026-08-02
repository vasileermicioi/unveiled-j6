## ADDED Requirements

### Requirement: Event detail primary hero framing

Public event detail SHALL present the primary image in a full-width rectangular hero frame, horizontally centered, not stretched to fill the frame. `max-width: 100%` downscale to avoid overflow is allowed. The primary hero remains `events.image_id` (gallery images MUST NOT replace it). Product UI docs (`docs/product/ui/ui-component-map.md` Event detail entry) SHALL describe this framing contract.

#### Scenario: Primary hero is centered without stretch-to-fill

- **WHEN** a guest or member opens a public event detail page that has a primary image
- **THEN** the primary image appears inside a full-width rectangular hero band
- **AND** the image is horizontally centered and not stretched to fill the band
- **AND** wide images may downscale with `max-width: 100%` (or equivalent) so they do not overflow

#### Scenario: UI component map documents hero framing

- **WHEN** an agent reads the Event detail entry in `docs/product/ui/ui-component-map.md`
- **THEN** it states that the primary hero uses a full-width frame with a centered, non-stretch-to-fill image (`max-width: 100%` downscale allowed)
