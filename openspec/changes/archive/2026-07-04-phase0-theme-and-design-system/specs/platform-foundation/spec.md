## ADDED Requirements

### Requirement: App-wide yellow page background

Every route SHALL render with `brand-yellow` (`#FAFF86`) as the page backdrop. White or cream surfaces float on top for cards and forms.

#### Scenario: Page background color

- **WHEN** any SSR page is rendered in Phase 0
- **THEN** the visible page background is `#FAFF86`, not `#F5F5F5` grey

#### Scenario: Body and root background

- **WHEN** the HTML document is rendered
- **THEN** `body` and/or the root layout wrapper apply `background-color: #FAFF86` (via CSS variable or utility class)

### Requirement: HeroUI Uber theme reskin

The application SHALL use HeroUI v3 with the built-in Uber preset as structural baseline, overriding only color-bearing CSS variables with Unveiled brand tokens per `docs/migration/ui/design-tokens.md`.

#### Scenario: Semantic color mapping

- **WHEN** HeroUI components render on the default layout
- **THEN** `--background` resolves to brand-yellow, `--foreground` to brand-dark, and `--border` to brand-dark

#### Scenario: Accent on yellow backdrop

- **WHEN** an accent-colored interactive element (e.g. primary Button) renders on the yellow page background
- **THEN** it retains a visible `border-brand-dark` (or equivalent) so it does not disappear into the backdrop

#### Scenario: HeroUI styles loaded

- **WHEN** any SSR page is rendered
- **THEN** `@heroui/styles` is imported in the global stylesheet after Tailwind CSS

### Requirement: Work Sans single-font typography

The application SHALL use Work Sans (variable, weight 100–900) as the only font family. EK Notice Sans SHALL NOT be loaded or referenced.

#### Scenario: Body typography

- **WHEN** body text renders on any page
- **THEN** it uses Work Sans via `--font-sans`

#### Scenario: Heading typography

- **WHEN** an `h1`, `h2`, or `h3` renders
- **THEN** it uses Work Sans at weight 900 with uppercase, `-0.05em` tracking, and `line-height: 0.9`

#### Scenario: No EK Notice Sans

- **WHEN** the application loads fonts
- **THEN** no `@font-face` or network request references EK Notice Sans

### Requirement: Neo-brutalist shape utilities

The global stylesheet SHALL provide hard offset shadow utilities (`.unveiled-shadow`, `.unveiled-card-hover`) and near-zero border radius on cards, with pill/badge exceptions using `rounded-full`.

#### Scenario: Shadow utility

- **WHEN** an element uses class `unveiled-shadow`
- **THEN** it displays a `6px 6px 0 0 #202621` box shadow (12px at `md:` breakpoint)

#### Scenario: Card hover utility

- **WHEN** an element with class `unveiled-card-hover` is hovered
- **THEN** it translates `-2px, -2px` (mobile) or `-4px, -4px` (≥768px) with a corresponding hard offset shadow increase

#### Scenario: Sharp corners

- **WHEN** HeroUI Card or Button components render with default styling
- **THEN** border radius resolves to zero (or near-zero) except for pill/badge variants using `rounded-full`

### Requirement: Accessibility baseline for theme

The themed application SHALL preserve HeroUI focus rings, use dark-on-light text contrast only, and respect `prefers-reduced-motion`.

#### Scenario: Text selection

- **WHEN** a user selects text on any page
- **THEN** selection background is brand-dark and selection text is brand-yellow

#### Scenario: Reduced motion

- **WHEN** the user has `prefers-reduced-motion: reduce` enabled
- **THEN** entrance animations and hover transitions are disabled or shortened
