# Deployment — Unveiled Berlin (`@unveiled/web`)

Staging deployment for the HonoX SSR application. Update this file every phase when env vars or demo credentials change.

## Staging URL

| Environment | URL | Status |
|---|---|---|
| Staging | _TBD — set after first Workers deploy_ | Pending operator setup |

Target custom domain: `https://staging.unveiled.berlin` (configure in Cloudflare Workers when DNS is ready).

## Host

**Cloudflare Workers** — HonoX SSR via `@hono/vite-build/cloudflare-workers` and `wrangler.toml`.

**Admin image uploads** (file picker) generate the six JPEG variants **in the browser with Pica** (`@unveiled/images/client`) before the SSR form POST; the server validates and stores prebuilt variants (`persistPrebuiltImage`). Event admin UI is file-upload only. **JavaScript is required** for admin event/partner image supply. There is **no** `@standardagents/sip` / Worker-side resize.

Demo seed reads pre-baked `public/images/seed/**/*.jpg.variants/` packs (refresh with `bun scripts/fetch-abundo-seed.ts` then `bun scripts/bake-seed-image-variants.ts`).

**Migrating from older pipelines:** variant filenames remain `*.jpg`. Re-seed or re-upload if objects are missing; there is no automatic migration job.

Deploy artifacts:
- `apps/web/wrangler.toml` — Workers config, static assets binding
- `apps/web/vite.config.ts` — Workers production build (Node/Bun `bun run dev` unchanged for local SSR)

## Build and start

From repository root:

```bash
bun install
bun run build    # db:migrate (needs DATABASE_URL) + Workers-compatible @unveiled/web bundle
```

Local development (Bun/Node — same sip pipeline as Workers; supports admin image upload):

```bash
bun run dev
# http://localhost:3000
```

Workers preview (after build; requires wrangler secrets — see below; admin image uploads work here too):

```bash
cd apps/web && bun run dev:workers
```

Deploy to Cloudflare Workers:

```bash
bun run deploy:workers
```

Set wrangler secrets from repo-root `.env` (one-time per environment):

```bash
# Recommended — uploads DATABASE_URL, AUTH_URL, SITE_URL, and R2 vars from .env
bun run secrets:workers
```

Or set individually (prompts for each value):

```bash
cd apps/web
bunx wrangler secret put DATABASE_URL
bunx wrangler secret put AUTH_URL
bunx wrangler secret put SITE_URL
bunx wrangler secret put S3_ACCESS_KEY_ID
bunx wrangler secret put S3_SECRET_ACCESS_KEY
# Non-secrets can go in wrangler.toml [vars] or wrangler secret put:
bunx wrangler secret put S3_ENDPOINT
bunx wrangler secret put S3_REGION
bunx wrangler secret put S3_BUCKET
bunx wrangler secret put IMAGE_PUBLIC_BASE_URL
```

## Cloudflare Git import (Workers Builds)

Connect the GitHub repo in **Workers & Pages → your Worker → Settings → Builds**. This monorepo must build from the **repository root** (not `apps/web` alone — `workspace:*` deps require the root workspace).

| Setting | Value |
|---|---|
| **Root directory** | `/` (leave empty / repo root) |
| **Build command** | `bun run build` |
| **Deploy command** | `bun run deploy:workers` |

`bun run build` runs **`db:migrate` first** (Drizzle against `DATABASE_URL`), then the Workers bundle. Migrations fail the build if `DATABASE_URL` is missing or migrate errors.

Do **not** use `npx wrangler deploy` alone — Wrangler will refuse monorepo roots. The root `deploy:workers` script runs `bunx wrangler deploy --keep-vars --config apps/web/wrangler.toml`.

**Do not drop dashboard env vars on deploy:** `apps/web/wrangler.toml` sets `keep_vars = true`, and `deploy:workers` passes `--keep-vars`. Without that, Wrangler replaces plaintext vars with only the `[vars]` block and deletes dashboard-only keys (e.g. Stripe publishable / webhook / price, Resend). Encrypted **Secrets** already survive deploy; prefer Secrets (or `bun run secrets:workers`) for credentials. After a wipe, re-upload from root `.env` with `bun run secrets:workers`.

**Build variables** (Settings → Variables and secrets → **Build**):

| Variable | Value |
|---|---|
| `BUN_VERSION` | `1.3.14` (matches root `packageManager`; avoids Bun 1.2.x `catalog:` resolution bugs) |
| `DATABASE_URL` | Neon Postgres URL for the target environment (required — migrate runs at build) |
| `AUTH_URL` | Neon Auth API base URL (recommended on Build so build env matches runtime; not read by Drizzle migrate) |

Locally, root `.env` supplies the same vars (`bun --env-file=.env` on `db:migrate`).

**Runtime variables** (Settings → Variables and secrets — production checklist; prefer **Secret** type for credentials):

| Variable | Phase | Notes |
|---|---|---|
| `SITE_URL` | 1+ | Public site origin (no trailing slash) |
| `DATABASE_URL` | 2+ | Neon Postgres connection string |
| `AUTH_URL` | 2+ | Neon Auth API base URL (no trailing slash) |
| `S3_ENDPOINT` | 4+ | R2 S3 API host only |
| `S3_REGION` | 4+ | Usually `auto` |
| `S3_BUCKET` | 4+ | R2 bucket name |
| `S3_ACCESS_KEY_ID` | 4+ | R2 access key |
| `S3_SECRET_ACCESS_KEY` | 4+ | R2 secret key |
| `IMAGE_PUBLIC_BASE_URL` | 4+ | Public R2.dev / custom domain |
| `STRIPE_SECRET_KEY` | 6+ | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | 6+ | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | 6+ | Webhook signing secret |
| `STRIPE_PRICE_ID_BASIC_BERLIN` | 6+ | Basic Berlin price id |
| `RESEND_API_KEY` | 6+ | Resend API key |
| `DAILY_CODES_FROM_EMAIL` | 6+ | Verified From address |

Staging may still mirror `SITE_URL` / DB / Auth / R2 in `wrangler.toml` `[vars]` for convenience. Production should use dashboard Secrets + `bun run secrets:workers` so credentials are not committed; `keep_vars` keeps any dashboard-only plaintext vars across deploys.

**Verify after deploy:**

```bash
curl https://unveiled-j6.deepcode.xyz/api/health/runtime
# {"configured":{"AUTH_URL":true,"DATABASE_URL":true,"SITE_URL":true}}
```

If any value is `false`, check `apps/web/wrangler.toml` `[vars]` and redeploy.

Set secrets via dashboard or from repo-root `.env`:

```bash
cd apps/web
bunx wrangler secret put DATABASE_URL --config wrangler.toml
bunx wrangler secret put AUTH_URL --config wrangler.toml
bunx wrangler secret put SITE_URL --config wrangler.toml
```

Cloudflare runs `bun install --frozen-lockfile` automatically before your build command. Package versions are pinned explicitly in each `package.json` (not `catalog:`) so install works on CI.

**After first deploy:** set `SITE_URL` to your `*.workers.dev` URL (or custom domain). Schema migrations apply automatically on each `bun run build` (Cloudflare Builds / local) when `DATABASE_URL` is set. Run `bun run seed:demo` locally (or out-of-band) when the catalog is empty — seed is **not** part of build.

## Environment variables

**Local development:** Bun loads a gitignored `.env` at the **repository root** (see [`.env.example`](../../.env.example) for a safe template). Do not commit secrets.

**Phase 2 staging requires `DATABASE_URL`, `AUTH_URL`, and `SITE_URL`.** Without `DATABASE_URL` and `AUTH_URL`, auth pages render but session resolution, route protection, and provisioning are disabled. Local marketing-only dev works without them; auth demos and staging deploys must set all three.

Phase 1 requires `SITE_URL` on staging/production for absolute canonical, Open Graph, and sitemap URLs. Local development defaults to `http://localhost:3000` when unset.

**Phase 4 staging+ requires the six R2 variables below** for admin image upload and public event images. Unit tests for `@unveiled/images` can run without R2; end-to-end catalog demos cannot.

