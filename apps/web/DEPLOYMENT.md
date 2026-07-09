# Deployment — Unveiled Berlin (`@unveiled/web`)

Staging deployment for the HonoX SSR application. Update this file every phase when env vars or demo credentials change.

## Staging URL

| Environment | URL | Status |
|---|---|---|
| Staging | _TBD — set after first Workers deploy_ | Pending operator setup |

Target custom domain: `https://staging.unveiled.berlin` (configure in Cloudflare Workers when DNS is ready).

## Host

**Cloudflare Workers** — HonoX SSR via `@hono/vite-build/cloudflare-workers` and `wrangler.toml`.

**Image processing (`sharp`)** runs on **local Node only** (`bun run dev`, `bun run seed:demo`). Admin image uploads on the Workers URL return a clear error; seed the database locally before deploying, or upload images while running local dev.

Deploy artifacts:
- `apps/web/wrangler.toml` — Workers config, static assets binding
- `apps/web/vite.config.ts` — Workers production build (Node dev server unchanged for `bun run dev`)
- Legacy `Dockerfile` / Railway — optional Node reference; not used for web deploy

## Build and start

From repository root:

```bash
bun install
bun run build    # Workers-compatible @unveiled/web bundle
```

Local development (Node — supports admin image upload):

```bash
bun run dev
# http://localhost:3000
```

Workers preview (after build; requires wrangler secrets — see below):

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

Do **not** use `npx wrangler deploy` alone — Wrangler will refuse monorepo roots. The root `deploy:workers` script runs `bunx wrangler deploy --config apps/web/wrangler.toml`.

**Build variables** (Settings → Variables and secrets → **Build**):

| Variable | Value |
|---|---|
| `BUN_VERSION` | `1.3.14` (matches root `packageManager`; avoids Bun 1.2.x `catalog:` resolution bugs) |

**Runtime secrets** (Settings → Variables and secrets → **Secrets** — required for auth and DB):

| Secret | Phase | Notes |
|---|---|---|
| `DATABASE_URL` | 2+ | Neon Postgres connection string |
| `AUTH_URL` | 2+ | Neon Auth API base URL (no trailing slash) |
| `SITE_URL` | 1+ | Public site origin, e.g. `https://unveiled-j6.deepcode.xyz` (no trailing slash) |

`SITE_URL`, `AUTH_URL`, and the six R2 vars are set in `apps/web/wrangler.toml` `[vars]` for staging (mirrored from repo-root `.env`). `DATABASE_URL` is also in `[vars]` for this staging Worker — redeploy after changes (`bun run deploy:workers`). For production, prefer `wrangler secret put` / dashboard secrets instead of committing credentials.

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

**After first deploy:** set `SITE_URL` to your `*.workers.dev` URL (or custom domain). Run `bun run db:migrate` and `bun run seed:demo` locally before expecting catalog content on staging.

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
| `STRIPE_SECRET_KEY` | — | 6+ | Stripe secret key (test mode on staging) |
| `STRIPE_PUBLISHABLE_KEY` | — | 6+ | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | — | 6+ | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_BASIC_BERLIN` | — | 6+ | Stripe price ID for Basic Berlin plan |
| `RESEND_API_KEY` | — | 6+ | Resend API key for transactional email |
| `DAILY_CODES_FROM_EMAIL` | — | 6+ | Sender address for daily code emails |
| `SENTRY_DSN` | — | 9+ | Sentry error reporting (optional) |

### Cloudflare R2 (Phase 4)

The image pipeline stores six WebP variants per upload under `images/{uuid}/{variant}.webp` in the bucket. Public URLs are `{IMAGE_PUBLIC_BASE_URL}/images/{uuid}/medium-640.webp` (and sibling variant filenames — see `docs/migration/extras/image-uploads.md`).

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

**Admin event upload smoke test** (Phase 4 catalog — **local Node dev only**):

1. Sign in as ADMIN with all six R2 vars set in root `.env`.
2. Run `bun run dev` (not Workers preview).
3. Open `/:locale/admin/events/new`, choose a JPEG ≥ 800×420 px, submit.
3. Confirm redirect to `/admin/events` and the new row shows a `small-320.webp` thumbnail.
4. Edit the event without a new file — thumbnail unchanged. Edit with a new file — thumbnail updates.
5. In the R2 bucket, confirm six objects under `images/{uuid}/` for the event's `image_id`.

## Manual Railway setup (first deploy)

If CI deploy is not yet configured:

1. Create a Railway project and link this repository (or use `railway init`).
2. Add GitHub secret `RAILWAY_TOKEN` (Railway dashboard → Account → Tokens).
3. Optionally add `RAILWAY_SERVICE_ID` if the project has multiple services.
4. Push to `main` — the workflow runs lint, typecheck, build, then `railway up`.
5. Copy the generated `*.up.railway.app` URL into the staging table above.

Alternative CLI deploy from repo root:

```bash
npm install -g @railway/cli
railway login
railway link
railway up
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

