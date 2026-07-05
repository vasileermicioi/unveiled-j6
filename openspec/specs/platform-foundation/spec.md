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

During Phase 2 auth step 02, `packages/` SHALL include `config/`, `db/`, and `auth/`. Billing, images, and UI packages are not created until their respective phases.

#### Scenario: Package directory listing after auth step 02

- **WHEN** auth step 02 is complete
- **THEN** `packages/` contains `config/`, `db/`, and `auth/` and no other domain packages

### Requirement: Database migration scripts

The root workspace SHALL expose `db:generate` and `db:migrate` scripts that delegate to `@unveiled/db` and apply Drizzle migrations against `DATABASE_URL`.

#### Scenario: Generate migrations

- **WHEN** a developer runs `bun run db:generate` with `DATABASE_URL` set
- **THEN** Drizzle Kit generates migration files under `packages/db/drizzle/` without errors

#### Scenario: Apply migrations

- **WHEN** a developer runs `bun run db:migrate` with `DATABASE_URL` set
- **THEN** pending migrations apply to the Neon Postgres database and exit successfully

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

The application SHALL use HeroUI v3 with the built-in Uber preset as structural baseline, overriding only color-bearing CSS variables with Unveiled brand tokens per [`design-tokens.md`](../../../design-tokens.md).

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

### Requirement: Neo-brutalist shape and HeroUI markup

The application SHALL render UI with HeroUI components only (no raw HTML elements such as `<section>`, `<p>`, `<a>`, or heading tags in routes or UI components). Visual styling SHALL be controlled via HeroUI theme tokens in `apps/web/app/styles/globals.css`. Tailwind utilities on HeroUI nodes are for layout and spacing only.

The theme SHALL provide flat bordered surfaces (no drop shadows), near-zero border radius on cards, and pill/badge exceptions using `rounded-full`.

#### Scenario: No drop shadows

- **WHEN** a HeroUI Card or Surface renders
- **THEN** `--surface-shadow`, `--overlay-shadow`, and `--field-shadow` resolve to `none` and no hard offset box-shadow is applied

#### Scenario: Sharp corners

- **WHEN** HeroUI Card or Button components render with default styling
- **THEN** border radius resolves to zero (or near-zero) except for pill/badge variants using `rounded-full`

#### Scenario: HeroUI markup in routes

- **WHEN** a page route or shared UI component renders interactive or typographic content
- **THEN** it uses `@heroui/react` primitives (e.g. `Card`, `Link`, `Heading`, `Paragraph`) or a page component composed entirely from HeroUI — not raw HTML tags

### Requirement: Accessibility baseline for theme

The themed application SHALL preserve HeroUI focus rings, use dark-on-light text contrast only, and respect `prefers-reduced-motion`.

#### Scenario: Text selection

- **WHEN** a user selects text on any page
- **THEN** selection background is brand-dark and selection text is brand-yellow

#### Scenario: Reduced motion

- **WHEN** the user has `prefers-reduced-motion: reduce` enabled
- **THEN** entrance animations and hover transitions are disabled or shortened

### Requirement: Logo static assets

The application SHALL serve three logo SVG variants from `apps/web/public/logos/`: `unveiled-logo-black.svg`, `unveiled-logo-white.svg`, and `unveiled-logo-yellow.svg`.

#### Scenario: Navbar logo load

- **WHEN** a user views any locale page
- **THEN** the navbar logo image loads successfully (HTTP 200) from `/logos/unveiled-logo-black.svg`

#### Scenario: Logo tone variants available

- **WHEN** a developer inspects `apps/web/public/logos/`
- **THEN** all three SVG filenames exist and match the assets inventory contract

### Requirement: Favicon placeholder

The application SHALL include a favicon asset under `apps/web/public/` and reference it in the HTML document head via `<link rel="icon">`.

#### Scenario: Favicon present

- **WHEN** a user loads any page
- **THEN** the browser can fetch a favicon without 404

#### Scenario: Favicon linked in document head

- **WHEN** the root `_renderer.tsx` renders the HTML shell
- **THEN** the document head includes a favicon link tag pointing to the public favicon asset

### Requirement: Staging deployment

The application SHALL be deployable to a Node.js-capable staging host with documented build and start commands. The production server SHALL bind to the host-provided `PORT` environment variable.

#### Scenario: Staging availability

- **WHEN** Phase 0 is complete
- **THEN** a staging URL serves the SSR application with locale routing and app shell

#### Scenario: Production start after build

- **WHEN** the deploy pipeline runs `bun run build` followed by the documented start command
- **THEN** the server listens on `process.env.PORT` (default `3000` locally) and responds to HTTP requests

#### Scenario: Locale redirect on staging

- **WHEN** a client requests the staging root URL `/`
- **THEN** the server responds with HTTP 302 to `/de` or `/en`

