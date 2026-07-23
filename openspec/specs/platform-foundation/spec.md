# Platform Foundation

Monorepo structure, package rollout, database tooling, and deployment documentation.

## Requirements

### Requirement: Phase 0 package scope

During Phase 4 catalog step 01, `packages/` SHALL include `config/`, `db/`, `auth/`, and `images/`. `@unveiled/db` SHALL extend beyond `users` and `subscriptions` with catalog tables (`images`, `partners`, `events`). `@unveiled/images` SHALL provide server-side image processing into the six fixed JPEG variants without importing `apps/web`. Billing and UI packages are not created until their respective phases.

#### Scenario: Package directory listing after catalog step 01

- **WHEN** catalog step 01 is complete
- **THEN** `packages/` contains `config/`, `db/`, `auth/`, and `images/` and no billing or UI packages

#### Scenario: Images package is buildable

- **WHEN** `bun run typecheck` runs after Phase 4 step 01
- **THEN** `@unveiled/images` typechecks without importing `apps/web`

#### Scenario: Catalog tables in database package

- **WHEN** a consumer imports schema symbols from `@unveiled/db`
- **THEN** `images`, `partners`, and `events` tables and related enums are exported alongside existing auth tables

### Requirement: Image processing runtime target

The application SHALL target Cloudflare Workers for `apps/web` SSR and SHALL process admin image uploads in-request on that host using `@standardagents/sip`. Product and operator documentation (`docs/product/extras/image-uploads.md`, `AGENTS.md`, `apps/web/DEPLOYMENT.md`) SHALL name `@standardagents/sip` as the processing approach and SHALL describe JPEG variant filenames. The historical “Node-only sharp / Option B local uploads” hosting assumption is superseded and SHALL NOT be presented as the required happy path for staging or production uploads.

#### Scenario: Documentation states the target processor

- **WHEN** an operator reads `docs/product/extras/image-uploads.md` after this change
- **THEN** the doc names `@standardagents/sip` (or equivalent Workers-native library) as the processing approach and describes JPEG variant filenames

#### Scenario: Deployment docs do not require local-only uploads

- **WHEN** an operator reads `apps/web/DEPLOYMENT.md` image-processing notes after this change
- **THEN** the notes do not instruct that Workers admin uploads must use `bun run dev` / Option B as the only path

#### Scenario: AGENTS.md hosting matches Workers+sip

- **WHEN** an agent reads the `AGENTS.md` hosting and Images stack rows
- **THEN** they state Cloudflare Workers + `@standardagents/sip` with six JPEG variants and do not claim admin uploads on the Workers URL are unavailable

### Requirement: Documented image upload operations

Operator documentation (`AGENTS.md`, `apps/web/DEPLOYMENT.md`, `packages/images/README.md`, `e2e/README.md`) SHALL describe `@standardagents/sip` on Cloudflare Workers as the supported upload path, including JPEG variant filenames and the need to re-seed or re-upload after migrating from the former WebP/sharp pipeline. Those docs SHALL NOT present Option B local-only uploads or `sharp` as the required happy path for staging or production.

#### Scenario: Operator follows DEPLOYMENT.md

- **WHEN** an operator configures R2 and deploys `apps/web` to Workers
- **THEN** documentation instructs them that admin image uploads work on that deployment and does not direct them to Option B local-only uploads as the primary path

#### Scenario: Agent and e2e docs match Workers+sip

- **WHEN** an operator or agent reads `AGENTS.md` hosting/images notes and `e2e/README.md` image-test guidance
- **THEN** both describe sip on Workers (and local Bun/Node) with `.jpg` variants and do not require `bun run dev` + `sharp` as the only upload host

#### Scenario: Legacy WebP migration is documented

- **WHEN** an operator has existing R2 objects or DB rows from the former `.webp` pipeline
- **THEN** `apps/web/DEPLOYMENT.md` (or linked image docs) instructs them to re-run `bun run seed:demo` and/or re-upload images so public URLs resolve to `.jpg` variants

### Requirement: sip WASM available in the Worker isolate

The `apps/web` Cloudflare Workers build SHALL include the `@standardagents/sip` WASM module (or sip’s workerd-supported loader) so `await ready()` succeeds inside the isolate before image transforms run. The production bundle SHALL NOT depend on unresolved `sharp` (or other Node-native image addons) for admin upload processing.

#### Scenario: Worker cold start upload

- **WHEN** the first admin image upload runs on a fresh Worker isolate
- **THEN** sip initializes successfully and processes the image without native-addon errors

