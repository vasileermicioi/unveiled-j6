# Design System

Theme Overview Ladle catalog, shared brand-theme CSS, DS story ownership, and HeroUI/theme markup rules for `@unveiled/ui`.

## Requirements

### Requirement: Theme Overview Ladle story
The system SHALL provide a Theme Overview Ladle story under `packages/ui` (`@unveiled/ui`) that renders the production Uber yellow brand contract for implementers adjusting theme tokens.

#### Scenario: Theme Overview shows brand tokens
- **WHEN** an implementer opens the Theme Overview story in Ladle
- **THEN** they see brand yellow page background `#FAFF86`, near-zero radius bordered surfaces without drop shadows, Work Sans typography samples, primary and secondary CTAs, and representative chips plus a sample card surface

#### Scenario: Theme Overview uses HeroUI markup
- **WHEN** an implementer inspects the Theme Overview story source
- **THEN** the story uses HeroUI primitives (or compositions built from them) with Tailwind limited to layout/spacing, and primary/secondary CTAs use the theme button classes (`button button--primary`, `button button--secondary`)

### Requirement: UI-package story theme loading
The system SHALL load theme CSS for `@unveiled/ui` Ladle stories without treating a permanent undocumented cross-import of `apps/web` CSS as the design-system home. Production token documentation remains in `docs/product/ui/design-tokens.md` and `DESIGN.md`; applied styles SHALL come from a package-owned theme entry and/or a shared theme module that both `apps/web` and `packages/ui` consume.

#### Scenario: ThemeDecorator does not own an undocumented apps/web CSS path
- **WHEN** an implementer opens `ThemeDecorator` (or the UI-package Ladle theme entry)
- **THEN** theme CSS resolves from a path owned or documented under `@unveiled/ui` (shared theme entry preferred), not solely from an undocumented permanent import of `apps/web/app/styles/globals.css`

#### Scenario: Stories load without broken theme resolution
- **WHEN** an implementer runs `bun run stories` (or `bun --filter @unveiled/ui stories`)
- **THEN** Theme Overview loads without CSS/module resolution errors and renders the brand contract samples

### Requirement: Design-system story ownership
The system SHALL keep Ladle stories for design-system primitives under `packages/ui` only. Route-specific page compositions and app-shell compositions MAY keep optional stories in `apps/web` when documented as page-level in `docs/product/ui/design-system.md`.

#### Scenario: No orphan primitive stories in the app package
- **WHEN** a shared design-system primitive is documented in `ui-component-map.md` as owned by `@unveiled/ui`
- **THEN** its Ladle stories live under `packages/ui` and are not maintained solely under `apps/web`

#### Scenario: Page compositions may stay in apps/web
- **WHEN** a story covers a route-specific page composition or app-shell chrome (e.g. Discover page, admin list shell, onboarding step, navbar)
- **THEN** that story MAY remain under `apps/web` provided ownership docs list it as an allowed page-level story group

### Requirement: HeroUI-only markup and theme-only visuals
The system SHALL use HeroUI primitives (or compositions built from them) in routes and UI components, and SHALL apply colors, borders, radius, shadows, and typography via theme tokens — not ad-hoc per-route Tailwind visual utilities — except documented exceptions (structured-data script tags, images inside wrappers, map canvas hosts).

#### Scenario: Audit produces fixes or named deferrals
- **WHEN** Phase 5.5 step 02 completes
- **THEN** raw HTML / non-theme styling violations are either fixed or listed with file path, reason, and target phase

#### Scenario: Documented exceptions remain allowed
- **WHEN** a route needs JSON-LD, an image inside a HeroUI wrapper, or a MapLibre canvas host element
- **THEN** those documented exception elements are allowed without being treated as ownership failures

### Requirement: Phase 6 Ladle shells
The design system / app storybook SHALL include Ladle stories for booking confirmation, ticket card, and membership checkout shell states used in Phase 6. These page-composition stories SHALL live under `apps/web` (not as `@unveiled/ui` primitives) and SHALL render using HeroUI + theme tokens (yellow backdrop, Work Sans, primary/secondary CTAs).

#### Scenario: Stories render brand-compliant shells
- **WHEN** an implementer opens the Phase 6 Ladle stories
- **THEN** booking confirm, ticket card, and membership checkout shells render using HeroUI + theme tokens (yellow backdrop, Work Sans, primary/secondary CTAs)

#### Scenario: Membership checkout states are covered
- **WHEN** an implementer opens the membership page Ladle stories
- **THEN** they can view guest, start-checkout, already-active, and frozen/payment-stopped shell states (and past-due messaging via the book-gate story when that messaging is not on the membership page)
