# E2E tests (Playwright)

Repo-root Playwright harness for Gherkin-traced browser tests against the HonoX SSR app.

**Coverage inventory:** [`docs/product/testing/coverage-matrix.md`](../docs/product/testing/coverage-matrix.md) (Scenario → Playwright status). Selector and title rules: [`docs/product/testing/bdd-and-e2e.md`](../docs/product/testing/bdd-and-e2e.md).

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
| `DATABASE_URL` | For credits/booking specs | Seed subscription status + credits via `fixtures/billing.ts` |
| `E2E_STRIPE_CHECKOUT` | Optional (`1`) | Drive hosted Stripe Checkout in Playwright (needs webhook forwarding) |
| `STRIPE_*` / `RESEND_*` | Staging / local app | Required for real Checkout + confirmation email (see `DEPLOYMENT.md` Phase 6) |

Image create/edit tests call `test.skip('R2 vars not configured')` when any of the six R2 vars is missing. Admin uploads use **`@standardagents/sip`** and work against **`bun run dev`** (default) and, when configured, against a **Workers preview or staging** base URL (`SITE_URL` / Playwright `baseURL` + the same six R2 vars). Do not skip image specs solely because the host is Workers.

**Fallbacks (local only):**

1. **USER** — sign up at `/de/signup` with a disposable email; store credentials in `.env`.
2. **ADMIN** — promote the user in Postgres (`UPDATE users SET role = 'ADMIN' …`) or set `ADMIN_PROMOTE_EMAILS` in `.env`, then sign out/in. See `apps/web/DEPLOYMENT.md`.

Never commit real passwords. Placeholders live in `.env.example`.

## Selector policy (mandatory)

**Contract SoT:** [`docs/product/testing/bdd-and-e2e.md`](../docs/product/testing/bdd-and-e2e.md) (Gherkin Scenario titles + proximity/layout selectors).

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
- `fixtures/catalog.ts` — resolve seeded partner/event ids via `DATABASE_URL` + `@unveiled/db`.
- `fixtures/billing.ts` — harness-only subscription status / credit balance seeds for Phase 6 gates (not a product API).

## Stripe / payments (Phase 6)

**Policy:** Prefer Stripe **test mode** + webhook forwarding for real activation. Mock Checkout **only** by skipping the hosted Checkout scenario when Playwright cannot complete it; gate/booking scenarios seed `subscriptions` / `users.credits` through `fixtures/billing.ts` when `DATABASE_URL` is set. Never add production “test activate” routes.

| Path | When | How |
|---|---|---|
| Real Checkout | `E2E_STRIPE_CHECKOUT=1` and Stripe test keys on the app | Membership CTA → Stripe hosted page; forward webhooks locally |
| Seeded gates | Default CI / local without Checkout | `setSubscriptionStatus` / `activateMemberForBooking` |
| Staging proof | Release smoke | Test card `4242 4242 4242 4242` → `ACTIVE` → book → ticket + email (`DEPLOYMENT.md` Phase 6) |

Local webhook forward (app on `:3000`):

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Activation scenario skips unless `E2E_STRIPE_CHECKOUT=1`. Booking confirmation email skips in Playwright (no inbox harness) — verify in Resend on staging.

Focused run:

```bash
SITE_URL=http://localhost:3000 bunx playwright test --config e2e/playwright.config.ts \
  e2e/specs/credits-subscription.spec.ts e2e/specs/booking.spec.ts
```

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
| `specs/credits-subscription.spec.ts` | `credits-subscription.feature` | Phase 6 member gates; Checkout opt-in via `E2E_STRIPE_CHECKOUT=1` |
| `specs/booking.spec.ts` | `booking.feature` | Phase 6 book/confirm; waitlist/admin deferred |

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
| Activating via real Stripe Checkout | `credits-subscription.spec.ts` | Skips unless `E2E_STRIPE_CHECKOUT=1`; staging smoke is SoT |
| Recovering from past due | `credits-subscription.spec.ts` | Phase 7 — Customer Portal |
| Monthly renewal resets credits | `credits-subscription.spec.ts` | Billing package / webhook tests; no e2e renewal clock |
| Cancelling / period end / Reactivating | `credits-subscription.spec.ts` | Phase 7 — profile / portal |
| Admin credit / freeze / comp scenarios | `credits-subscription.spec.ts` | Phase 8 — admin ops |
| Sold out — automatic waitlist offer | `booking.spec.ts` | Phase 7 — waitlist UI |
| Redemption outline (SHARED / UNIQUE / VOUCHER) | `booking.spec.ts` | Seed lacks those modes; MANUAL covered |
| Idempotent retry | `booking.spec.ts` | Covered by `book-event.integration.test` |
| Booking confirmation email | `booking.spec.ts` | No inbox harness; staging Resend checklist |
| Admin cancel booking scenarios | `booking.spec.ts` | Phase 8 — admin cancel |

Cookie consent storage key: `unveiled:cookie-consent` (localStorage).

## CI notes

- On `main`, `.github/workflows/deploy-staging.yml` runs **quality → e2e → deploy**. E2E uses `SITE_URL=http://localhost:3000` and `CI=true` so `webServer` starts `bun run dev`.
- Required GitHub secrets and Phase 4½ operator docs: `apps/web/DEPLOYMENT.md` § Phase 4½ — Testing foundation.
- Google OAuth scenarios may require `test.skip` with an explicit reason when Neon test credentials are unavailable.
- Admin image-upload scenarios need R2 env vars; default CI/local target is `bun run dev`. Pointing Playwright at Workers preview/staging is supported when secrets and `SITE_URL` are set.
- Event **series** create: after preview the form remounts and the browser clears the file input — tests (and admins) must re-select the image on the confirm step before submitting.