#### Scenario: Production build ships sip without sharp

- **WHEN** an operator runs `bun run build` for `apps/web`
- **THEN** the Worker bundle references sip/wasm successfully and does not require a `sharp` native addon at runtime

### Requirement: Database migration scripts

The root workspace SHALL expose `db:generate` and `db:migrate` scripts that delegate to `@unveiled/db` and apply Drizzle migrations against `DATABASE_URL`.

#### Scenario: Generate migrations

- **WHEN** a developer runs `bun run db:generate` with `DATABASE_URL` set
- **THEN** Drizzle Kit generates migration files under `packages/db/drizzle/` without errors

#### Scenario: Apply migrations

- **WHEN** a developer runs `bun run db:migrate` with `DATABASE_URL` set
- **THEN** pending migrations apply to the Neon Postgres database and exit successfully

### Requirement: Role-based admin route protection

The application SHALL protect `/:locale/admin/*` routes so that only authenticated users with role `ADMIN` can render partner management and dashboard pages introduced in catalog step 03. Users with role `USER` or `PARTNER` SHALL be redirected away from the `admin` path prefix per the established locale middleware pattern. Unauthenticated visitors SHALL be redirected to login with optional `returnTo`. Only `ADMIN` and `USER` login roles are active in Phase 4 catalog step 03; PARTNER provisioning is deferred to Phase 8.

#### Scenario: Admin section requires ADMIN role

- **WHEN** a signed-in USER navigates to `/de/admin/partners`
- **THEN** the request is rejected by redirect to `/de` (or equivalent forbidden handling)

#### Scenario: Unauthenticated admin access redirects to login

- **WHEN** an unauthenticated visitor navigates to `/de/admin`
- **THEN** the browser is redirected to `/de/login` with the admin path preserved for post-login return where supported

#### Scenario: ADMIN can access admin dashboard

- **WHEN** a signed-in ADMIN navigates to `/de/admin`
- **THEN** the dashboard page renders successfully

### Requirement: Component story development harness

The monorepo SHALL provide a Ladle-based story server for `@unveiled/ui` and `apps/web/app/components`, with a HeroUI theme wrapper matching production `globals.css`.

#### Scenario: Developer runs component stories

- **WHEN** a developer runs `bun run stories` from the repository root
- **THEN** Ladle serves component stories for configured globs
- **AND** stories render with the Unveiled yellow page background and HeroUI Uber theme

### Requirement: Playwright E2E harness

The monorepo SHALL provide a repo-root Playwright test harness at `e2e/` with auth fixtures and a documented proximity-only selector policy.

#### Scenario: Developer runs E2E smoke test

- **WHEN** a developer sets `SITE_URL` and runs `bun run test:e2e`
- **THEN** Playwright executes specs against the SSR app
- **AND** the smoke spec confirms locale redirect from `/` to `/de`

### Requirement: E2E selector policy

Playwright tests SHALL use only accessibility- and layout-based locators (`getByRole`, `getByLabel`, `getByText`, `filter`, parent walks, `nth()`). Production markup SHALL NOT gain test-only attributes.

#### Scenario: Selector policy is documented

- **WHEN** an implementer reads `e2e/README.md`
- **THEN** the proximity-only selector rules and forbidden patterns (`data-testid`, CSS classes, `#id`) are explicit

### Requirement: Phase 0–4 component story coverage

Every UI component shipped in Phases 0–4 SHALL have at least one Ladle story per visual state documented in `ui/ui-component-map.md` (CTA matrix for EventCard follows this change’s Book Now / Waitlist contract until product docs catch up in hardening).

#### Scenario: EventCard CTA states are story-isolated

- **WHEN** a developer opens `EventCard` stories in Ladle
- **THEN** guest Book Now, member Book Now (including inactive subscription), and Waitlist CTA labels are each visible in a dedicated story
- **AND** the guest bookable story shows "Book Now" (or Bin dabei) when capacity remains
- **AND** a sold-out story shows "Waitlist" (or Warteliste)

#### Scenario: Page-level components are story-isolated

- **WHEN** a developer browses `apps/web` component stories
- **THEN** marketing pages, auth chrome, onboarding steps, and admin list layouts each render without requiring a live session or database

### Requirement: CI runs Playwright E2E suite

The repository CI pipeline SHALL execute `bun run test:e2e` against a local SSR instance before staging deploy is considered successful.

#### Scenario: Main branch quality gate includes E2E

