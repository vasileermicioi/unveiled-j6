## ADDED Requirements

### Requirement: Phase 0–4 component story coverage

Every UI component shipped in Phases 0–4 SHALL have at least one Ladle story per visual state documented in `ui/ui-component-map.md`.

#### Scenario: EventCard CTA states are story-isolated

- **WHEN** a developer opens `EventCard` stories in Ladle
- **THEN** guest, waitlist, unlock, and book CTA labels are each visible in a dedicated story
- **AND** the guest story shows "See details" regardless of sold-out capacity

#### Scenario: Page-level components are story-isolated

- **WHEN** a developer browses `apps/web` component stories
- **THEN** marketing pages, auth chrome, onboarding steps, and admin list layouts each render without requiring a live session or database
