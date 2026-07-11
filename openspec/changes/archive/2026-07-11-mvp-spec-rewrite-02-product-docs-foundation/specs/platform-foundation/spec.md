## ADDED Requirements

### Requirement: UI package is the design system

`packages/ui` (`@unveiled/ui`) SHALL be the design-system package: shared HeroUI-composed primitives, Ladle story home including a Theme Overview story for the Uber yellow / near-zero-radius theme, with page-level compositions allowed in `apps/web` only when they are route-specific. Product docs at `docs/product/ui/design-system.md` SHALL state ownership rules, ban raw HTML in routes/UI components (HeroUI primitives only), and ban splitting design-system stories into `apps/web` without those ownership rules. Visual rules SHALL match the Uber reskin: page background `#FAFF86`, near-zero radius, no drop shadows, Work Sans, theme-only visual styling via tokens/`globals.css`.

#### Scenario: Theme Overview story is specified

- **WHEN** an implementer runs the design-system Ladle catalog
- **THEN** a Theme Overview story exists (as required by `docs/product/ui/design-system.md`) showing brand yellow background, borders/radius, typography, and primary/secondary buttons for theme adjustment

#### Scenario: Design-system doc exists

- **WHEN** an agent lists `docs/product/ui/` after this change
- **THEN** `design-system.md` exists and names `@unveiled/ui` as the design-system package and Ladle home for DS primitives

#### Scenario: Page compositions stay route-specific

- **WHEN** an agent reads `docs/product/ui/design-system.md`
- **THEN** route-specific page compositions may live in `apps/web`, while shared primitives and their Ladle stories belong in `@unveiled/ui`