- **WHEN** a commit is pushed to `main`
- **THEN** lint, typecheck, build, and Playwright E2E run
- **AND** a failing E2E job blocks deploy

#### Scenario: CI E2E uses local SSR

- **WHEN** the E2E job runs in CI
- **THEN** `SITE_URL` is `http://localhost:3000` (or equivalent local origin)
- **AND** Playwright starts or reuses the app via its configured `webServer` / `bun run dev`
- **AND** the job does not use the staging public URL as the primary CI target

#### Scenario: Required secrets are documented

- **WHEN** an operator reads `apps/web/DEPLOYMENT.md` Phase 4½
- **THEN** GitHub secret names required for CI E2E are listed (values omitted)
- **AND** optional R2 secret names are listed separately from required auth/DB secrets

### Requirement: Testing documentation in deployment guide

`apps/web/DEPLOYMENT.md` SHALL document how to run Ladle stories and Playwright E2E locally and in CI, including required env vars and known marked skips.

#### Scenario: Operator runs Phase 4½ demo

- **WHEN** an operator follows DEPLOYMENT.md Phase 4½ instructions
- **THEN** they can start story servers and execute the full E2E suite with documented demo credentials

#### Scenario: Known skips are explicit

- **WHEN** an operator reads the Phase 4½ section
- **THEN** permanently or conditionally skipped scenarios (Phase 9 GDPR, Google OAuth CI limits, missing R2) are listed with owners or deferral phases

### Requirement: MVP product-spec charter

The project SHALL maintain a MVP product-spec charter at `docs/product/CHARTER.md` that locks personas (guest, member, admin; partner post-MVP), public event detail indexing intent, Discover→Events navigation intent, `@unveiled/ui` design-system ownership including a Theme Overview Ladle story, and Gherkin↔Playwright proximity-selector BDD rules. The charter SHALL be treated as binding for MVP product work. `docs/product/README.md` SHALL state that `docs/product/` is the **active** agent source of truth for MVP product behavior, with delivery sequenced by `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`.

#### Scenario: Charter exists before product tree rewrite

- **WHEN** an agent starts rewriting sitemap, features, or the implementation plan for the MVP
- **THEN** they read `docs/product/CHARTER.md` and treat its Locked decisions as binding

#### Scenario: Product folder is active source of truth

- **WHEN** an operator lists `docs/product/` after this change
- **THEN** both `CHARTER.md` and `README.md` exist and the README states the folder is the active source of truth for MVP product behavior

#### Scenario: Partner is explicitly post-MVP in the charter

- **WHEN** an agent reads Locked decisions or the post-MVP parking lot in `docs/product/CHARTER.md`
- **THEN** partner portal / partner login / check-in are marked post-MVP and MVP personas are limited to guest, member (`USER`), and admin (`ADMIN`)

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

### Requirement: BDD and Playwright proximity contract

The product spec SHALL include `docs/product/testing/bdd-and-e2e.md` requiring Playwright tests to use Gherkin `Scenario:` titles verbatim and proximity/layout selectors only, forbidding `data-testid` and CSS-class-based / `#id` test selectors except narrowly documented native-input exceptions. The doc SHALL state: Gherkin under `docs/product/features/` is the behavioral source of truth; one `e2e/specs/<feature-basename>.spec.ts` per MVP feature basename; `test("Scenario: …")` matches the `Scenario:` line verbatim; allowed locators are `getByRole`, `getByLabel`, `getByText`, `filter`, parent walks, and `nth`; production markup SHALL NOT gain test-only attributes; file-input exceptions MUST be commented `// BDD exception: file-input` and prefer role/label first; phase “done when” SHALL NOT pass with `@skip-no-ui` left on MVP-required scenarios without an explicit plan deferral; Ladle design-system stories and Theme Overview policy SHALL point at `packages/ui` / `ui/design-system.md`.

#### Scenario: Implementer checks selector rules before writing e2e

- **WHEN** an agent adds or changes an E2E test for an MVP feature
- **THEN** they follow `docs/product/testing/bdd-and-e2e.md` and can justify any `page.locator` usage against the documented exception list

#### Scenario: BDD contract file exists

- **WHEN** an agent lists `docs/product/testing/` after this change
- **THEN** `bdd-and-e2e.md` exists and states verbatim Scenario title matching and proximity-only selector rules

#### Scenario: Coverage gate is documented

- **WHEN** an agent reads the coverage-gate section of `bdd-and-e2e.md`
- **THEN** MVP-required scenarios left on `@skip-no-ui` without an explicit plan deferral are forbidden for phase “done when”

