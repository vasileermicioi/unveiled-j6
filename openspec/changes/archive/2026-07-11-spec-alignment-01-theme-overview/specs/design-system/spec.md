## ADDED Requirements

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
