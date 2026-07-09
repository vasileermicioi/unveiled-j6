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
| `S3_ENDPOINT` | For image upload specs | R2 S3 API host (no path) |
| `S3_REGION` | For image upload specs | Usually `auto` |
| `S3_BUCKET` | For image upload specs | Bucket name |
| `S3_ACCESS_KEY_ID` | For image upload specs | R2 access key |
| `S3_SECRET_ACCESS_KEY` | For image upload specs | R2 secret |
| `IMAGE_PUBLIC_BASE_URL` | For image upload specs | Public R2.dev / custom domain |

Image create/edit tests call `test.skip('R2 vars not configured')` when any of the six R2 vars is missing. **Admin uploads require local Node SSR** (`bun run dev` + `sharp`) — they do not work on Cloudflare Workers preview.

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

## Spec inventory

| Spec | Feature file | Notes |
|---|---|---|
| `specs/static-pages.spec.ts` | `static-pages.feature` | 9 scenarios; declining consent asserts fallback + no OSM tiles on public `/events/:id` |
| `specs/auth.spec.ts` | `auth.feature` | Core auth + outlines; see skip inventory below |
| `specs/onboarding.spec.ts` | `onboarding.feature` | 8 scenarios; fresh signup per mutating test |
| `specs/admin-partners.spec.ts` | `admin-partners.feature` | Partner CRUD; portal/QR scenarios skipped (no Phase 4 UI) |
| `specs/admin-events.spec.ts` | `admin-events.feature` | Event CRUD + public home (Discover) / `/events/:id`; image tests need R2 |
| `specs/event-discovery.spec.ts` | `event-discovery.feature` | 12 scenarios; member feed, filters, saved, map |

## Skip inventory

| Scenario | Spec | Reason / owner |
|---|---|---|
| Post-login routing — PARTNER | `auth.spec.ts` | No demo PARTNER credentials in seed; admin-provisioned only |
| Sign up or log in with Google | `auth.spec.ts` | Google OAuth — Neon test provider; verify manually on staging |
| Social login never creates PARTNER/ADMIN | `auth.spec.ts` | Same OAuth blocker |
| Request a data export | `auth.spec.ts` | Phase 9 — GDPR export |
| Request account deletion | `auth.spec.ts` | Phase 9 — self-service deletion |
| Account deletion vs subscription cancellation | `auth.spec.ts` | Phase 9 |
| Admin can process account deletion | `auth.spec.ts` | Phase 9 |
| Regenerate venue check-in QR token | `admin-partners.spec.ts` | Phase 4 — no admin UI (domain helper only) |
| Portal access (create / exists / email) | `admin-partners.spec.ts` | Phase 4 — portal access UI not built (Phase 8) |
| Event image as remote URL | `admin-events.spec.ts` | Admin form is upload-only; URL path is seed/CLI |
| Seed demo (empty env) | `admin-events.spec.ts` | Skips when catalog not empty (seed button hidden) |
| Image upload / logo processing | `admin-*.spec.ts` | `R2 vars not configured` when any of six R2 vars missing |

Cookie consent storage key: `unveiled:cookie-consent` (localStorage).

## CI notes

- On `main`, `.github/workflows/deploy-staging.yml` runs **quality → e2e → deploy**. E2E uses `SITE_URL=http://localhost:3000` and `CI=true` so `webServer` starts `bun run dev`.
- Required GitHub secrets and Phase 4½ operator docs: `apps/web/DEPLOYMENT.md` § Phase 4½ — Testing foundation.
- Google OAuth scenarios may require `test.skip` with an explicit reason when Neon test credentials are unavailable.
- Admin image-upload scenarios must run against local Node SSR (`bun run dev`), not Cloudflare Workers preview.
- Event **series** create: after preview the form remounts and the browser clears the file input — tests (and admins) must re-select the image on the confirm step before submitting.
