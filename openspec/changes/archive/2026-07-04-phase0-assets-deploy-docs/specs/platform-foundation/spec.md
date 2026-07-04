## ADDED Requirements

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
