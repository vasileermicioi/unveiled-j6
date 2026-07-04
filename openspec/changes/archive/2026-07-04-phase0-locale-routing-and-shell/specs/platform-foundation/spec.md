## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Route file convention

SSR pages and layouts SHALL live under `apps/web/app/routes/`. Business logic SHALL NOT be embedded in route files beyond rendering concerns (extract to `packages/*` in later phases).

#### Scenario: Route directory structure

- **WHEN** Phase 0 step 04 is complete
- **THEN** `apps/web/app/routes/` contains a root redirect route, a `[locale]/` route group, and a not-found handler

#### Scenario: Root locale redirect

- **WHEN** a client requests `/` on the dev or production server
- **THEN** the server responds with HTTP 302 to `/de` or `/en` based on `Accept-Language` (fallback `de`)
