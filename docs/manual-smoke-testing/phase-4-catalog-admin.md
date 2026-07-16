# Phase 4 — Manual smoke test

Admin catalog + public event detail + R2 images. Client demo: *Back office is live. I upload an event photo, publish, and it instantly appears on the public discovery page.*

**Booking / Stripe remain Phase 6.** Partner portal is post-MVP — `partners` here are venue records only.

## Setup

1. Phase 2 trio + six R2 vars (`S3_*`, `IMAGE_PUBLIC_BASE_URL`) on local/staging.
2. Admin account (SQL promote or `ADMIN_PROMOTE_EMAILS` — see `DEPLOYMENT.md`).
3. Catalog: `bun run seed:demo` if empty (`-- --reset` only on disposable DBs).

---

## A. Admin venues (partners)

1. Sign in as ADMIN → `/admin` (or `/de/admin`).
2. Create a partner/venue with logo (upload or remote URL) → listed on `/admin/partners`.
3. Edit partner → save → list reflects changes.

## B. Admin events

1. Create an event with image, venue, capacity, date → listed on `/admin/events`.
2. Edit event → save.
3. Confirm JPEG variants land under `IMAGE_PUBLIC_BASE_URL` (e.g. `medium-640.jpg`).

## C. Public surfaces

1. Open `/:locale` — new/upcoming event appears in Discover preview (up to 6).
2. Open `/events/:id` **logged out** — detail loads (hero, copy, venue).
3. View Source — unique title/description; Event JSON-LD present; `og:image` uses R2 variant URL.

## D. Seed shortcuts (optional)

1. After `bun run seed:demo`, spot-check Berlin venues (Volksbühne, Gropius Bau, …) and events on Discover.
2. `--skip-upload` is OK for DB-only local smoke without images.

## E. Quick negatives (optional)

- Guest cannot open `/admin/*`.
- `/events/:id` is public; member feed `/events` stays gated.
- No `/partner/*` portal or check-in UI.

## Related docs

- `apps/web/DEPLOYMENT.md` — Phase 4 release gate, R2, seed
- `.dev-plan/IMPLEMENTATION-PLAN.mvp.md` — Baseline Phase 4
- `docs/product/features/admin-events.feature`, `admin-partners.feature`
- `docs/product/extras/image-uploads.md`
