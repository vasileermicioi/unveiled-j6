## ADDED Requirements

### Requirement: EventCard hover affordance

On devices that support hover, the `EventCard` SHALL (1) colorize the grayscale cover image, (2) reveal the availability strip showing remaining capacity and ticket type (where space allows), and (3) emphasize the card with a stronger flat border or theme accent edge. The card SHALL NOT use drop shadows or hard-offset shadows for elevation. Hover transitions on the image and availability strip SHALL be disabled or near-instant when the user prefers reduced motion.

#### Scenario: Pointer hover reveals availability

- **WHEN** a user with a hover-capable pointer moves over an EventCard
- **THEN** the availability strip becomes visible and the card border emphasis increases without a box-shadow

#### Scenario: Pointer hover colorizes cover image

- **WHEN** a user with a hover-capable pointer moves over an EventCard that shows a cover image
- **THEN** the cover image leaves grayscale and appears in full color

#### Scenario: Reduced motion prefers less transition

- **WHEN** the user has `prefers-reduced-motion: reduce`
- **THEN** hover transitions on the EventCard image and availability strip are disabled or near-instant
