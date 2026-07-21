## ADDED Requirements

### Requirement: Map popup dismiss control

Event map popups SHALL provide a close control with a sufficiently large hit target for pointer and touch use (approximately 44×44 CSS pixels minimum, or an equivalent padded control). The control SHALL remain keyboard-accessible and SHALL NOT regress popup focus behavior (`focusAfterOpen` stays off; focus-visible ring on the close control remains). Activating the control SHALL dismiss the popup. Product docs (`event-discovery.feature` and/or `ui-component-map.md` map notes) SHALL mention the large close control. Playwright MAY assert close visibility/activation via proximity or stable MapLibre class selectors when a popup is already openable after consent — MUST NOT use pixel OCR.

#### Scenario: Map popup close is easy to activate

- **WHEN** a user opens an event popup on the map (member map or detail LOCATION map) with cookie consent accepted
- **THEN** a close control is visible with a large enough hit target to activate reliably
- **AND** activating it dismisses the popup

#### Scenario: Map popup close stays keyboard-accessible

- **WHEN** a keyboard user focuses the map popup close control
- **THEN** a focus-visible affordance is present
- **AND** activating the control (or Esc, where MapLibre supports it) dismisses the popup

#### Scenario: Docs and e2e mention map close without tile OCR

- **WHEN** an agent updates product discovery docs or Playwright for map popups
- **THEN** the large close hit target is documented
- **AND** e2e prefers DOM/CSS or role proximity on `.maplibregl-popup-close-button` (or equivalent), skipping when the consent gate blocks the map in CI
