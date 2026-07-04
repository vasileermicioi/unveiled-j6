# Platform Foundation

Shared monorepo tooling and workspace structure for the Unveiled Berlin rewrite.

## Requirements

### Requirement: Bun workspaces monorepo root

The repository SHALL use Bun workspaces with `apps/*` and `packages/*` globs, a shared dependency `catalog` in the root `package.json`, and root scripts `dev`, `build`, `lint`, and `typecheck`.

#### Scenario: Install dependencies

- **WHEN** a developer runs `bun install` at the repository root
- **THEN** workspace packages resolve and lockfile is created without errors

#### Scenario: Lint from root

- **WHEN** a developer runs `bun run lint` at the repository root
- **THEN** Biome executes against the repository and exits without fatal errors

### Requirement: Shared config package

The repository SHALL provide `@unveiled/config` with shared TypeScript (`tsconfig.base.json`, `tsconfig.react.json`) and Biome presets consumed by apps and future packages.

#### Scenario: Extend shared tsconfig

- **WHEN** a new workspace package adds `"extends": "@unveiled/config/tsconfig.base.json"`
- **THEN** TypeScript inherits strict baseline compiler options without duplicating config

#### Scenario: Extend shared Biome preset

- **WHEN** the root `biome.json` extends `@unveiled/config/biome.json`
- **THEN** lint and format rules are inherited from the shared preset

### Requirement: Phase 0 package scope

During Phase 0 step 01, the only package under `packages/*` SHALL be `packages/config`. No database, auth, billing, or UI packages are created yet.

#### Scenario: Package directory listing

- **WHEN** Phase 0 step 01 is complete
- **THEN** `packages/` contains only `config/` and no other domain packages

### Requirement: Single deployable SSR application

The monorepo SHALL contain exactly one deployable application at `apps/web` (`@unveiled/web`) built with HonoX and React SSR.

#### Scenario: Development server

- **WHEN** a developer runs `bun run dev` from the repository root
- **THEN** the HonoX dev server starts and serves server-rendered HTML

#### Scenario: Production build

- **WHEN** a developer runs `bun run build` from the repository root
- **THEN** `@unveiled/web` produces a production build artifact without errors

#### Scenario: Production start

- **WHEN** a developer runs `bun run start` from `apps/web` after a successful build
- **THEN** the Node.js SSR server serves the built application

### Requirement: Route file convention

SSR pages and layouts SHALL live under `apps/web/app/routes/`. Business logic SHALL NOT be embedded in route files beyond rendering concerns (extract to `packages/*` in later phases).

#### Scenario: Route directory structure

- **WHEN** Phase 0 step 04 is complete
- **THEN** `apps/web/app/routes/` contains a root redirect route, a `[locale]/` route group, and a not-found handler

#### Scenario: Root locale redirect

- **WHEN** a client requests `/` on the dev or production server
- **THEN** the server responds with HTTP 302 to `/de` or `/en` based on `Accept-Language` (fallback `de`)

### Requirement: Locale-prefixed routing

All pages SHALL live under `/:locale/` where `locale` is `de` or `en`. The bare path `/` SHALL respond with HTTP 302 redirect to `/:locale` based on the `Accept-Language` header, falling back to `de`.

#### Scenario: Root redirect without Accept-Language

- **WHEN** a client requests `GET /` without a recognizable `Accept-Language` preference
- **THEN** the server responds with `302` to `/de`

#### Scenario: Root redirect with English preference

- **WHEN** a client requests `GET /` with `Accept-Language: en`
- **THEN** the server responds with `302` to `/en`

#### Scenario: Invalid locale segment

- **WHEN** a client requests a path with locale not in `{de, en}`
- **THEN** the server renders the 404 page

### Requirement: Language switch via navigation

Switching language SHALL navigate to the same path under the other locale prefix (e.g. `/de/events` ↔ `/en/events`), not mutate locale in client-side state.

#### Scenario: Toggle from German to English

- **WHEN** a user on `/de/discover` activates the EN language control
- **THEN** the browser navigates to `/en/discover`

#### Scenario: Toggle from English to German

- **WHEN** a user on `/en/faq` activates the DE language control
- **THEN** the browser navigates to `/de/faq`

### Requirement: Guest app shell

Every locale page SHALL render inside a persistent shell with sticky navbar (logo, guest nav links, language toggle, mobile drawer menu) and footer per `docs/migration/ui/app-shell.md`.

#### Scenario: German shell copy

- **WHEN** a user views `/de`
- **THEN** the footer tagline reads "KURATIERTER KULTURZUGANG IN BERLIN." and nav uses German labels

#### Scenario: English shell copy

- **WHEN** a user views `/en`
- **THEN** the footer tagline reads "CURATED CULTURAL ACCESS IN BERLIN." and nav uses English labels

#### Scenario: Mobile navigation

- **WHEN** the viewport is below the desktop nav breakpoint
- **THEN** primary nav links are accessible via a hamburger menu drawer

#### Scenario: Sticky header

- **WHEN** a user scrolls any locale page
- **THEN** the navbar remains fixed at the top of the viewport

#### Scenario: Active route highlight

- **WHEN** a user views a page whose path matches a primary nav link
- **THEN** that nav link displays a yellow background with dark border

### Requirement: Placeholder home page

The locale root `/:locale` SHALL render a minimal placeholder with the Unveiled logo and one primary CTA linking to `/:locale/discover`.

#### Scenario: German home page content

- **WHEN** a user visits `/de`
- **THEN** the page shows the logo and a call-to-action labeled "Entdecken"

#### Scenario: English home page content

- **WHEN** a user visits `/en`
- **THEN** the page shows the logo and a call-to-action labeled "Discover"

### Requirement: Localized 404 page

Unmatched routes SHALL render a server-rendered 404 page including `<meta name="robots" content="noindex">`.

#### Scenario: Unknown path

- **WHEN** a client requests `/de/does-not-exist`
- **THEN** the response is a 404 HTML page with `noindex` robots meta

#### Scenario: Invalid locale path

- **WHEN** a client requests `/fr/discover`
- **THEN** the response is a 404 HTML page with `noindex` robots meta

### Requirement: Node.js runtime target

The application SHALL target a Node.js-capable host (not edge-only deployment) to support future server-side image processing with `sharp`.

#### Scenario: Build output compatibility

- **WHEN** the production build is started with Node.js
- **THEN** the SSR server runs without requiring edge-specific APIs

#### Scenario: Web package scripts

- **WHEN** `@unveiled/web` is inspected
- **THEN** it exposes `dev`, `build`, `start`, and `typecheck` scripts consumed by root workspace commands

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
