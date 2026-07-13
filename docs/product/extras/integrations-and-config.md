# Integrations and Configuration (MVP)

Env vars and third-party services for the production MVP. Partner-portal-only flows are **post-MVP**. Document runtime vars in `apps/web/DEPLOYMENT.md`.

**MVP phase map:**

| Phase | Variables |
|---|---|
| 2+ | `DATABASE_URL`, `AUTH_URL` |
| 4+ | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL` |
| 5+ | _(none)_ — MapLibre + OSM; no API key |
| 6+ | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN` |
| 6+ | `RESEND_API_KEY`, `DAILY_CODES_FROM_EMAIL` |
| 8+ | `SENTRY_DSN` (optional; server-side `@sentry/cloudflare`) |

## Environment variables (current app / historical)

| Variable | Used for | Rewrite equivalent |
|---|---|---|
| `GEMINI_API_KEY` | **Misnamed** — actually injected as `process.env.API_KEY` and used for **Google Maps** in `EventMap.tsx` | **Removed** — rewrite uses **MapLibre GL JS** + **OpenStreetMap** tiles (no API key; see `ui/ui-component-map.md`) |
| `VITE_FIREBASE_API_KEY` | Firebase client config | Removed — replaced by Neon Auth, which runs on the same Neon Postgres database (no separate auth project/keys) |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth | Removed |
| `VITE_FIREBASE_PROJECT_ID` | Firebase | Removed |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage (configured, but never actually called — the app's file pickers write base64 straight into the DB instead, see below) | Removed, replaced by real S3-compatible object storage — see the new image-upload env vars below and `extras/image-uploads.md` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase | Removed |
| `VITE_FIREBASE_APP_ID` | Firebase | Removed |
| `VITE_SENTRY_DSN` | Sentry (optional; wasn't even in `.env.example`) | Keep — `SENTRY_DSN` |
| `RESEND_API_KEY` (Cloud Functions secret) | Daily partner passcode emails via Resend | Keep — same purpose, now a HonoX server-side env var |
| `DAILY_CODES_FROM_EMAIL` (Cloud Functions param) | From-address for daily code emails | Keep |
| — (new) | Neon Postgres connection | `DATABASE_URL` |
| — (new) | Neon Auth / Better Auth backend (decided: use Neon Auth instead of a standalone auth library — see below) | `AUTH_URL` — Neon-provided Better Auth API URL; HonoX `/api/auth/*` forwards requests to this target |
| — (new) | Google OAuth (decided: `features/auth.feature`) | No app env vars — configured directly in the Neon Auth project settings (shared test credentials out of the box, swap in real Google OAuth credentials there for production) |
| — (new) | Stripe (decided: `features/credits-subscription.feature`) | `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_BASIC_BERLIN` |
| — (new) | S3-compatible image storage (decided: `extras/image-uploads.md`) | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `IMAGE_PUBLIC_BASE_URL` — set in repo-root `.env` for local dev (see `.env.example`) and on the staging host; `S3_ENDPOINT` is the R2 account host only (no bucket suffix), `IMAGE_PUBLIC_BASE_URL` is the public R2.dev or custom domain URL |

## Third-party services

| Service | Current role | Rewrite plan |
|---|---|---|
| **Firebase Auth** | Email/password login/signup, session | Replace entirely with **Neon Auth** — Neon hosts the **Better Auth** backend (own `neon_auth` schema in Postgres; no separate auth service to run in this repo). Neon Auth is **Better Auth-compatible**, so the UI is the standard **`better-auth-ui`** component library — use `@better-auth-ui/heroui` (not the shadcn one) so auth screens inherit the re-skinned Uber theme (`ui/design-tokens.md`). Architecture: HonoX `/api/auth/*` **forwards** to `AUTH_URL` (Neon-provided Better Auth API) so the API is same-origin; `better-auth-ui`'s client points at `/api/auth` exactly as it would against a self-hosted Better Auth instance. Do not reimplement Better Auth routes or model `neon_auth` in Drizzle |
| **Cloud Firestore** | Primary database | Replace entirely with **Neon Postgres** via **Drizzle ORM** |
| **Firebase Storage** | Configured, but never actually called by the app. The event/partner forms do have file pickers ("SELECT JPEG" / "SELECT LOGO"), but they bypass Storage entirely — `FileReader.readAsDataURL()` converts the file to a base64 data URI client-side and writes it straight into the `imageUrl`/`logoUrl` text column (see `ui/assets-inventory.md`) | **Decided (superseding an earlier, more conservative draft of this doc): real S3-compatible object storage, with a real image-processing pipeline** — every event image / partner logo, whether supplied as a direct upload or a pasted URL, is processed server-side into six WebP size variants (`original`, `hero-1920`, `large-1280`, `medium-640`, `small-320`, `og-1200x630`) and stored in a bucket, replacing both the old base64-into-DB anti-pattern and the plain-URL-only fallback. Recommended provider: **Cloudflare R2** (S3-compatible API, no egress fees) — see `extras/image-uploads.md` for the full pipeline, storage layout, and new `images` database table |
| **Firebase Functions** | 5 callable/scheduled functions (see below) | Reimplement as HonoX server route handlers (callable-equivalents) and a scheduled job (cron equivalent — e.g. a platform cron trigger or an external scheduler hitting a protected route) |
| **Firebase Hosting** | Frontend deploy | Replace with whatever host runs the HonoX SSR app |
| **Google Maps** (`@react-google-maps/api`) | Event map | **Decided:** replace with **MapLibre GL JS** + **OpenStreetMap** raster/vector tiles — no Google API key, no `@react-google-maps/api`. Isolate as a small client-hydrated island (see `ui/ui-component-map.md`); include required OSM attribution. Cookie consent gates loading third-party tile requests (Phase 5) |
| **Sentry** (`@sentry/cloudflare`) | Error tracking (server/Workers) | Optional `SENTRY_DSN`; PII-free; ungated by cookie consent. Client `@sentry/react` not required for MVP polish. |
| **Resend** | Daily partner passcode emails (raw `fetch`, no SDK used) | Keep — same integration, ported to a server route/cron. **Expanded scope for the rewrite:** also used for booking confirmation emails (new, decided: `features/booking.feature`) and waitlist promotion emails (`features/waitlist.feature`) — the old app sent neither, both were purely in-app notifications. Password reset emails (`features/auth.feature`) are sent by Neon Auth's own email hook, which can also be wired to Resend rather than introducing a second email provider |
| **TanStack React Query** | Lightly used (one query in `AdminPanel`) | Optional in an SSR-only app — most data now loads server-side; keep only if specific islands need client-side refetching |

## Cloud Functions → HonoX mapping

| Old function | Type | Purpose | New home |
|---|---|---|---|
| `bookEventAtomic` | Callable | Atomic booking transaction (subscription/capacity/credit checks, redemption code generation, ledger write) | POST handler behind `/events/:id/book`, wrapping a Postgres transaction (see `database/schema-overview.md`) |
| `checkInBooking` | Callable | Admin/partner manual check-in | POST handler behind `/partner/guests/:bookingId/checkin` and an admin equivalent |
| `checkInWithVenueQr` | Callable | Guest self-check-in via QR token | POST handler behind `/checkin` |
| `createPartnerPortalUser` | Callable | Admin creates a partner's portal login | POST handler behind `/admin/partners/:id/portal-access`, creating a Neon Auth user and a linked `public.users` row with role `PARTNER` |
| `emailDailyPartnerCodes` | Scheduled (`59 23 * * *` Europe/Berlin) | Emails partners the next day's redemption codes via Resend | A cron-triggered route/job on whatever platform hosts the app (or an external scheduler calling a protected endpoint) |

## Payment

**No real payment integration exists in the old app** — checkout is entirely mocked (a simulated 2-second delay; `subscription.status` flips to `ACTIVE` directly), despite UI copy referencing "Stripe." **Decided for the rewrite: real Stripe Billing integration** — Stripe Checkout for the initial subscribe flow, the Stripe Customer Portal (linked from `/profile/billing`) for payment-method updates and cancellation, and webhooks (`checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.updated`/`.deleted`) driving the `ACTIVE` / `PAST_DUE` / `CANCELLED_PENDING` / `INACTIVE` transitions described in `features/credits-subscription.feature`. This is required for a production product that charges real money — a mocked payment flow cannot ship.

## Google OAuth

**New for the rewrite** (decided in `features/auth.feature`): Google sign-in/signup via Neon Auth's built-in social-provider support, alongside email/password — configured in the Neon Auth project settings, not app code. Creates a `USER` account on first login exactly like a normal signup (17 starter credits, `INACTIVE` subscription, onboarding incomplete). Never used to create `PARTNER`/`ADMIN` accounts.

## Legal / compliance

**New for the rewrite** (decided in `features/static-pages.feature`, none of this existed in the old app): Impressum, Privacy Policy, and Terms of Service pages, plus a cookie/tracking consent banner gating the **event map island** (MapLibre GL JS loading OpenStreetMap tiles from third-party tile servers). Sentry error tracking is configured PII-free and treated as strictly necessary, so it's not gated. No new third-party service is required for this — it's app-level content/UI, though a consent-management library (e.g. a lightweight CMP) can be evaluated at implementation time if manual banner logic proves insufficient.
