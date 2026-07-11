## Why

Step 01 locked the MVP charter at `docs/product/CHARTER.md`, but the structural product docs (vision, sitemap, UI, schema, extras) still live only under the migration extract — with known P0/P1 gaps: `/events/:id` auth vs public/indexable intent, fuzzy Discover→Events, partner mixed into MVP language, incomplete DS ownership docs, and schema narrative that still reads like a half-port. This step creates the **structural half** of `docs/product/` so later feature/BDD and plan steps have a coherent production-MVP foundation.

## What Changes

- Rewrite `docs/product/README.md` with full how-to-read order (foundation docs now; features/journeys/BDD land in step 03; SoT activation in step 05)
- Create/rewrite under `docs/product/`:
  - `product/vision-and-domains.md` — MVP vision, bounded contexts, guest/member/admin personas; partner domain post-MVP; non-goals
  - `sitemap/sitemap.md` — complete MVP route map + post-MVP `/partner/*` appendix; Discover = `/:locale`; public `/events/:id`; member feed gated; guest vs member nav
  - `ui/design-tokens.md`, **new** `ui/design-system.md`, `ui/ui-component-map.md`, `ui/app-shell.md`, `ui/assets-inventory.md`, `ui/static-pages-content.md` — Uber theme rules; `@unveiled/ui` as DS + Ladle/Theme Overview; Discover↔Events CTAs corrected
  - `database/schema-overview.md` — complete MVP schema (users, partners-as-venues, events, images, saved_events, subscriptions, bookings, credit_ledger, waitlist); partner-portal-only fields labeled post-MVP
  - `extras/`: SEO (public detail; `/events` noindex), image-uploads, pagination-and-search, integrations-and-config, authorization-matrix (MVP roles + post-MVP partner section), content-i18n-inventory, gaps-and-decisions (“MVP rewrite 2026-07” section → charter)
- Amend `CHARTER.md` target tree if needed to include `ui/design-system.md` (prefer charter amendment over silent drift)
- Mark step 02 done in `.dev-plan/current-iteration/mvp-spec-rewrite-parent-guide.md`
- Do **not** write `features/*.feature`, `user-journeys.md`, BDD testing doc (03); `IMPLEMENTATION-PLAN.mvp.md` (04); or flip `AGENTS.md` (05)

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: MODIFIED — public `/events/:id` (no auth) with indexability for bookable future events; booking/waitlist remain gated — encoded in product sitemap/SEO docs
- `static-marketing-pages`: ADDED — Discover (locale home) marketing + curated preview with explicit CTAs into event detail and/or auth → member `/events` (no dead ends; no public full feed)
- `platform-foundation`: ADDED — `@unveiled/ui` as the design-system package with Ladle home including a Theme Overview story for the Uber yellow / near-zero-radius theme; page compositions may stay in `apps/web` when route-specific

## Impact

- **Docs only** under `docs/product/` (plus parent-guide checkbox; optional CHARTER target-tree amendment)
- **Consumers:** step 03 (features/journeys/BDD), step 04 (MVP plan), step 05 (AGENTS SoT flip)
- **Sources:** charter Locked decisions + mapping table; port/rewrite from `docs/migration/` (no “see migration” holes for MVP topics)
- **Out of scope:** application code, Ladle story moves, deleting `docs/migration/`, partner portal implementation, feature Gherkin
