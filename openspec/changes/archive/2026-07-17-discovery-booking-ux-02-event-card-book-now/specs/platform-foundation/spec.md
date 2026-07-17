## MODIFIED Requirements

### Requirement: Phase 0–4 component story coverage

Every UI component shipped in Phases 0–4 SHALL have at least one Ladle story per visual state documented in `ui/ui-component-map.md` (CTA matrix for EventCard follows this change’s Book Now / Waitlist contract until product docs catch up in hardening).

#### Scenario: EventCard CTA states are story-isolated

- **WHEN** a developer opens `EventCard` stories in Ladle
- **THEN** guest Book Now, member Book Now (including inactive subscription), and Waitlist CTA labels are each visible in a dedicated story
- **AND** the guest bookable story shows "Book Now" (or Bin dabei) when capacity remains
- **AND** a sold-out story shows "Waitlist" (or Warteliste)

#### Scenario: Page-level components are story-isolated

- **WHEN** a developer browses `apps/web` component stories
- **THEN** marketing pages, auth chrome, onboarding steps, and admin list layouts each render without requiring a live session or database
