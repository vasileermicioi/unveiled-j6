# E2E tests (Playwright)

Repo-root Playwright harness for Gherkin-traced browser tests against the HonoX SSR app.

## Prerequisites

- Root `.env` with `DATABASE_URL`, `AUTH_URL`, and `SITE_URL` for auth/catalog flows (see `.env.example`).
- `bun run dev` serving at `http://localhost:3000` (default), **or** set `CI=true` so Playwright starts the dev server automatically.
- One-time browser install: `bunx playwright install chromium`

## Running tests

```bash
# Terminal 1 — local dev (skip if CI=true)
bun run dev

# Terminal 2 — smoke / feature specs
SITE_URL=http://localhost:3000 bun run test:e2e
```

Against staging:

```bash
SITE_URL=https://your-staging-host bun run test:e2e
```

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `SITE_URL` | Recommended | App origin (default `http://localhost:3000`) |
| `E2E_USER_EMAIL` | For auth specs | Member test account email |
| `E2E_USER_PASSWORD` | For auth specs | Member test account password |
| `E2E_ADMIN_EMAIL` | For admin specs | Admin test account email |
| `E2E_ADMIN_PASSWORD` | For admin specs | Admin test account password |

**Fallbacks (local only):**

1. **USER** — sign up at `/de/signup` with a disposable email; store credentials in `.env`.
2. **ADMIN** — promote the user in Postgres (`UPDATE users SET role = 'ADMIN' …`) or set `ADMIN_PROMOTE_EMAILS` in `.env`, then sign out/in. See `apps/web/DEPLOYMENT.md`.

Never commit real passwords. Placeholders live in `.env.example`.

## Selector policy (mandatory)

Playwright tests use **proximity and layout selectors only**:

| Allowed | Examples |
|---|---|
| `getByRole` | `getByRole('button', { name: /anmelden/i })` |
| `getByLabel` | `getByLabel(/e-?mail/i)` |
| `getByText` | `getByText('Discover')` |
| `filter({ has / hasText })` | `locator.filter({ hasText: 'Berlin' })` |
| Parent walks | `getByRole('main').getByRole('link')` |
| `nth()` | `getByRole('row').nth(1)` |

**Forbidden:**

- `data-testid` attributes added to production markup
- CSS class selectors (`.button--primary`, `.card__title`, …)
- `#id` selectors
- XPath aimed at implementation details

If a scenario cannot be asserted with allowed locators, fix the UI accessibility (labels, roles, visible text) — do not add test-only attributes.

## File and title conventions

| Rule | Example |
|---|---|
| Spec file basename = Gherkin feature basename | `static-pages.feature` → `e2e/specs/static-pages.spec.ts` |
| `test()` title = Gherkin `Scenario:` line verbatim | `Scenario: Home page redirects to default locale` |
| Scenario Outline rows | Separate tests named after outline + example row |

Harness-only specs (e.g. `smoke.spec.ts`) are not tied to a feature file.

## Fixtures

- `fixtures/base.ts` — extended `test` with `locale` option (default `'de'`).
- `fixtures/auth.ts` — `loginAsUser`, `loginAsAdmin` (email/password, proximity selectors).
- `fixtures/db.ts` — seed assertions via page navigation (e.g. `expectDiscoverHasEvents`), not direct DB queries.

## Ladle (component stories)

```bash
bun run stories
```

Starts two Ladle dev servers:

| Package | URL | Port |
|---|---|---|
| `@unveiled/ui` | http://localhost:61000 | 61000 |
| `@unveiled/web` | http://localhost:61001 | 61001 |

Ports are configured in each package's `.ladle/config.mjs`. Run a single package when you only need one library:

```bash
bun --filter @unveiled/ui stories
bun --filter @unveiled/web stories
```

Both servers use the production HeroUI Uber theme (`globals.css`) and yellow page background.

## CI notes

- Set `CI=true` so `e2e/playwright.config.ts` starts `bun run dev` via `webServer`.
- Google OAuth scenarios may require `test.skip` with an explicit reason when Neon test credentials are unavailable.
- Admin image-upload scenarios must run against local Node SSR (`bun run dev`), not Cloudflare Workers preview.