### Requirement: MVP implementation plan artifact

The repository SHALL provide `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` as the delivery plan for remaining MVP work, referencing `docs/product/` as the product specification and treating Phases 0–5 as a shipped baseline with explicit remediation for design-system and BDD debt.

#### Scenario: Active MVP plan is present

- **WHEN** a reader lists `.dev-plan/`
- **THEN** `IMPLEMENTATION-PLAN.mvp.md` is present as the active MVP delivery plan

#### Scenario: Plan references product docs as source of truth

- **WHEN** an agent reads `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`
- **THEN** the plan cites `docs/product/` for product behavior, cites `openspec_5step_proposals_guide.v2.md` for step planning, and treats `docs/product/` as the active product source of truth

#### Scenario: Baseline and remediation are explicit

- **WHEN** an agent reads the MVP plan phase list
- **THEN** Phases 0–5 are summarized as shipped (not re-prompted to rebuild), and design-system consolidation plus BDD remediation appear as scheduled work before or interleaved with remaining product phases

#### Scenario: Partner is not an active MVP phase

- **WHEN** an agent scans MVP phase goals in `IMPLEMENTATION-PLAN.mvp.md`
- **THEN** `/partner` portal and check-in appear only in a post-MVP appendix, not as an active MVP phase goal

### Requirement: Canonical product specification location

For new Unveiled Berlin MVP work, the canonical product specification SHALL be `docs/product/`, and the active phased delivery plan SHALL be `.dev-plan/IMPLEMENTATION-PLAN.mvp.md`. Superseded trees (`docs/migration/`, `.dev-plan/IMPLEMENTATION-PLAN.md`, `.dev-plan/openspec_5step_proposals_guide.md`) SHALL NOT be required for new work.

#### Scenario: Agent entry via AGENTS.md

- **WHEN** an agent reads `AGENTS.md` source-of-truth guidance
- **THEN** it is directed to `docs/product/` and `IMPLEMENTATION-PLAN.mvp.md` for MVP behavior and delivery sequencing

#### Scenario: Product README is active source of truth

- **WHEN** an agent opens `docs/product/README.md`
- **THEN** the README states that `docs/product/` is the active product source of truth for MVP work

#### Scenario: Acceptance checklist exists

- **WHEN** an operator lists `docs/product/` after this change
- **THEN** `ACCEPTANCE.md` exists with release criteria, verification commands, and a sign-off section for the MVP product-spec rewrite

### Requirement: Phase 5.5 release gate

Phase 6 (Stripe/booking) SHALL NOT start until Phase 5.5 release criteria in `.dev-plan/current-iteration/spec-alignment-parent-guide.md` are met, or only **named** deferrals remain (each with scenario/debt id + reason + target phase) documented in the parent guide and/or `docs/product/testing/coverage-matrix.md`. Completing Phase 5.5 step 05 SHALL update staging, record the phase in `apps/web/DEPLOYMENT.md`, and SHALL NOT introduce `packages/billing`, booking mutation routes, Stripe checkout, or Resend as part of this feature.

#### Scenario: Hard stop before payments

- **WHEN** Phase 5.5 step 05 completes
- **THEN** staging is updated, `DEPLOYMENT.md` notes Phase 5.5, parent release criteria are checked (or only named deferrals remain), and no billing/booking implementation has been started as part of this feature

#### Scenario: Verification baseline passes

- **WHEN** an implementer finishes step 05
- **THEN** `bun run lint`, `bun run typecheck`, `bun run stories` (Theme Overview reachable), and in-scope `bun run test:e2e` pass (respecting named skips/deferrals)

### Requirement: Branded error pages
The system SHALL render HeroUI 403 and 500 error pages consistent with the app shell (brand yellow backdrop), without exposing stack traces to end users. Wrong-role access SHOULD prefer redirect or 404 when leaking resource existence is undesirable; a generic 403 composition SHALL still exist for true forbidden HTML responses.

#### Scenario: Forbidden
- **WHEN** a true forbidden HTML response is rendered for an authenticated user who is not allowed to perform the action
- **THEN** a branded 403 page is shown without a stack trace

#### Scenario: Wrong-role admin prefers safe redirect
- **WHEN** a signed-in USER navigates to an admin-only URL under `/:locale/admin`
- **THEN** the request is rejected by redirect to `/:locale` (or 404) rather than confirming admin resource existence via a distinct 403 page