| Variable | Required | Phase | Description |
|---|---|---|---|
| `PORT` | Host-injected | 0 | HTTP listen port (default `3000` locally) |
| `SITE_URL` | **Yes (staging/prod)** | 1+ | Public origin for canonical, OG, robots, and sitemap URLs (e.g. `https://staging.unveiled.berlin`; local: `http://localhost:3000`) |
| `DATABASE_URL` | **Yes (Phase 2 staging+)** | 2+ | Neon Postgres connection string |
| `AUTH_URL` | **Yes (Phase 2 staging+)** | 2+ | Neon-provided Better Auth backend API URL; `/api/auth/*` forwards to this target |
| `S3_ENDPOINT` | **Yes (Phase 4 staging+)** | 4+ | Cloudflare R2 S3 API endpoint — `https://<account-id>.r2.cloudflarestorage.com` only (no bucket path) |
| `S3_REGION` | **Yes (Phase 4 staging+)** | 4+ | R2 region — use `auto` |
| `S3_BUCKET` | **Yes (Phase 4 staging+)** | 4+ | R2 bucket name (e.g. `unveiled-j6`) |
| `S3_ACCESS_KEY_ID` | **Yes (Phase 4 staging+)** | 4+ | R2 API token access key |
| `S3_SECRET_ACCESS_KEY` | **Yes (Phase 4 staging+)** | 4+ | R2 API token secret |
| `IMAGE_PUBLIC_BASE_URL` | **Yes (Phase 4 staging+)** | 4+ | Public read base URL for variants (R2.dev subdomain or custom domain) — **not** the S3 API endpoint |
| _(none for map)_ | — | 5+ | Event map uses **MapLibre GL JS** + **OpenStreetMap** tiles — no API key |
| `STRIPE_SECRET_KEY` | **Yes (Phase 6 staging+)** | 6+ | Stripe secret key (**test mode** on staging) |
| `STRIPE_PUBLISHABLE_KEY` | **Yes (Phase 6 staging+)** | 6+ | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | **Yes (Phase 6 staging+)** | 6+ | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_BASIC_BERLIN` | **Yes (Phase 6 staging+)** | 6+ | Stripe price ID for Basic Berlin plan |
| `RESEND_API_KEY` | **Yes (Phase 6 staging+)** | 6+ | Resend API key for transactional email |
| `DAILY_CODES_FROM_EMAIL` | **Yes (Phase 6 staging+)** | 6+ | Sender address for booking confirmation + daily code emails |
| `SENTRY_DSN` | — | 8+ (optional) | Server-side Sentry via `@sentry/cloudflare` — PII-free; app boots when unset. Not gated by cookie consent. |

### Cloudflare R2 (Phase 4)

The image pipeline stores six JPEG variants per upload under `images/{uuid}/{variant}.jpg` in the bucket. Public URLs are `{IMAGE_PUBLIC_BASE_URL}/images/{uuid}/medium-640.jpg` (and sibling variant filenames — see `docs/product/extras/image-uploads.md`). Demo seed (`bun run seed:demo`) uses the same `@unveiled/images` sip path and writes `.jpg` keys.

If the bucket still has objects from the old WebP pipeline (`*.webp`), re-seed or re-upload so public/admin pages resolve `.jpg` variants — see the Host section migration note above.

**1. Create bucket** — Cloudflare Dashboard → **R2** → create bucket (e.g. `unveiled-j6`).

**2. S3 API endpoint** — Bucket → **Settings** → **S3 API**. Cloudflare shows a URL like:

```text
https://<account-id>.r2.cloudflarestorage.com/unveiled-j6
```

Split it for env vars:

| Cloudflare shows | Env var | Value |
|---|---|---|
| Host + account id | `S3_ENDPOINT` | `https://<account-id>.r2.cloudflarestorage.com` |
| Path segment | `S3_BUCKET` | `unveiled-j6` |
| (fixed for R2) | `S3_REGION` | `auto` |

**3. API credentials** — **R2 → Manage R2 API Tokens → Create API token** with **Object Read & Write** on the bucket. Copy **Access Key ID** → `S3_ACCESS_KEY_ID`, **Secret Access Key** → `S3_SECRET_ACCESS_KEY` (shown once).

**4. Public access** — Bucket → **Settings** → enable **Public access** / R2.dev subdomain. Copy the public URL (e.g. `https://pub-xxxxxxxx.r2.dev`) → `IMAGE_PUBLIC_BASE_URL` with no trailing slash.

**5. Workers** — Add the same six R2 vars as wrangler secrets (or `[vars]` for non-sensitive) before catalog demos on staging.

**Optional sanity check** (after `@unveiled/images` exists):

```bash
AWS_ACCESS_KEY_ID=$S3_ACCESS_KEY_ID AWS_SECRET_ACCESS_KEY=$S3_SECRET_ACCESS_KEY \
  aws s3 ls "s3://$S3_BUCKET" --endpoint-url "$S3_ENDPOINT"
```

Expect an empty listing or object keys — not an auth error.

**Admin event/partner upload smoke test** (Phase 4 catalog — Workers or local):

1. Sign in as ADMIN with all six R2 vars set (Workers `[vars]` or root `.env`).
2. Use the staging Workers URL (`bun run deploy:workers` / `dev:workers`) or `bun run dev`.
3. Open `/:locale/admin/partners/new` (or `/:locale/admin/events/new`), choose a JPEG ≥ 800×420 px, submit.
4. Confirm redirect success and the new row shows a `small-320.jpg` thumbnail.
5. Edit without a new file — thumbnail unchanged. Edit with a new file — thumbnail updates.
6. In the R2 bucket, confirm six objects under `images/{uuid}/` for the image id.

## Cloudflare Workers setup (GitHub import)

