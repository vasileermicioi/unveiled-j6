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

Phase 0 requires **no application secrets**. The host injects `PORT` at runtime.

| Variable | Required | Phase | Description |
|---|---|---|---|
| `PORT` | Host-injected | 0 | HTTP listen port (default `3000` locally) |
| `DATABASE_URL` | — | 2+ | Neon Postgres connection string |
| `NEON_AUTH_BASE_URL` | — | 2+ | Neon Auth project URL |
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

## Demo accounts

None for Phase 0 (no auth).