#### Scenario: Server error
- **WHEN** an unhandled server error occurs on an HTML page request
- **THEN** a branded 500 page is shown without a stack trace

### Requirement: Optional Sentry
The system SHALL initialize Sentry when `SENTRY_DSN` is configured, keep reporting PII-free, and MUST remain functional when the DSN is unset. Sentry SHALL NOT be gated behind cookie consent (strictly necessary error tracking).

#### Scenario: No DSN
- **WHEN** `SENTRY_DSN` is absent
- **THEN** the app starts without Sentry and without throwing

#### Scenario: DSN configured
- **WHEN** `SENTRY_DSN` is set to a valid DSN
- **THEN** Sentry initializes without throwing and does not require cookie consent to be enabled

### Requirement: Production cutover checklist
The project SHALL maintain a production cutover checklist covering required env vars, Neon Auth trusted domains, Stripe, R2, Resend, optional Sentry, DNS/Workers routing, and admin provisioning, referenced from `apps/web/DEPLOYMENT.md`. Phase 8 close-out SHALL also record the staging guest→member→book→admin walkthrough (or an explicit blocker) in `DEPLOYMENT.md`.

#### Scenario: Checklist exists
- **WHEN** Phase 8 closes
- **THEN** operators can follow a written cutover checklist for production from `apps/web/DEPLOYMENT.md` (or a doc linked from it)

#### Scenario: Staging walkthrough is recorded
- **WHEN** Phase 8 launch polish completes
- **THEN** `DEPLOYMENT.md` documents the staging demo/walkthrough outcome (pass, partial with named gaps, or blocked with reason) for guest→member→book→admin support

### Requirement: Shared page section header
The web app SHALL provide a reusable `PageSectionHeader` composition (HeroUI primitives only) that renders a muted uppercase eyebrow, a primary page/section headline, and a full-width horizontal rule beneath the headline, matching the Discover live-preview header treatment on the brand yellow page background.

#### Scenario: Discover uses shared header
- **WHEN** a guest opens locale home `/:locale`
- **THEN** the events section header is rendered via the shared `PageSectionHeader` pattern (eyebrow + headline + rule)

#### Scenario: FAQ uses shared header
- **WHEN** a visitor opens `/:locale/faq`
- **THEN** the FAQ page header uses the same ruled section-header pattern (not a one-off unstyled stack)

#### Scenario: Auth pages use shared header
- **WHEN** a visitor opens `/:locale/login` or `/:locale/signup`
- **THEN** the auth page shows an eyebrow + headline section header with the shared bottom rule above the auth form

### Requirement: Section header documented for agents

Product UI docs SHALL describe the shared on-yellow `PageSectionHeader` (eyebrow + headline + rule) as the default page/section header for Discover, FAQ, auth, member browse surfaces, member account/profile pages, and admin `AdminPageShell` titles, distinct from the optional bordered `PageHero` card used on long-form marketing/legal pages. Agent-facing docs (`docs/product/ui/ui-component-map.md`, `docs/product/ui/static-pages-content.md`, and `docs/COMPONENTS.md` where headers are listed) SHALL make this distinction explicit and SHALL note profile tablist-above-header + shared column width so implementers do not invent one-off heroes, bare admin heading stacks, or treat `PageHero` as the FAQ/auth/admin default.

#### Scenario: Component map mentions PageSectionHeader

- **WHEN** an implementer reads the UI component / static pages docs
- **THEN** they can distinguish PageSectionHeader (Discover / account / admin pattern) from PageHero (card hero)

#### Scenario: FAQ and auth header presence in e2e

- **WHEN** Playwright covers FAQ and auth page headers after this change
- **THEN** assertions use proximity role/name (eyebrow and/or level-1 heading), not CSS-class or `data-testid` selectors for the ruled header

### Requirement: UI docs list admin PageSectionHeader usage

Agent-facing UI docs (`docs/product/ui/ui-component-map.md`, `docs/product/ui/static-pages-content.md` as applicable) SHALL state that admin `AdminPageShell` titles use the shared `PageSectionHeader` pattern and that profile tabs render above the account header with shared column width.

#### Scenario: Component map mentions admin PageSectionHeader

- **WHEN** an implementer reads the PageSectionHeader / Profile / Admin entries in the UI component map
- **THEN** they can see that admin titles and profile tab order follow the shared header conventions from this feature

#### Scenario: Static pages content notes account and admin header chrome