**Staging deploy is not done from GitHub Actions.** Connect the repo in Cloudflare (**Workers & Pages → Create → Import a repository** / Worker Builds) and let Cloudflare build + deploy on push. See [Cloudflare Git import (Workers Builds)](#cloudflare-git-import-workers-builds) for root directory, build/deploy commands, and `BUN_VERSION`.

GitHub Actions (`.github/workflows/deploy-staging.yml`) only runs **quality + e2e** on `main`. It does **not** call `wrangler deploy` and does **not** need `CLOUDFLARE_API_TOKEN`.

Optional local/CLI helpers (operator machine, after `wrangler login` or a personal API token):

```bash
bun run secrets:workers   # one-time / when env changes
bun run deploy:workers    # manual deploy outside Git import
```

## Phase 2 step 02 verification

With `DATABASE_URL` and `AUTH_URL` set:

1. `curl -s http://localhost:3000/api/auth/get-session` returns a Better Auth JSON body (typically `null` when unsigned in), **not** the HTML 404 page
2. Response headers include Neon Auth / Better Auth upstream markers (e.g. `access-control-allow-credentials`)
3. `bun run lint` and `bun run typecheck` pass
4. `cd packages/auth && bun test` — `requireAuth` returns 401 without session; provisioning integration runs when `DATABASE_URL` is set

**Auth proxy wiring:** `/api/auth/*` is registered in `apps/web/app/server.ts` **before** the HonoX locale catch-all (`/:locale/*` would otherwise match `/api/...`). Forward logic lives in `apps/web/app/lib/auth-proxy.ts`.

**Provisioning:** first valid session resolve calls `provisionNewUser` in `@unveiled/auth` (see `packages/auth/README.md`).

## Phase 2 release gate (auth step 04)

Phase 2 is complete when staging supports the full auth loop with route protection and authenticated navbar. **Required env vars on Workers:** `DATABASE_URL`, `AUTH_URL`, `SITE_URL`.

### Test user (staging)

Create a test member on staging:

1. Open `https://<staging-host>/de/signup` (replace with staging URL from the table above).
2. Register with email/password and first/last name, or use **Continue with Google** (Neon Auth provider must be enabled).
3. After signup, confirm starter state in Neon Postgres (`public.users` + `public.subscriptions`):
   - `role = USER`
   - `credits = 17`
   - `subscriptions.status = INACTIVE`
   - `profile.onboarding_complete = false`
4. Alternatively, inspect or create users in the Neon Auth console — app rows are provisioned on first session resolve.

Document any shared staging demo credentials in [Demo accounts](#demo-accounts) when provisioned for client demos.

### Admin account setup

Every signup (email or Google) provisions `role = USER` with 17 credits. **There is no self-service admin signup.** To access `/admin/*`, promote an existing user in Postgres:

```sql
UPDATE public.users
SET role = 'ADMIN', updated_at = NOW()
WHERE email = 'your@email.com';
```

Then **sign out and sign in again** (or open `/de/auth/continue`) so the session reloads the updated role. After login, `/de/auth/continue` redirects `ADMIN` → `/de/admin` and the navbar shows an Admin link.

**Staging/dev shortcut:** set `ADMIN_PROMOTE_EMAILS=your@email.com` in Workers `[vars]` / secrets or root `.env`. On the next session resolve, matching `USER` accounts are promoted to `ADMIN` automatically. Use only on non-production environments.

### Google OAuth (Neon Auth)

Google sign-in is configured in the **Neon Auth project dashboard**, not via app environment variables.

1. Open the Neon project → **Auth** → **Providers**.
2. Enable **Google** and paste your Google Cloud OAuth client ID and secret.
3. Add authorized redirect URIs from the Neon Auth dashboard to your Google OAuth client (Neon shows the callback URL).
4. Repeat for staging and production Neon branches/projects as needed.
5. Verify on staging: `/de/login` and `/de/signup` show **Continue with Google**; completing OAuth creates or signs into a `USER` account with starter provisioning (17 credits, `INACTIVE` subscription).

No `GOOGLE_*` env vars are required in `apps/web` — the proxy at `/api/auth/*` forwards OAuth flows to `AUTH_URL`.

### Client demo checklist

With `DATABASE_URL` and `AUTH_URL` set on staging:

1. `bun run lint`, `bun run typecheck`, and `bun run build` pass in CI
2. `/de/login` and `/en/signup` render HeroUI auth forms on yellow background
3. Email signup creates a session; navbar shows credits badge and logout
4. Logout returns to guest navbar with login/signup links
5. Forgot-password flow sends a reset email; reset-password completes
6. Google OAuth sign-in works (Neon Auth provider configured)
7. Unauthenticated `/de/events` (or `/en/profile`) → redirect to `/:locale/login`
8. Signed-in USER visiting `/de/partner` or `/de/admin` → redirect to `/de`
9. `/de` and `/en` load without browser console errors (guest and signed-in)
10. `curl -s $SITE_URL/api/auth/get-session` returns Better Auth JSON, not HTML 404

**Neon Auth setup:** Enable Neon Auth on the Postgres project; copy `AUTH_URL` from the Neon dashboard into Worker env.

**Trusted domains (required for staging/production):** Neon Auth (Better Auth) rejects cookie-backed POSTs (`sign-out`, `sign-in`, etc.) with **403 `INVALID_ORIGIN`** unless the browser origin is allowlisted. Localhost is pre-approved; custom hosts are not.

1. Neon Console → **Auth** → **Configuration** → **Domains**
2. Add exact origins (protocol, no trailing slash), e.g. `https://unveiled-j6.deepcode.xyz`
3. Add any other public hosts (`*.workers.dev`, custom domain) the same way

Verify: signed-in logout from `/en/admin` should return 200 (not 403). Without cookies, `POST /api/auth/sign-out` can still return 200 — the CSRF origin check only runs when session cookies are present.

**Route protection:** Locale middleware in `apps/web/app/routes/[locale]/_middleware.tsx` uses `apps/web/app/lib/auth-middleware.ts` — guarded prefixes: `events`, `saved`, `bookings`, `profile`, `partner`, `admin`, `onboarding`.

**Onboarding middleware:** Same locale middleware uses `apps/web/app/lib/onboarding-middleware.ts` — incomplete USERs hitting member app prefixes redirect to their current onboarding step; complete USERs hitting `/onboarding/*` redirect to `/events`; PARTNER/ADMIN are never sent into the wizard.

## Phase 3 release gate (onboarding step 04)

Phase 3 is complete when staging supports the full four-step onboarding wizard, skip-age flow, onboarding guards, and membership redirect without console errors on `/de` and `/en`. **Required env vars remain the same as Phase 2:** `DATABASE_URL`, `AUTH_URL`, `SITE_URL` — no new application secrets for Phase 3.

**Client demo line:** *"After signup, we capture vibes, districts, and timing — same as the product vision."*

### Prerequisites

1. Phase 2 release gate passed on staging (auth loop, route protection, navbar).
2. Drizzle migrations applied (via `bun run build` / Cloudflare Builds with Build-time `DATABASE_URL`, or `bun run db:migrate`).
3. `robots.txt` disallows `/*/onboarding/`; each onboarding page renders `<meta name="robots" content="noindex">`.

### Full onboarding demo script

Use a **new signup** or reset an existing test user (see [Repeat demo reset](#repeat-demo-reset) below).

1. Open `https://<staging-host>/de/signup` and register a new USER (email/password or Google OAuth).
2. After signup, confirm redirect to `/de/onboarding/age` (or current resumed step).
3. **Step 1 — Age:** select an age group (e.g. `26-35`) and continue, **or** skip without selecting.
4. **Step 2 — Interests:** select at least one interest and mood; submit → `/de/onboarding/location`.
5. **Step 3 — Location:** select districts and set travel radius (1–25 km); submit → `/de/onboarding/timing`.
6. **Step 4 — Timing:** select timing, preferred days, languages, and accessibility toggle; submit → `/de/membership`.
7. In Neon Postgres, inspect `public.users.profile` for the test user:
   - `onboarding_complete = true`
   - Captured arrays (`interests`, `moods`, `districts`, `timing`, `preferred_days`, `preferred_languages`) and flags (`accessibility`, optional `age_group`) populated
   - `behavior.onboarding_completed_at` set (Europe/Berlin ISO timestamp)
8. Repeat steps 1–7 on `/en/onboarding/*` to confirm EN locale parity.

### Skip-age flow

1. Sign up a fresh USER (or reset profile — see below).
2. On `/de/onboarding/age`, submit **Skip** without selecting an age group.
3. Complete steps 2–4; land on `/de/membership`.
4. Confirm `profile.age_group` is absent/null and `onboarding_complete = true`.

### Returning complete user

1. With a USER who has `onboarding_complete = true`, navigate to `/de/onboarding/age`.
2. Confirm redirect to `/de/events` (same for any `/onboarding/*` step).
3. Confirm `/de/events` is reachable without onboarding redirect.

### Repeat demo reset

To run the demo again without creating a new account:

**Path A — fresh signup:** use a new email each time (simplest for client demos).

**Path B — SQL reset** (Neon SQL editor, replace `<user_id>`):

```sql
UPDATE public.users
SET
  profile = jsonb_set(
    COALESCE(profile, '{}'::jsonb),
    '{onboarding_complete}',
    'false'::jsonb
  )
  - 'age_group'
  - 'interests'
  - 'moods'
  - 'districts'
  - 'max_distance'
  - 'timing'
  - 'preferred_days'
  - 'preferred_languages'
  - 'accessibility',
  behavior = COALESCE(behavior, '{}'::jsonb)
    - 'onboarding_step'
    - 'onboarding_completed_at'
    - 'preferences_updated_at'
WHERE id = '<user_id>';
```

After reset, visiting `/de/events` should redirect back to `/de/onboarding/age`.

### Console and role checks

1. Load `/de/onboarding/age` and `/en/onboarding/timing` while signed in as an incomplete USER — browser console shows **no errors**.
2. **Optional:** if a PARTNER staging account exists, confirm it is **not** redirected into `/onboarding/*` when visiting member routes.

### Automated verification (local / CI)

```bash
bun run lint
bun run typecheck
bun run build
cd packages/auth && bun test
cd apps/web && bun test
```

Integration tests in `packages/auth/src/onboarding.test.ts` run the full save + complete round-trip when `DATABASE_URL` is set; otherwise they skip with a warning.

## Admin list pagination testing (dev / staging)

Admin partner and event lists use a fixed page size of **25** (`ADMIN_LIST_PAGE_SIZE` in `apps/web/app/lib/admin-content.ts`). There is no `?pageSize=` query param.

To manually exercise pagination, search, and page clamp:

```bash
# Default: 30 partners + 30 events (2+ pages each at size 25)
bun run seed:admin-pagination

# Custom counts; --reset removes prior pagination seed rows first
bun run seed:admin-pagination -- --reset --partners=35 --events=40

# Remove pagination seed rows only
bun run seed:admin-pagination -- --reset --partners=0 --events=0
```

Rows are prefixed **Pagination Partner** / **Pagination Event** so they are easy to find and safe to delete with `--reset`. By default the script uploads generated logo and event images to R2 so admin list thumbnails load (requires all `S3_*` vars and `IMAGE_PUBLIC_BASE_URL` in root `.env`). Pass `--skip-upload` for DB-only rows without thumbnails.

After seeding, sign in as ADMIN and verify:

1. `/de/admin/partners?page=2` — second page of partners
2. `/de/admin/events?q=Pagination&page=2` — filtered event list
3. `/de/admin/partners?page=99` — redirects to the last valid page

## Phase 4 release gate (catalog step 05)

Phase 4 is complete when staging supports the admin → public catalog loop with real R2 images. **Required env vars:** Phase 2 trio (`DATABASE_URL`, `AUTH_URL`, `SITE_URL`) **plus** all six R2 vars (see [Cloudflare R2](#cloudflare-r2-phase-4)). Copy local root `.env` R2 values to Workers (`bun run secrets:workers` or `[vars]`) before the client demo.

**Client demo line:** *"Back office is live. I upload an event photo, publish, and it instantly appears on the public discovery page."*

### Prerequisites

1. Phase 3 release gate passed; Drizzle migrations include `images`, `partners`, `events`.
2. ADMIN user exists — promote via SQL or `ADMIN_PROMOTE_EMAILS` (see [Admin account setup](#admin-account-setup)); signing up alone does **not** create an admin.
3. R2 bucket public access enabled; `IMAGE_PUBLIC_BASE_URL` loads in a browser.

### Catalog demo script

1. Schema migrated via `bun run build` (or `bun run db:migrate`) against staging `DATABASE_URL`.
2. Sign in as ADMIN → `/de/admin`. If DB empty, run **Seed demo data** or `bun run seed:demo`. To replace an existing catalog with fresh Berlin venue demo data: `bun run seed:demo -- --reset` (deletes all partners and events first; also removes pagination seed rows). Fresh seed also features a small upcoming subset for Discover.
3. Create a partner with logo (upload or URL) → appears on `/de/admin/partners`.
4. Create an event with image → listed on `/de/admin/events`. Add it under **Featured** (`/de/admin/featured`) if it should appear on Discover.
5. Open `/de/discover` — admin-featured upcoming events appear (not the full upcoming catalog).
6. Open `/de/events/:id` **without login** — hero srcset, event copy, `og:image` uses `og-1200x630` variant URL under `IMAGE_PUBLIC_BASE_URL`.
7. View Source — Event JSON-LD stub and unique `<title>` / meta description.

### Automated verification

```bash
bun run lint
bun run typecheck
bun run build
cd packages/db && bun test    # when catalog domain tests exist
cd packages/images && bun test
cd packages/ui && bun run typecheck
```

Public catalog surfaces (`@unveiled/ui` EventCard, locale-home Discover live grid, `/events/:id` detail) require `DATABASE_URL` and `IMAGE_PUBLIC_BASE_URL` for full smoke tests locally.

### Demo seed images (Wikimedia Commons)

`bun run seed:demo` inserts Berlin partners/events from the Abundo fixture (`packages/db/src/catalog/fixtures/abundo-berlin-demo.json`) using **prebuilt variant packs** next to local JPEGs in `public/images/seed/{partners,events}/` (`*.jpg.variants/`), then features a small upcoming subset (`tonight`, theater, Ausstellung demos) on Discover via `featured_events`, and attaches **≥2 gallery images** to the featured theater demo (`DEMO_DISCOVERY_TITLES.theaterFuture`) for public detail slider demos. Refresh fixture + images with `bun run seed:fetch-abundo` then `bun scripts/bake-seed-image-variants.ts`. Seed uploads the six JPEG variants to R2 via `persistPrebuiltImage` (no Worker resize). Existing catalogs seeded before Featured Discover / Featured Event Gallery need `seed:demo -- --reset` (or manual Featured tab + gallery uploads) to populate Discover and the demo gallery.

```bash
# Fresh catalog on empty DB
bun run seed:demo

# Replace existing partners/events (destructive)
bun run seed:demo -- --reset

# DB rows only, skip R2 upload (faster local smoke without images)
bun run seed:demo -- --reset --skip-upload

# Find new Commons image URLs for seed-data.ts
bun scripts/resolve-commons-images.ts "Deutsches Theater Berlin building"
```

Image filenames and licenses are listed in `packages/db/src/catalog/seed-data.ts`. Prefer CC/public-domain Commons files; verify attribution on the file description page before changing production seed data.

## Phase 4½ — Testing foundation

Phase 4½ is complete when Ladle stories cover Phase 0–4 UI, Playwright covers the five Phase 0–4 Gherkin feature files (with marked skips only), and CI runs `bun run test:e2e` against local SSR before staging deploy. Root scripts: `bun run stories`, `bun run test:e2e` (see also [`e2e/README.md`](../../e2e/README.md)).

**Client demo line:** *"Every page and component we built so far has isolated stories; every Gherkin scenario from the spec has an automated browser test."*

### Stories (Ladle)

```bash
bun run stories
# @unveiled/ui  → http://localhost:61000
# @unveiled/web → http://localhost:61001
```

Single package: `bun --filter @unveiled/ui stories` or `bun --filter @unveiled/web stories`.

### Playwright E2E (local)

Prerequisites: root `.env` with `DATABASE_URL`, `AUTH_URL`, `SITE_URL`, and `E2E_USER_*` / `E2E_ADMIN_*` (see [`.env.example`](../../.env.example)). One-time: `bunx playwright install chromium`. Optional six R2 vars enable image-upload specs; without them those tests call `test.skip('R2 vars not configured')`.

```bash
# Playwright starts `bun run dev` via webServer (reuses a healthy local server when CI is unset)
SITE_URL=http://localhost:3000 bun run test:e2e
```

Against staging (manual gate — not the primary CI target):

```bash
SITE_URL=https://<staging-host> bun run test:e2e
```

Selector policy, spec inventory, and skip inventory: [`e2e/README.md`](../../e2e/README.md).

### CI behavior (`.github/workflows/deploy-staging.yml`)

On push to `main`: **quality** (lint → typecheck → build, including `db:migrate`) → **e2e** (timeout 20m). E2E failure fails the workflow. **Workers deploy is separate** — Cloudflare GitHub repo import / Workers Builds deploys on push; this workflow does not run `wrangler deploy` and does not use `CLOUDFLARE_API_TOKEN`. Quality **Build** needs GitHub secrets `DATABASE_URL` (+ `AUTH_URL` recommended).

The e2e job uses `SITE_URL=http://localhost:3000` and `CI=true` so Playwright’s `webServer` starts local Node SSR (`bun run dev` + sip). It runs `bun run db:migrate` against the CI `DATABASE_URL` (use a **CI-dedicated** Neon branch — never `seed:demo -- --reset` against shared staging). Image specs self-skip when R2 secrets are absent.

#### GitHub Actions secrets (names only)

| Secret | Required for CI e2e | Purpose |
|---|---|---|
| `DATABASE_URL` | **Yes** | Neon Postgres (prefer a CI-dedicated branch) |
| `AUTH_URL` | **Yes** | Neon Auth Better Auth URL |
| `E2E_USER_EMAIL` / `E2E_USER_PASSWORD` | **Yes** | Member test account |
| `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` | **Yes** | Admin test account |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL` | Optional | Enables admin image-upload E2E |

If required E2E secrets are empty, the e2e job fails early with a clear error (does not silently skip auth). **Follow-up owner:** repo admin — provision the six required secrets in GitHub → Settings → Secrets and variables → Actions before the first green `main` run after this workflow lands.

### Known marked skips (allowed)

| Area | Deferral / owner |
|---|---|
| GDPR export / delete / admin deletion (`auth.spec.ts`) | Phase 9 |
| Google OAuth signup/login (`auth.spec.ts`) | Manual staging + Neon Google provider; not automatable in headless CI without a test OAuth client |
| Partner portal access / QR regenerate (`admin-partners.spec.ts`) | Phase 8 / no Phase 4 admin UI |
| Image upload when R2 secrets missing | Conditional skip — provision optional R2 secrets to enable |
| PARTNER post-login routing | No demo PARTNER seed credentials |

Unmarked skips or hard failures fail the Phase 4½ gate.

### Phase 4½ demo script

1. `bun run stories` — open UI and web Ladle; spot-check EventCard CTA states and a marketing/admin layout story.
2. Ensure demo USER/ADMIN exist (or sign up + promote admin); set `E2E_*` in root `.env`.
3. `bun run db:migrate` (and `bun run seed:demo` if the catalog is empty).
4. `SITE_URL=http://localhost:3000 bun run test:e2e` — suite green aside from documented marked skips.
5. Optional: `SITE_URL=https://<staging-host> bun run test:e2e` for a staging smoke pass (admin image upload still needs local Node SSR, not Workers).

### Automated verification

```bash
bun run lint
bun run typecheck
bun run build
bun run stories   # spot-check servers
bun run test:e2e
```

**Local gate note (2026-07-09):** `bun run build` and Ladle story servers (`:61000` / `:61001`) succeed. `bun run lint` / `bun run typecheck` currently fail on pre-existing repo issues outside this step’s scope. `bun run test:e2e` reported 34 passed / 14 skipped / 24 failed (auth login timeouts and admin form flows) — investigate credentials/Neon Auth and admin UI stability before treating Phase 4½ as fully green on CI. Provision GitHub E2E secrets (repo admin) so the new workflow can run on `main`.

## Phase 5 — Member discovery

Phase 5 is complete when signed-in members can browse all upcoming events (soonest first), optionally filter by category/partner/date range, paginate, save/unsave, open event detail, and view the filtered set on the MapLibre + OSM map — with Ladle stories and Playwright coverage for every scenario in `docs/product/features/event-discovery.feature`. **Booking / Stripe remains Phase 6** — CTAs link to membership or detail with a “booking coming soon” banner only.

**Client demo line:** *"This is the member app — filter by neighborhood, save favorites, map view."* (Booking still locked until Phase 6.)

### Routes

| Route | Auth | Notes |
|---|---|---|
| `/:locale/events` | USER / ADMIN | Today default; GET filters `category`, `partnerId`, `from`, `to`, `page` |
| `/:locale/saved` | USER / ADMIN | Upcoming saved events (not today-only) |
| `/:locale/events/map` | USER / ADMIN | Same filters as feed (no `page`); MapLibre after cookie consent |
| `POST /:locale/events/:id/save` / `unsave` | Session user | Guest → login with `returnTo` |

### Demo seed titles (stable E2E anchors)

After `bun run seed:demo` (use `-- --reset` only on a disposable DB):

| Title | Role |
|---|---|
| `DEMO_DISCOVERY_TITLES.tonight` (Abundo; prefixed `Tonight:`) | Today (Berlin evening) + coords — default feed |
| `DEMO_DISCOVERY_TITLES.pastHidden` (prefixed `Past Premiere:`) | Past — must stay hidden from feed/map |
| `DEMO_DISCOVERY_TITLES.theaterFuture` | Future Theater + coords (booking e2e); **also hosts ≥2 seeded gallery images** |
| `DEMO_DISCOVERY_TITLES.ausstellung` | Future Ausstellung |
| `DEMO_DISCOVERY_TITLES.konzert` | Future Konzert (no gallery — useful for empty-gallery checks) |
| `Sold Out: Waitlist Demo Night` | Sold-out waitlist demo |

Categories align with onboarding `INTERESTS` (`Theater`, `Ausstellung`, `Konzert`, …). All published demo events include `lat`/`lng` for map markers.

### Featured Event Gallery demo script

1. Fresh seed: `bun run seed:demo` (or `-- --reset` on a disposable DB).
2. As guest, open public detail for the theater featured demo → end-of-page **Galerie / Gallery** with ≥2 thumbs → open slider → next/prev/close.
3. As ADMIN → event edit → **Galerie / Gallery** → add multiple photos (Pica) → list shows capacity `N / 12` → remove one via discrete action or multi-select confirm.
4. Confirm primary hero on cards/detail is unchanged; Discover featured curation is independent of gallery display.

### Phase 5 demo script

1. Sign in as the demo USER (`E2E_USER_*` or staging member).
2. Open `/:locale/events` — confirm **All upcoming events** / **Alle kommenden Events** and the seeded `Tonight: …` title (`DEMO_DISCOVERY_TITLES.tonight`) near the top (soonest first).
3. Apply filters (category / partner / date range) → reset → empty range shows no-results copy.
4. Save an event → open **Saved** (`/:locale/saved`) → unsave.
5. From the feed, open **Map view** (accept cookies if prompted) → markers match filters → **Open event** / list link (no booking POST).
6. Confirm book/unlock CTAs go to membership or detail only — no Stripe checkout yet.

### Map / CSP notes

Declining non-essential cookies stores `unveiled:cookie-consent` and shows a static address-list fallback on `/events/map` (no OSM tile requests). Accepting consent loads MapLibre + `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. No map API keys. If Workers CSP is added later, allow that tile host (and MapLibre workers) — see Phase 1 cookie note above.

### Automated verification (Phase 5)

```bash
bun run lint
bun run typecheck
bun run stories   # discovery stories under apps/web (port 61001)
SITE_URL=http://localhost:3000 bun run test:e2e  # includes e2e/specs/event-discovery.spec.ts
```

**Local gate note (2026-07-09):** Discovery deliverables are in place. Touched files pass `biome check`. Repo-wide `bun run lint` / `bun run typecheck` still fail on pre-existing issues (AbortSignal / Hono Context) outside this step. Ladle `@unveiled/web` serves discovery stories on `:61001`. `e2e/specs/event-discovery.spec.ts` — 12/12 scenarios green (Neon Auth signup can flake once; suite uses `retries: 1`). Re-seed with `bun run seed:demo -- --reset` after pulling seed changes so tonight/past/coords titles exist. Staging deploys via Cloudflare GitHub import (Workers Builds), not a GitHub Actions wrangler token.

## Phase 5.5 — Spec alignment & debt remediation

Phase 5.5 closes UI DS ownership, BDD locator/coverage debt, and sitemap/journey alignment **before** Stripe/booking (Phase 6). **No** `packages/billing`, booking mutation routes, Stripe Checkout, or Resend were introduced in this phase. Env vars are unchanged from Phase 5.

### Sitemap / journey alignment (already aligned + one fix)

Spot-check vs `docs/product/sitemap/sitemap.md` (2026-07-11):

| Check | Result |
|---|---|
| `/:locale` = Discover (marketing + curated preview) | Aligned |
| `/:locale` → guest marketing home; `/:locale/discover` → Discover | Aligned |
| Bare `/discover` → **302** `/:locale/discover` (`Accept-Language`) | Aligned (`apps/web/app/routes/discover.tsx`) |
| Preview EventCard → public `/events/:id` (no auth) | Aligned |
| Browse CTA → `signup?returnTo=/:locale/events` | Aligned (step 04) |
| Guest `/events` → login with `returnTo` | Aligned |
| Guests have no public full feed | Aligned |

**Named deferrals** (do not block Phase 6): see `.dev-plan/current-iteration/spec-alignment-parent-guide.md` — Google OAuth/GDPR e2e → Phase 8; onboarding finish ignores `returnTo` (lands on `/membership`) → Phase 8; typography utility polish → Phase 8; booking/credits/waitlist/profile/admin-users e2e → Phases 6–8; partner portal/QR → post-MVP.

### Phase 5.5 demo script

1. `bun run stories` — open **Theme Overview** under `@unveiled/ui` (brand yellow `#FAFF86`, primary/secondary CTAs, sample card/chips).
2. As a guest, open `/:locale` (Discover) → click a preview “Book Now” / “Bin dabei” → land on public `/events/:id` without login.
3. Confirm `/:locale` is guest home, `/:locale/discover` is Discover, and `/discover` **302**s to localized Discover.
4. Confirm guest `/events` redirects to signup/login; e2e Scenario titles match Gherkin (`docs/product/testing/coverage-matrix.md`).

### Automated verification (Phase 5.5)

```bash
bun run lint
bun run typecheck
bun run stories   # Theme Overview under @unveiled/ui (port 61000)
SITE_URL=http://localhost:3000 bun run test:e2e
```

**Local gate note (2026-07-11):** Touched route `apps/web/app/routes/discover.tsx` passes `biome check`. Theme Overview reachable on Ladle `:61000`. Sitemap-related Playwright scenarios (Discover preview/CTA, guest public detail, guest `/events` gate, legacy `/discover`) — **6/6 passed**. Full `static-pages` + `event-discovery` suite: 21 passed / 4 failed on Neon Auth signup→onboarding flake in member feed/save/map scenarios (pre-existing flake class; not introduced by sitemap redirect). Repo-wide `bun run lint` / `typecheck` still fail on pre-existing Hono Context / biome debt outside this step. Staging deploys via Cloudflare GitHub import (Workers Builds).

Confirm staging after Cloudflare Builds finishes on `main`. Record the Workers URL / date below after a successful deploy. Local smoke of Discover + public detail + `/discover` 301 still required when reviewing locally.

| Environment | URL / evidence | Date |
|---|---|---|
| Staging | Blocked at the time — Cloudflare Git import / Builds not verified in that session. Local smoke OK: Discover → public detail 200; `/de/discover` + `/discover` 301 → locale home; guest `/events` → login. | 2026-07-11 |

## Phase 6 — Payments & booking

Phase 6 closes the member money loop: **Stripe Checkout** (Basic Berlin) → `ACTIVE` + credit refill → atomic **book** → confirm redemption + Resend email with `.ics`. Partner portal / waitlist / profile billing remain **out of scope** (Phase 7+ / post-MVP).

**Client demo line:** *"Subscribe with a test card, spend credits, get your door code."*

### Stripe + Resend (staging / local)

| Item | Value |
|---|---|
| Webhook endpoint | `POST {SITE_URL}/api/webhooks/stripe` |
| Local forward | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` |
| Test card (success) | `4242 4242 4242 4242` — any future expiry, any CVC, any postal code |
| Test mode | Use `sk_test_` / `pk_test_` keys on staging; never live keys for demos |
| Env vars | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN`, `RESEND_API_KEY`, `DAILY_CODES_FROM_EMAIL` |

Workers: set the same Stripe/Resend secrets via `bun run secrets:workers` (or wrangler) before staging demos.

#### Stripe webhook setup (Dashboard + local)

Handler: `packages/billing/src/webhooks.ts` via `POST /api/webhooks/stripe`.

**Events to select** (only these — do **not** select `subscription_schedule.*`):

| Event | Purpose |
|---|---|
| `checkout.session.completed` | Activate membership + credits after Checkout (**required** for subscribe) |
| `invoice.paid` | Credit refill on subscription renewals (`subscription_cycle` only) |
| `invoice.payment_failed` | Mark subscription `PAST_DUE` |
| `customer.subscription.updated` | Sync status / cancel-at-period-end / period end |
| `customer.subscription.deleted` | Tear down canceled subscription → `INACTIVE` + credit expiry |

**Local:** run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, put the CLI `whsec_…` in root `.env` as `STRIPE_WEBHOOK_SECRET`, restart `bun run --env-file .env dev`. (`stripe listen` is a tunnel only — not used on staging/prod.)

**Staging / production:** Stripe Dashboard → Developers → Webhooks → Add endpoint → URL `https://<host>/api/webhooks/stripe` → select the five events above → copy that endpoint’s signing secret into Workers as `STRIPE_WEBHOOK_SECRET`. Use **test** mode + test keys on staging; **live** mode + live keys + a live-mode webhook on production.

### Demo accounts / subscription notes

1. **Inactive member (Checkout)** — fresh signup → onboarding → lands on `/:locale/membership` with `INACTIVE` + 17 starter credits; use test card to activate.
2. **Active member (booking-only demos)** — after webhook activation, or seed `subscriptions.status = 'ACTIVE'` + credits for local Playwright (`e2e/fixtures/billing.ts`). Prefer Checkout on staging for the client script.
3. **Past due / frozen** — `PAST_DUE` shows frozen book messaging; `UNPAID` blocks Checkout with payment-stopped + `support@unveiled.berlin`. Customer Portal recovery is Phase 7.

### Staging smoke checklist

1. Sign up → complete onboarding → `/membership` shows checkout CTA.
2. Start Checkout → pay with `4242…` → webhook sets `ACTIVE` and refills credits to 17.
3. Open a seeded upcoming event → **Tickets buchen** → confirm booking.
4. Confirm page shows redemption code + copy + `.ics` download; `/bookings` lists the ticket.
5. In Resend dashboard, confirm booking email with `.ics` attachment (when `RESEND_*` set).
6. **Stop** — do not start Phase 7 (waitlist / profile billing) in this release.

### Playwright (Phase 6)

```bash
SITE_URL=http://localhost:3000 bunx playwright test --config e2e/playwright.config.ts \
  e2e/specs/credits-subscription.spec.ts e2e/specs/booking.spec.ts
```

Stripe hosted Checkout is **opt-in** (`E2E_STRIPE_CHECKOUT=1` + `stripe listen`). Default CI seeds subscription state via `DATABASE_URL`. Policy: [`e2e/README.md`](../../e2e/README.md) § Stripe / payments. Coverage: [`docs/product/testing/coverage-matrix.md`](../../docs/product/testing/coverage-matrix.md).

### Automated verification (Phase 6)

```bash
bun run lint   # repo-wide may still report pre-existing debt outside this step
bun run typecheck
SITE_URL=http://localhost:3000 bunx playwright test --config e2e/playwright.config.ts \
  e2e/specs/credits-subscription.spec.ts e2e/specs/booking.spec.ts --workers=1
```

**Local gate note (2026-07-12):** `bun run typecheck` exit 0. Phase 6 Playwright: **13 passed / 20 skipped** (named deferrals + `E2E_STRIPE_CHECKOUT` opt-in). Vite SSR fixed for Stripe via `apps/web/ssr-shims/qs.js` alias (CJS `qs` → ESM shim). Staging deploys via Cloudflare GitHub import — complete the smoke checklist above when Builds has published.

### Staging deploy record

| Environment | URL / evidence | Date |
|---|---|---|
| Staging | Blocked at the time — Cloudflare Builds publish not verified in that session. Local smoke OK: `/de` 200 after qs shim; booking + credits-subscription e2e 13/13 in-scope passed. | 2026-07-12 |

## Phase 7 — Waitlist & member account

Phase 7 closes waitlist join/cancel + auto-promotion (capacity bump), profile identity/preferences/wallet, and `/profile/billing` (Customer Portal CTA + in-app cancel → `CANCELLED_PENDING`). **Do not start Phase 8** (admin waitlist HQ, GDPR pages, SEO polish).

**Client demo line:** *"Sold out? Join the waitlist. Manage subscription and preferences in profile."*

### Sold-out demo seed

| Item | Value |
|---|---|
| Title | `Sold Out: Waitlist Demo Night` |
| Constant | `DEMO_DISCOVERY_TITLES.soldOutWaitlist` in `packages/db` seed |
| Capacity | `remainingCapacity = 0` after seed |
| Promotion trigger | Admin **edit event** → raise **Kapazität** (total capacity) → `processWaitlistForEvent` + promotion email |

```bash
bun run seed:demo
```

### Stripe Customer Portal (dashboard)

Enable in Stripe Dashboard (**test + live**):

1. Payment method updates — on
2. Billing address / customer information — on
3. Cancellation — **at end of billing period** (not immediate)

App env: existing `STRIPE_SECRET_KEY` + `SITE_URL` for portal `return_url` (`/{locale}/profile/billing`). No new secrets — see `packages/billing/README.md`.

### Staging smoke checklist

1. Open seeded sold-out event → **Auf die Warteliste** → join with ticket count → confirmation `WAITING`.
2. As admin, edit the event and increase capacity by 1 → member is auto-promoted → ticket on `/bookings`; Resend promotion email when configured.
3. Profile → edit name → save; Vibes → save preferences; wallet shows credits; refill → `/membership`.
4. Billing → portal CTA visible when Stripe customer linked; cancel confirm → `CANCELLED_PENDING` (access until period end).
5. **Stop** — do not start Phase 8.

### Playwright (Phase 7)

```bash
SITE_URL=http://localhost:3000 bunx playwright test --config e2e/playwright.config.ts \
  e2e/specs/waitlist.spec.ts e2e/specs/profile.spec.ts \
  e2e/specs/credits-subscription.spec.ts e2e/specs/booking.spec.ts --workers=1
```

Promotion scenarios need `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`. Coverage: [`docs/product/testing/coverage-matrix.md`](../../docs/product/testing/coverage-matrix.md). Portal/cancel policy: [`e2e/README.md`](../../e2e/README.md) § Stripe Customer Portal.

### Ladle

```bash
bun run stories
# @unveiled/web :61001 — WaitlistJoinPage, WaitlistCancelPage, BillingPage, PreferencesPage, ProfilePage
```

### Staging deploy record

| Environment | URL / evidence | Date |
|---|---|---|
| Staging | Pending operator confirm of Cloudflare Git Builds on `main`. Local: Ladle `@unveiled/web` :61001 OK; Playwright Phase 7 scope — waitlist/profile/booking waitlist-offer + credits cancel/portal CTAs pass (promotion needs `E2E_ADMIN_*`; 2 flaky Phase 6 membership tests are pre-existing Neon Auth redirect flakes). | 2026-07-12 |

## Phase 8 — Admin ops (Membership HQ)

Admin Membership HQ + capacity ops: `/admin/users`, mutation pages (adjust-credits, freeze, refund, comp-ticket), `/admin/waitlist` (+ promote), `/admin/bookings/:id/cancel`. Closed by `admin-ops-05-ladle-e2e`.

**Client demo line:** *"Search a member, adjust credits, freeze, issue a comp ticket, promote waitlist, cancel a booking without refunding credits."*

### GDPR domain (step 01 — package APIs)

Phase 8 also includes GDPR rights (`gdpr-rights-*`) in parallel. Package APIs live in `@unveiled/db` (`buildUserDataExport`, `anonymizeUserAccount`). Auth disable is an injectable `DisableAuthUserFn` (type from `@unveiled/auth` / `@unveiled/db`).

### GDPR UI (step 02 — member + admin pages)

SSR surfaces (all `noindex`):

| Route | Role | Behavior |
|---|---|---|
| `/:locale/profile/data-export` | USER | Explainer + `?download=1` JSON attachment via `buildUserDataExport` |
| `/:locale/profile/delete-account` | USER | Confirm POST → `anonymizeUserAccount` (actor `self`) → proxy `/sign-out` → redirect home |
| `/:locale/admin/users/:id/delete-account` | ADMIN | Confirm POST → same anonymize path (actor `admin`) → redirect users list |

**Auth disable (wired in `apps/web/app/lib/disable-auth-user.ts`):**

1. **Self-service:** `POST {AUTH_URL}/delete-user` with the member session cookie. If that endpoint is unavailable (404/403/501), falls through to admin remove/ban using the same cookie (only works for Auth-side admins).
2. **Admin-assisted:** Prefer `POST {AUTH_URL}/admin/remove-user` with `{ userId }` and the admin session cookie.
3. **Fallback:** `POST {AUTH_URL}/admin/ban-user` then `POST {AUTH_URL}/admin/update-user` with email `deleted-{userId}@deleted.local` (must match `public.users` placeholder).
4. Enable Neon Auth **Admin plugin** for ban/remove; Console “Make admin” may be required so the operator’s Auth session can call admin endpoints.
5. Enable Better Auth **`user.deleteUser`** on the Neon Auth project if self-service `/delete-user` should succeed for regular members (otherwise self-delete depends on Auth-side admin cookie fallback).
6. No new app env vars beyond existing `AUTH_URL`.

Subscription cancel on deletion reuses `@unveiled/billing` `cancelSubscriptionAtPeriodEnd` (inject at call site); billing-only cancel must not set `deleted_at`.

**GDPR staging smoke:**

1. Member → Profile → **Export data** → download JSON (profile + bookings + ledger).
2. On a disposable seed member → Profile → **Delete account** → confirm → signed out; re-login with old credentials fails.
3. Admin → Users → member detail → **Delete account** → confirm → member gone from list; bookings/ledger retained under anonymized id.

### Freeze vs Stripe `PAST_DUE` (operators)

- Admin **freeze** only from subscription `ACTIVE` → sets `UNPAID` (does not call Stripe).
- Admin **unfreeze** from `UNPAID` → always sets `ACTIVE` (no Stripe call).
- If Stripe is still past_due, the **next webhook** may set `PAST_DUE` again after unfreeze. Treat admin freeze and Stripe past-due as separate causes/recoveries.

### Staging smoke checklist

1. Admin → **Mitglieder / Users** → search by email → open detail (preferences / history / behavior sections).
2. Adjust credits (+ reason) → ledger / balance update; freeze ACTIVE → `UNPAID`; unfreeze → `ACTIVE`.
3. Comp ticket for an upcoming event → confirmed booking, credits unchanged.
4. Waitlist tab → see WAITING entries; promote one entry with available capacity.
5. From member detail, cancel a confirmed booking with reason → status `CANCELLED`, credits unchanged.
6. GDPR delete-account: see **GDPR staging smoke** above.
7. SEO polish (`seo-launch-polish-02`): branded 403/500 pages + optional Sentry — see **Error pages & Sentry** below.

### Error pages & Sentry (`seo-launch-polish-02`)

- **404** — existing `NotFoundPage` (locale `_404`).
- **403** — `ForbiddenPage` for true forbidden HTML; wrong-role `/admin` still **redirects** non-ADMIN members to `/:locale` (does not leak admin URL existence via a distinct 403).
- **500** — `ServerErrorPage` via HonoX `_error.tsx` + outer `onError` (no stack traces to users). `/api/*` returns JSON `{ error: "Internal Server Error" }`.
- **Sentry** — optional `SENTRY_DSN` Worker secret / env; `@sentry/cloudflare` wraps the Worker export; `sendDefaultPii: false`. When unset, init is disabled and the app still boots. Server-only in this step (no client `window.Sentry`); cookie consent does not gate error tracking.
- **Smoke 500:** set `ENABLE_ERROR_SMOKE=1` locally, then `GET /api/health/error` — expect JSON 500 from outer handler (API path). Unset the flag afterward. Do **not** set `ENABLE_ERROR_SMOKE` on production.
- **Staging DSN (cutover):** optional but recommended for `seo-launch-polish-03` — create a Sentry project, set Worker secret `SENTRY_DSN`, redeploy; leave unset if monitoring is deferred.

### Playwright (admin-ops)

```bash
SITE_URL=http://localhost:3000 bunx playwright test --config e2e/playwright.config.ts \
  e2e/specs/admin-users.spec.ts e2e/specs/waitlist.spec.ts \
  e2e/specs/booking.spec.ts e2e/specs/credits-subscription.spec.ts --workers=1
```

Requires `DATABASE_URL`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`. Coverage: [`docs/product/testing/coverage-matrix.md`](../../docs/product/testing/coverage-matrix.md).

### Ladle

```bash
bun run stories
# AdminAdjustCreditsForm, AdminFreezeForm, AdminRefundForm, AdminCompTicketForm,
# AdminWaitlistListPage, AdminWaitlistPromotePage, AdminCancelBookingPage,
# AdminUsersListPage, AdminUserDetailPage, AdminDeleteAccountForm,
# DataExportPage, DeleteAccountPage, ForbiddenPage, ServerErrorPage, NotFoundPage
```

### Phase 8 MVP audit + cutover (`seo-launch-polish-03`)

**Client demo line:** *"Production-ready member MVP — admin support tools, GDPR, SEO, monitoring."*

#### Staging walkthrough record (2026-07-13)

| Step | Result | Notes |
|---|---|---|
| Guest Discover `https://unveiled-j6.deepcode.xyz/de` | **pass** | Brand yellow SSR; preview cards; CTA to membership + signup?returnTo=/de/events |
| Public event detail | **pass** | HTTP 200 for seeded event ids |
| `robots.txt` / health | **pass** | Disallows + Sitemap line; `/api/health/runtime` all configured |
| `sitemap.xml` bookable events | **partial** | Marketing/legal locales present; **event URLs absent on current Worker** — local DB returns 6 bookable ids via `listBookableEventsForSitemap`. Redeploy Worker (`bun run deploy:workers` with `CLOUDFLARE_API_TOKEN`, or Cloudflare Git Builds on `main`) to ship seo-01 sitemap code, then re-check `rg '/events/'` on sitemap |
| Member signup → onboarding → Checkout → book | **manual / seeded** | Full auth loop needs browser + Stripe test mode; Playwright covers seeded ACTIVE booking locally. Staging Checkout smoke remains operator SoT (`E2E_STRIPE_CHECKOUT` / Dashboard) |
| Admin Membership HQ support | **manual** | Covered by Playwright when `E2E_ADMIN_*` set; staging: Users search → adjust/freeze/comp/waitlist/cancel per smoke checklist above |
| Error pages / Sentry | **pass (code)** | 403/500 compositions + optional `SENTRY_DSN`; staging DSN optional |

**Outcome:** Partial — guest SEO surfaces + catalog live; Worker redeploy required for event URLs in sitemap; authenticated member/admin demo remains operator browser smoke (or local `bun run test:e2e` with `E2E_ADMIN_*` / `E2E_USER_*` set).

**E2E note (2026-07-13):** Admin events/partners suites now **skip** when `E2E_ADMIN_*` is unset (named env skip) instead of throwing. Focused smoke + static-pages: 12 passed / 31 skipped. Full suite needs credentials + stable `bun run dev` on `SITE_URL`.

#### Production cutover checklist

Use before promoting a production Workers host (replace staging origin with production).

1. **Neon Postgres** — Production branch/project; ensure production `DATABASE_URL` is a **Build** variable so `bun run build` migrates schema; decide empty vs curated catalog (prefer curated seed or admin-created venues — avoid demo-only junk).
2. **Neon Auth** — Production `AUTH_URL`; add production origin to **trusted domains** (exact URL, no trailing slash); configure Google OAuth if offering social login; enable Admin plugin + `user.deleteUser` for GDPR disable paths.
3. **Worker secrets / vars** — `DATABASE_URL`, `AUTH_URL`, `SITE_URL` (production origin); six R2 vars + `IMAGE_PUBLIC_BASE_URL`; Stripe **live** keys + `STRIPE_PRICE_ID_BASIC_BERLIN` + webhook secret; `RESEND_API_KEY` + `DAILY_CODES_FROM_EMAIL` (verified domain); optional `SENTRY_DSN`. Prefer secrets over committed `[vars]` for credentials.
4. **Stripe** — Live mode Checkout + Customer Portal (cancel at period end); webhook endpoint → `https://<prod>/api/webhooks/stripe` with events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.updated`, `customer.subscription.deleted` (see [Stripe webhook setup](#stripe-webhook-setup-dashboard--local)).
5. **R2** — Production bucket (or same with separate prefix policy); public read base URL; CORS if needed for uploads.
6. **Resend** — Domain/from verification; send a booking confirmation on staging/prod smoke.
7. **DNS / Cloudflare** — Custom domain route to Worker; TLS; confirm `SITE_URL` matches browser origin (Auth + Stripe return URLs).
8. **Admin provisioning** — Create ADMIN out-of-band (SQL promote or Neon Auth admin). **Do not** set `ADMIN_PROMOTE_EMAILS` on production.
9. **Sentry** — Optional; create project, set `SENTRY_DSN`, redeploy; confirm boot without DSN still works.
10. **Post-deploy smoke** — `/` → locale; Discover + public `/events/:id`; signup; Checkout test/live as appropriate; book → ticket/code; admin HQ login; `sitemap.xml` includes bookable event URLs; GDPR export on disposable user.
11. **Stop** — Member/admin MVP is complete. **Partner portal / check-in / partner-codes cron are post-MVP** — do not start in this cutover.

Coverage inventory: [`docs/product/testing/coverage-matrix.md`](../../docs/product/testing/coverage-matrix.md). Planning: `.dev-plan/current-iteration/seo-launch-polish-parent-guide.md`.

## Phase 2 step 03 verification

With `DATABASE_URL` and `AUTH_URL` set:

1. `bun run lint` and `bun run typecheck` pass
2. `/de/login` and `/en/signup` render HeroUI auth forms on the yellow page background
3. View Source on auth pages shows `<meta name="robots" content="noindex">`
4. Email signup with valid data creates a session; `public.users` row has `credits=17`, `role=USER`, and profile names when provided
5. Invalid signup (bad email, password under 6 chars, empty name) shows client-side validation errors
6. Forgot-password form submits via Neon Auth; reset-password reads the `token` query param
7. Google OAuth button visible on login/signup (requires Neon Auth provider config)

## Phase 2 step 04 verification

With `DATABASE_URL` and `AUTH_URL` set:

1. `bun run lint`, `bun run typecheck`, and `bun run build` pass
2. `cd apps/web && bun test app/lib/auth-middleware.test.ts` — redirect rules for guests and USER role
3. Unauthenticated `/de/events` → `302` to `/de/login?returnTo=...`
4. Signed-in USER `/de/partner` → `302` to `/de`
5. Signed-in member sees credits badge and logout in navbar; guest sees login/signup links
6. Logout ends session and returns to `/:locale`; subsequent protected prefix visit redirects to login
7. Complete [Phase 2 release gate](#phase-2-release-gate-auth-step-04) client demo on staging

## Phase 1 verification

After deploy (with `SITE_URL` set to the staging origin), confirm:

1. All public routes render in DE and EN: `/` (guest marketing home), `/discover`, `/how-it-works`, `/faq`, `/membership`, `/impressum`, `/privacy`, `/terms` (bare `/discover` redirects to `/:locale/discover`)
2. Footer legal links work on every page
3. `curl -s $SITE_URL/robots.txt` — shows `Allow`, `Disallow`, and `Sitemap:` lines
4. `curl -s $SITE_URL/sitemap.xml` — valid XML with 14 URLs (`/de`, `/en/terms`, etc.); no `/events/` URLs
5. View Source on `/en/faq` — server-rendered `<title>`, description, canonical, hreflang, and `og:image` pointing at `/og-default.png`
6. Cookie consent banner appears on first visit; Accept/Decline persists across reloads until storage is cleared
7. Browser console shows no errors on `/de` and `/en`

**Cookie consent note:** Declining non-essential cookies stores the preference in `localStorage` (`unveiled:cookie-consent`). On `/:locale/events/map`, MapLibre + OpenStreetMap tiles load only when consent is **accepted**; otherwise a static address-list fallback is shown and no OSM tile requests are made. Sentry (when added) remains ungated.

**Event map:** No map API keys. Tiles are requested from `https://tile.openstreetmap.org/{z}/{x}/{y}.png` (same as admin geo picker). Declined consent shows an address-list fallback with an external OpenStreetMap link (no tile requests). If a future Workers Content-Security-Policy is added, allow `img-src` / `connect-src` for that host and MapLibre worker scripts as needed. OSM attribution must remain visible when the map loads.

Local verification (dev server on port 3000):

```bash
bun run dev
curl -s http://localhost:3000/robots.txt
curl -s http://localhost:3000/sitemap.xml | rg -c '<url>'
# expect 16
curl -s http://localhost:3000/favicon.svg -o /dev/null -w '%{http_code}\n'
curl -s http://localhost:3000/og-default.png -o /dev/null -w '%{http_code}\n'
```

## Phase 0 verification

After deploy, confirm:

1. `/` → 302 to `/de` or `/en`
2. `/de` and `/en` show yellow background, navbar, footer, placeholder home
3. Logo at `/logos/unveiled-logo-black.svg` returns 200
4. Favicon at `/favicon.svg` returns 200
5. DE/EN language switch navigates between locale prefixes
6. Browser console shows no errors on `/de` and `/en`

## Assets note

Logo SVGs live in `apps/web/public/logos/` (Illustrator exports — black, white, yellow). Served at `/logos/unveiled-logo-{tone}.svg`. Replace only by overwriting those three files; `<Logo />` picks them up automatically.

Site-wide Open Graph fallback: `apps/web/public/og-default.png` (1200×630, yellow background). Used when a page has no page-specific image.

## Demo accounts

Phase 1: none (no auth).

Phase 2+: create a test member via `/de/signup` on staging (see [Test user (staging)](#test-user-staging)), or use the Neon Auth console. Expected starter state: `USER` role, 17 credits, `INACTIVE` subscription, onboarding incomplete. Document any shared staging credentials here when provisioned for client demos.

**Admin demos:** promote a staging user with SQL or `ADMIN_PROMOTE_EMAILS` (see [Admin account setup](#admin-account-setup)). After sign-in, expect redirect to `/de/admin`.
