## ADDED Requirements

### Requirement: Partner venues continuous marquee
When the user does not prefer reduced motion, the Discover partner logo strip SHALL scroll horizontally in a continuous, seamless loop without requiring user interaction. When `prefers-reduced-motion: reduce` is set, the strip SHALL remain static (wrapped or clipped) with no auto-scrolling animation.

#### Scenario: Continuous motion for default preference
- **WHEN** a guest views Discover with multiple partner logos and no reduced-motion preference
- **THEN** the logo strip moves continuously and the sequence appears to loop without a hard cut

#### Scenario: Reduced motion disables auto-scroll
- **WHEN** the user agent prefers reduced motion
- **THEN** partner logos do not auto-scroll
