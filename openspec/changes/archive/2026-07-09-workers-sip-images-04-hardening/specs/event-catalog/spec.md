## ADDED Requirements

### Requirement: Demo seed writes JPEG variants

`bun run seed:demo` SHALL populate catalog images through `@unveiled/images` so seeded objects use the six `.jpg` filenames and are viewable on Workers without a separate local upload pass.

#### Scenario: Fresh demo seed

- **WHEN** an operator runs `bun run seed:demo` against a database with R2 configured
- **THEN** seeded events/partners reference images whose public variant URLs end in `.jpg` and resolve successfully

#### Scenario: Seed uses the shared image pipeline

- **WHEN** demo seed creates partners and events with remote or generated image sources
- **THEN** image persistence goes through the catalog domain + `@unveiled/images` sip pipeline (not a sharp-only or WebP-filename side path)

## MODIFIED Requirements

### Requirement: Automated browser coverage for admin catalog management

Each Gherkin scenario in `docs/migration/features/admin-events.feature` and `docs/migration/features/admin-partners.feature` SHALL have a Playwright test with a title matching the scenario line (or Scenario Outline plus example row). Partner scenarios SHALL live in `e2e/specs/admin-partners.spec.ts` and event scenarios in `e2e/specs/admin-events.spec.ts`. Tests SHALL sign in as ADMIN via `loginAsAdmin` / `E2E_ADMIN_*`, use proximity selectors only, and use unique timestamp suffixes for created partner/event names and portal emails. Image upload/URL processing tests SHALL call `test.skip` with reason `R2 vars not configured` when any required R2 env var (`S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL`) is missing. Image specs SHALL NOT skip solely because the target host is Cloudflare Workers; `e2e/README.md` SHALL allow running image uploads against `bun run dev` and, when configured, against a Workers preview or staging base URL.

#### Scenario: Admin partner CRUD is E2E-verified

- **WHEN** an ADMIN runs `e2e/specs/admin-partners.spec.ts`
- **THEN** partner create/edit/delete, logo upload or URL, name propagation, QR regeneration, and portal-access flows are asserted in the browser

#### Scenario: Admin event CRUD is E2E-verified

- **WHEN** an ADMIN runs `e2e/specs/admin-events.spec.ts`
- **THEN** single and series event creation, image required/upload/URL, redemption validation, capacity recalculation, edit, delete, optional metadata, export (or explicit skip with reason), and seed-demo behaviors are asserted

#### Scenario: Published events surface on public pages

- **WHEN** an admin creates or edits an event via the E2E flow
- **THEN** the event appears on the locale home (Discover) and is viewable on `/events/:id` without authentication
- **AND** after a partner rename, the updated partner name is visible on discover for that partner's events

#### Scenario: Image tests skip when R2 is unavailable

- **WHEN** R2 / image env vars are not fully configured
- **THEN** image upload and remote-URL processing tests skip with an explicit reason string
- **AND** they do not fail the suite

#### Scenario: E2E docs do not require sharp-only local uploads

- **WHEN** an operator reads `e2e/README.md` image-test guidance
- **THEN** the docs do not state that admin uploads require `bun run dev` + `sharp` or that Workers preview cannot upload
