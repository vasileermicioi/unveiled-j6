## ADDED Requirements

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
