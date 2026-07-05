# Deployment — Unveiled Berlin (`@unveiled/web`)

Staging deployment for the HonoX SSR application. Update this file every phase when env vars or demo credentials change.

## Staging URL

| Environment | URL | Status |
|---|---|---|
| Staging | _TBD — set after first Railway deploy_ | Pending operator setup |

Target custom domain: `https://staging.unveiled.berlin` (configure in Railway when DNS is ready).

## Host

**Railway** — Node.js-capable host for HonoX SSR (required for future `sharp` image processing).

Deploy artifacts:
- `Dockerfile` — multi-stage Bun build, Node 22 Alpine runtime
- `railway.json` — health check on `/de`, restart policy
- `.github/workflows/deploy-staging.yml` — lint, typecheck, build, deploy on `main` push

## Build and start

From repository root:

```bash
bun install
bun run build    # builds @unveiled/web
```

Production start (local verification):

```bash
cd apps/web && bun run start
# listens on PORT (default 3000)
```

Docker (matches Railway):

```bash
docker build -t unveiled-web .
docker run -p 3000:3000 -e PORT=3000 unveiled-web
```

## Environment variables

**Phase 2 staging requires `DATABASE_URL`, `AUTH_URL`, and `SITE_URL`.** Without `DATABASE_URL` and `AUTH_URL`, auth pages render but session resolution, route protection, and provisioning are disabled. Local marketing-only dev works without them; auth demos and staging deploys must set all three.

Phase 1 requires `SITE_URL` on staging/production for absolute canonical, Open Graph, and sitemap URLs. Local development defaults to `http://localhost:3000` when unset.

| Variable | Required | Phase | Description |
|---|---|---|---|
| `PORT` | Host-injected | 0 | HTTP listen port (default `3000` locally) |
| `SITE_URL` | **Yes (staging/prod)** | 1+ | Public origin for canonical, OG, robots, and sitemap URLs (e.g. `https://staging.unveiled.berlin`) |
| `DATABASE_URL` | **Yes (Phase 2 staging+)** | 2+ | Neon Postgres connection string |
| `AUTH_URL` | **Yes (Phase 2 staging+)** | 2+ | Neon-provided Better Auth backend API URL; `/api/auth/*` forwards to this target |
| `S3_ENDPOINT` | — | 4+ | Cloudflare R2 endpoint |
| `S3_REGION` | — | 4+ | R2 region |
| `S3_BUCKET` | — | 4+ | R2 bucket name |
| `S3_ACCESS_KEY_ID` | — | 4+ | R2 access key |
| `S3_SECRET_ACCESS_KEY` | — | 4+ | R2 secret key |
| `IMAGE_PUBLIC_BASE_URL` | — | 4+ | Public CDN base URL for images |
| `GOOGLE_MAPS_API_KEY` | — | 5+ | Google Maps for event map island |
| `STRIPE_SECRET_KEY` | — | 6+ | Stripe secret key (test mode on staging) |
| `STRIPE_PUBLISHABLE_KEY` | — | 6+ | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | — | 6+ | Stripe webhook signing secret |
| `STRIPE_PRICE_ID_BASIC_BERLIN` | — | 6+ | Stripe price ID for Basic Berlin plan |
| `RESEND_API_KEY` | — | 6+ | Resend API key for transactional email |
| `DAILY_CODES_FROM_EMAIL` | — | 6+ | Sender address for daily code emails |
| `SENTRY_DSN` | — | 9+ | Sentry error reporting (optional) |

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

1. All public routes render in DE and EN: `/`, `/discover`, `/how-it-works`, `/faq`, `/membership`, `/impressum`, `/privacy`, `/terms`
2. Footer legal links work on every page
3. `curl -s $SITE_URL/robots.txt` — shows `Allow`, `Disallow`, and `Sitemap:` lines
4. `curl -s $SITE_URL/sitemap.xml` — valid XML with 16 URLs (`/de/discover`, `/en/terms`, etc.); no `/events/` URLs
5. View Source on `/en/faq` — server-rendered `<title>`, description, canonical, hreflang, and `og:image` pointing at `/og-default.png`
6. Cookie consent banner appears on first visit; Accept/Decline persists across reloads until storage is cleared
7. Browser console shows no errors on `/de` and `/en`

**Cookie consent note:** In Phase 1, declining non-essential cookies has no visible effect — no Google Maps embed exists yet. The preference is stored in `localStorage` for Phase 5, when the map island will check consent before loading third-party cookies.

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
