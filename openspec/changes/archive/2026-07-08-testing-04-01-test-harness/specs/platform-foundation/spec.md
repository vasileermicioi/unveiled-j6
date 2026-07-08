## ADDED Requirements

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
