## ADDED Requirements

### Requirement: Phase 6 Ladle shells
The design system / app storybook SHALL include Ladle stories for booking confirmation, ticket card, and membership checkout shell states used in Phase 6. These page-composition stories SHALL live under `apps/web` (not as `@unveiled/ui` primitives) and SHALL render using HeroUI + theme tokens (yellow backdrop, Work Sans, primary/secondary CTAs).

#### Scenario: Stories render brand-compliant shells
- **WHEN** an implementer opens the Phase 6 Ladle stories
- **THEN** booking confirm, ticket card, and membership checkout shells render using HeroUI + theme tokens (yellow backdrop, Work Sans, primary/secondary CTAs)

#### Scenario: Membership checkout states are covered
- **WHEN** an implementer opens the membership page Ladle stories
- **THEN** they can view guest, start-checkout, already-active, and frozen/payment-stopped shell states (and past-due messaging via the book-gate story when that messaging is not on the membership page)