### Requirement: Deployment documentation

`apps/web/DEPLOYMENT.md` SHALL document the staging URL, build/start commands, and required environment variables. For Phase 0, no runtime env vars beyond `PORT` (host-injected) are required.

#### Scenario: Phase 0 env var table

- **WHEN** a developer reads `apps/web/DEPLOYMENT.md` after Phase 0
- **THEN** they find explicit documentation that no application secrets or service credentials are required yet, with a table ready for future phases

#### Scenario: Build and start commands documented

- **WHEN** a developer reads `apps/web/DEPLOYMENT.md`
- **THEN** they find the exact root `bun run build` and `apps/web` start command used by CI and local prod verification

### Requirement: Phase 0 release gate

Phase 0 SHALL be considered complete only when staging loads with correct brand colors and font, navbar and footer render, language switch works, and the browser console shows no errors on `/de` and `/en`.

#### Scenario: Client demo acceptance

- **WHEN** the client opens the staging URL
- **THEN** they see the yellow background, Unveiled shell, working DE/EN switch, and a placeholder home page — with no console errors

#### Scenario: Logo and favicon on staging

- **WHEN** the client opens `/de` on staging
- **THEN** the navbar logo and browser tab favicon render without network 404 errors

### Requirement: Marketing page content modules

The application SHALL provide typed locale content modules under `apps/web/app/lib/content/` (or equivalent) containing verbatim DE/EN copy for static marketing pages, sourced from `docs/migration/ui/static-pages-content.md` and `docs/migration/extras/content-i18n-inventory.md`.

#### Scenario: German landing copy available

- **WHEN** a route requests landing page content for locale `de`
- **THEN** the hero subheadline matches the German string from `static-pages-content.md` exactly

#### Scenario: English FAQ copy available

- **WHEN** a route requests FAQ content for locale `en`
- **THEN** all three Q&A pairs match the English strings from `static-pages-content.md` exactly

### Requirement: Server-rendered SEO metadata helper

The application SHALL expose a SEO helper that builds per-page `<title>`, `<meta name="description">`, `<link rel="canonical">`, hreflang alternates (`de`, `en`, `x-default` pointing at `de`), and Open Graph / Twitter Card tags, rendered in the initial SSR HTML via `_renderer.tsx`.

#### Scenario: Marketing page title pattern

- **WHEN** a page sets title `"FAQ"` for locale `de`
- **THEN** the rendered document title is `FAQ — Unveiled Berlin`

#### Scenario: Hreflang reciprocity

- **WHEN** a user views `/de/faq`
- **THEN** the HTML head includes `hreflang="de"`, `hreflang="en"`, and `hreflang="x-default"` alternate links with absolute URLs

#### Scenario: Canonical self-reference

- **WHEN** a user views `/en/discover`
- **THEN** `<link rel="canonical">` points at the English URL for that page, not the German version

### Requirement: Shared marketing layout primitives

The application SHALL provide reusable `PageHero` and `SectionCard` components implementing the bordered-card + eyebrow + display-headline pattern described in `static-pages-content.md` cross-page observations.

#### Scenario: PageHero structure

- **WHEN** a marketing page renders `PageHero`
- **THEN** it displays an optional eyebrow, uppercase display headline, and supporting paragraph inside a bordered card on the yellow page background

### Requirement: Robots.txt route

The application SHALL serve `/robots.txt` allowing crawl of public marketing routes and disallowing auth, member, partner, and admin paths per `docs/migration/extras/seo-and-metadata.md`, with a `Sitemap:` directive pointing at `/sitemap.xml`.

#### Scenario: Robots.txt disallows admin

- **WHEN** a crawler requests `/robots.txt`
- **THEN** the response includes a disallow rule for admin paths

#### Scenario: Sitemap directive present

- **WHEN** a crawler requests `/robots.txt`
- **THEN** the response includes `Sitemap: {SITE_URL}/sitemap.xml`

### Requirement: Site URL configuration

The application SHALL read `SITE_URL` from environment variables for absolute canonical, Open Graph, and sitemap URLs, defaulting to `http://localhost:3000` in local development.

#### Scenario: Production canonical URLs

- **WHEN** `SITE_URL=https://staging.example.com` is set
- **THEN** canonical and sitemap URLs use that origin

### Requirement: Phase 1 release gate

Phase 1 SHALL be considered complete when all public marketing routes render in DE and EN, legal pages are footer-linked, View Source shows server-rendered meta tags, robots.txt and sitemap.xml are served, cookie consent works, and staging loads without console errors.

#### Scenario: Client demo acceptance

- **WHEN** the client opens staging and toggles DE/EN across marketing pages
- **THEN** they see the full brochure site with legal pages, SEO-ready metadata, and no console errors