Phase 2 is complete when staging supports the full auth loop with route protection and authenticated navbar. **Required env vars on Railway:** `DATABASE_URL`, `AUTH_URL`, `SITE_URL`.

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

**Staging/dev shortcut:** set `ADMIN_PROMOTE_EMAILS=your@email.com` in Railway or root `.env`. On the next session resolve, matching `USER` accounts are promoted to `ADMIN` automatically. Use only on non-production environments.

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

**Neon Auth setup:** Enable Neon Auth on the Postgres project; copy `AUTH_URL` from the Neon dashboard into Railway/env.

**Route protection:** Locale middleware in `apps/web/app/routes/[locale]/_middleware.tsx` uses `apps/web/app/lib/auth-middleware.ts` — guarded prefixes: `events`, `saved`, `bookings`, `profile`, `partner`, `admin`, `onboarding`.

**Onboarding middleware:** Same locale middleware uses `apps/web/app/lib/onboarding-middleware.ts` — incomplete USERs hitting member app prefixes redirect to their current onboarding step; complete USERs hitting `/onboarding/*` redirect to `/events`; PARTNER/ADMIN are never sent into the wizard.

## Phase 3 release gate (onboarding step 04)

Phase 3 is complete when staging supports the full four-step onboarding wizard, skip-age flow, onboarding guards, and membership redirect without console errors on `/de` and `/en`. **Required env vars remain the same as Phase 2:** `DATABASE_URL`, `AUTH_URL`, `SITE_URL` — no new application secrets for Phase 3.

**Client demo line:** *"After signup, we capture vibes, districts, and timing — same as the product vision."*

### Prerequisites

1. Phase 2 release gate passed on staging (auth loop, route protection, navbar).
2. Drizzle migrations applied (`bun run db:migrate` against staging `DATABASE_URL`).
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

**Option A — fresh signup:** use a new email each time (simplest for client demos).

**Option B — SQL reset** (Neon SQL editor, replace `<user_id>`):

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

Phase 4 is complete when staging supports the admin → public catalog loop with real R2 images. **Required env vars:** Phase 2 trio (`DATABASE_URL`, `AUTH_URL`, `SITE_URL`) **plus** all six R2 vars (see [Cloudflare R2](#cloudflare-r2-phase-4)). Copy local root `.env` R2 values to Railway before the client demo.

**Client demo line:** *"Back office is live. I upload an event photo, publish, and it instantly appears on the public discovery page."*

### Prerequisites

1. Phase 3 release gate passed; Drizzle migrations include `images`, `partners`, `events`.
2. ADMIN user exists — promote via SQL or `ADMIN_PROMOTE_EMAILS` (see [Admin account setup](#admin-account-setup)); signing up alone does **not** create an admin.
3. R2 bucket public access enabled; `IMAGE_PUBLIC_BASE_URL` loads in a browser.

### Catalog demo script

1. `bun run db:migrate` against staging `DATABASE_URL`.
2. Sign in as ADMIN → `/de/admin`. If DB empty, run **Seed demo data** or `bun run seed:demo`. To replace an existing catalog with fresh Berlin venue demo data: `bun run seed:demo -- --reset` (deletes all partners and events first; also removes pagination seed rows).
3. Create a partner with logo (upload or URL) → appears on `/de/admin/partners`.
4. Create an event with image → listed on `/de/admin/events`.
5. Open `/de` — event appears in Discover preview grid (up to 6 upcoming).
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

`bun run seed:demo` inserts six real Berlin cultural partners (Volksbühne, Deutsches Theater, Schaubühne, Gropius Bau, HKW, Konzerthaus) with venue-matched events. Images are fetched from **Wikimedia Commons** via `processImageFromUrl` and stored as six WebP variants in R2.

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

1. All public routes render in DE and EN: `/` (Discover home), `/how-it-works`, `/faq`, `/membership`, `/impressum`, `/privacy`, `/terms` (`/discover` redirects to `/`)
2. Footer legal links work on every page
3. `curl -s $SITE_URL/robots.txt` — shows `Allow`, `Disallow`, and `Sitemap:` lines
4. `curl -s $SITE_URL/sitemap.xml` — valid XML with 14 URLs (`/de`, `/en/terms`, etc.); no `/events/` URLs
5. View Source on `/en/faq` — server-rendered `<title>`, description, canonical, hreflang, and `og:image` pointing at `/og-default.png`
6. Cookie consent banner appears on first visit; Accept/Decline persists across reloads until storage is cleared
7. Browser console shows no errors on `/de` and `/en`

**Cookie consent note:** In Phase 1, declining non-essential cookies has no visible effect — no map island exists yet. The preference is stored in `localStorage` for Phase 5, when the MapLibre + OpenStreetMap map island will check consent before loading third-party tile requests.

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