- **WHEN** an implementer reads account/admin header guidance in `static-pages-content.md`
- **THEN** they learn that profile tabs sit above `PageSectionHeader` and admin shells use the shared eyebrow + headline + rule pattern

### Requirement: Form control preference
App forms SHALL use native HTML controls (`select`, `input` of type `checkbox|radio|number|date|time|file`, `textarea`) for choice, numeric, date, and file fields when a native control exists. HeroUI `Select`, `NumberField`, `Checkbox`, `Radio`, and `Switch` SHALL NOT be used for those fields except where listed as exceptions (admin image processing UI, map/geo pickers, third-party auth UI). HeroUI MAY still wrap labels, layout, text fields, and buttons. Theme styling for native controls SHALL come from shared CSS tokens in `globals.css`. Agent-facing docs (`AGENTS.md` hard rules and `docs/product/ui/design-system.md` Form controls) SHALL state this native-first preference and SHALL NOT mandate HeroUI Select-only guidance for those fields.

#### Scenario: Policy documents native-first forms
- **WHEN** an agent or implementer reads AGENTS hard rules and the design-system Form controls section
- **THEN** native controls are preferred for choice/number/date/file fields and HeroUI Select-only guidance no longer applies

#### Scenario: Documented exceptions remain
- **WHEN** an implementer reads the Form controls policy after this change
- **THEN** admin image processing UI, map/geo pickers, and third-party auth UI are listed as allowed non-native exceptions
- **AND** theme-token styling (not ad-hoc per-route colors) is still required for native controls

### Requirement: Admin form automation uses native controls
Automated tests for admin choice and numeric fields SHALL target native HTML form controls (e.g. Playwright `selectOption` / labeled number inputs), not HeroUI Select listbox popovers or NumberField increment/decrement steppers, once native form controls have shipped. Helpers SHALL resolve fields via accessible labels (`getByLabel` or equivalent proximity selectors) per `docs/product/testing/bdd-and-e2e.md`.

#### Scenario: Admin event Partner selection in e2e
- **WHEN** an e2e test sets the Partner field on Create Event
- **THEN** it selects via the native select associated with the Partner label (not a ListBox popover)

#### Scenario: Admin capacity uses labeled number input
- **WHEN** an e2e helper or spec sets event capacity (create, edit, or waitlist capacity bump)
- **THEN** it fills the native number input associated with the capacity label
- **AND** it does not click HeroUI NumberField increment/decrement buttons

### Requirement: Shared page section headers on booking flows
Member flows that use the default on-yellow page title pattern SHALL use the shared `PageSectionHeader` (or documented equivalent), including booking and waitlist pages. Pages SHALL NOT invent one-off bare `Heading` title chrome that diverges from that pattern without an explicit product exception. The membership marketing hero card MAY retain its bordered hero composition; this requirement targets transactional member pages (book, confirm, waitlist), not the membership perk hero.

#### Scenario: Book event uses shared header
- **WHEN** a member opens the book-event page
- **THEN** the title/eyebrow treatment matches the shared page-header pattern used on Discover/FAQ-style surfaces

#### Scenario: Booking confirmation uses shared header
- **WHEN** a member opens the booking confirmation page
- **THEN** the page uses `PageSectionHeader` (eyebrow + headline) rather than a bare level-1 heading stack

#### Scenario: Waitlist join uses shared header
- **WHEN** a member opens the waitlist join page
- **THEN** the page header matches the shared `PageSectionHeader` pattern

### Requirement: Shared on-yellow page header includes admin

Admin authenticated pages that use `AdminPageShell` SHALL render their primary page title through the shared `PageSectionHeader` pattern (muted uppercase eyebrow, bold headline, horizontal rule), consistent with member and marketing on-yellow headers. Optional admin subtitle and action toolbar MAY appear below the header. Admin tab navigation SHALL remain above the page header. Admin pages SHALL NOT use a one-off bare heading stack that diverges from `PageSectionHeader` without an explicit product exception.

#### Scenario: Admin list page uses PageSectionHeader

- **WHEN** an ADMIN opens `/en/admin/partners` (or another AdminPageShell list page)
- **THEN** the page title is rendered with the shared PageSectionHeader treatment (eyebrow + headline + rule)
- **AND** the admin tablist remains above that header

#### Scenario: Admin nested page keeps breadcrumbs and header pattern

- **WHEN** an ADMIN opens a nested admin page that shows breadcrumbs
- **THEN** breadcrumbs remain available
- **AND** the page title still uses the shared PageSectionHeader pattern
