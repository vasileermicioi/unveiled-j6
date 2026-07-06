## Context

Catalog steps 01–02 are merged: `@unveiled/db` exposes partner CRUD domain functions with logo attach/replace, and `runDemoSeed` / `shouldRunDemoSeed` power `bun run seed:demo`. Auth step 04 already protects the `admin` path prefix via `evaluateAuthRedirect` in `[locale]/_middleware.tsx` — unauthenticated users redirect to login; USER and PARTNER roles redirect to locale home. No admin routes exist yet under `apps/web/app/routes/[locale]/admin/`.

Source of truth: `docs/migration/features/admin-partners.feature` (record CRUD scenarios only), `docs/migration/sitemap/sitemap.md`, `docs/migration/extras/pagination-and-search.md`, `docs/migration/extras/image-uploads.md` §4, `design-tokens.md`.

Existing patterns: onboarding SSR form POST with `c.req.parseBody()`, `CatalogValidationError` from domain, HeroUI-only components, yellow page background via theme.

## Goals / Non-Goals

**Goals:**

- Ship ADMIN-only SSR pages: `/admin` dashboard, `/admin/partners` list (search + pagination), new/edit/delete with multipart logo handling.
- Delegate all business logic to `@unveiled/db` catalog functions; routes parse forms, call domain, redirect or re-render with errors.
- Dashboard seed button calls `runDemoSeed` when `shouldRunDemoSeed` is true; hidden otherwise.
- Shared admin components (`AdminPageShell`, `PartnerForm`, `AdminTable`, pagination helpers) following HeroUI + theme conventions.
- ADMIN-only navbar link to `/admin`.

**Non-Goals:**

- `/admin/partners/:id/portal-access`, `/admin/partners/:id/venue-qr` (Phase 8).
- Event admin CRUD (`catalog-04`), public `/discover` / `/events/:id`, `@unveiled/ui` EventCard.
- PARTNER user creation or linking — partners remain data rows only.
- Client-side mutation modals; progressive-enhancement JS on search forms is optional.
- Venue check-in token regenerate UI (domain has `regenerateVenueCheckInToken`; UI deferred to Phase 8).

## Decisions

### 1. Route layout

```
apps/web/app/routes/[locale]/admin/
├── index.tsx                    # GET dashboard; POST seed-demo
└── partners/
    ├── index.tsx                # GET list (?q=&page=)
    ├── new.tsx                  # GET form + POST create
    └── [id]/
        ├── edit.tsx             # GET form + POST update
        └── delete.tsx           # GET confirm + POST delete
```

Shared helpers in `apps/web/app/lib/admin-route.ts`:

- `guardAdminRoute(c)` — require session with `role === "ADMIN"`; redirect unauthenticated to login with `returnTo`; redirect non-ADMIN to `/${locale}` (belt-and-suspenders on top of prefix middleware).
- `parsePartnerFormBody(body)` — extract name, contactEmail, address, logoUrl; read file field as `Buffer` when present.
- `mapCatalogError(error)` — map `CatalogValidationError.code` to field-level or page-level messages.

**Rationale:** Mirrors onboarding route helper pattern; keeps route files thin.

### 2. Auth protection (no new middleware file)

Reuse existing `[locale]/_middleware.tsx` flow:

- `admin` is already in `PROTECTED_PREFIXES`.
- `ROLE_FORBIDDEN.USER` and `ROLE_FORBIDDEN.PARTNER` include `"admin"`.
- Page-level `guardAdminRoute` adds explicit ADMIN check and clearer handling if middleware is bypassed in tests.

**Alternative considered:** Per-route `requireRole(..., "ADMIN")` returning JSON 403. Rejected — browser navigation needs SSR redirects per auth phase design.

### 3. Multipart form handling

Partner create/edit forms use `<form method="POST" enctype="multipart/form-data">`:

1. `c.req.parseBody()` — Hono parses multipart (same as onboarding).
2. File field: if value is `File` with size > 0, read to `Buffer`; else treat as absent.
3. Text field `logoUrl`: trim; empty string = no URL.
4. Pass `{ logoUpload, logoUrl }` to `createPartner` / `updatePartner` — domain enforces XOR via `validateImageSourceExclusive`.
5. Set `uploadedBy: session.user.id` on image attach.

Delete confirmation uses plain POST (no multipart).

**Rationale:** Matches `image-uploads.md` §4 — single synchronous request, no separate upload endpoint.

### 4. Partner list pagination and search

Per `pagination-and-search.md`:

| Param | Usage |
|---|---|
| `page` | 1-indexed; default 1 |
| `q` | ILIKE on name + contact email (domain `listPartners`) |

Page size: **25** (admin table default).

Pagination UI: prev/next + "Showing X–Y of Z" from server-side count.

Extend `@unveiled/db` with filtered count helper:

```typescript
countPartners(db, { q?: string }) // same filter as listPartners
```

Compute `offset = (page - 1) * 25`. Preserve `q` in pagination link query strings.

List thumbnails: when `partner.logoImageId` set, render `<img>` inside HeroUI wrapper with `buildVariantUrl(logoImageId, "small-320.webp")` — exception allowed per AGENTS.md for images without HeroUI primitive.

**Alternative considered:** Count via `listPartners` without total. Rejected — pagination spec requires server-side total count.

### 5. Admin components

```
apps/web/app/components/admin/
├── AdminPageShell.tsx     # title, breadcrumbs, primary actions slot
├── AdminTable.tsx         # HeroUI Table wrapper for list rows
├── PartnerForm.tsx        # shared create/edit fields + logo file/URL inputs
├── AdminPagination.tsx    # prev/next links preserving query params
└── AdminSearchForm.tsx    # GET form with q input
```

All HeroUI primitives; layout-only Tailwind. Buttons use `button button--primary` / `button--secondary` theme classes.

Copy: add `admin` section to `apps/web/app/lib/copy.ts` (DE/EN inline strings for dashboard, partners list, form labels, validation messages mapped from error codes).

### 6. Dashboard

`GET /:locale/admin`:

- Quick links: Partners list, Events list (events link may 404 until step 04 — still show as placeholder per sitemap).
- Stat placeholders or zero-state copy when tables empty.
- If `shouldRunDemoSeed(db)` → render seed form POST button.
- If not empty → no seed control.

`POST /:locale/admin` (action `seed-demo`):

- Guard ADMIN.
- Call `runDemoSeed(db)`.
- Redirect back to dashboard with flash-style query param or success message in render (`?seeded=1` / `?seedSkipped=1`).

Reuse `runDemoSeed` from `@unveiled/db` — same logic as CLI script.

### 7. Delete flow

`GET /:locale/admin/partners/:id/delete` — confirmation page showing partner name.

`POST` — call `deletePartner(db, id)`. On `CatalogValidationError` with code `PARTNER_HAS_EVENTS`, re-render with error message. On success redirect to list.

### 8. Navbar ADMIN link

In `AppNavbar` and `AppNavbarMenu`, when `session?.user.role === "ADMIN"`, show link to `/${locale}/admin` labeled from copy (`admin.nav.dashboard` or similar). Do not show to USER/PARTNER.

### 9. i18n and SEO

- All routes under `/:locale/admin/*` — locale from param.
- `robots: "noindex"` on admin pages (auth-gated, per seo conventions).
- Page titles via existing render metadata pattern.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Multipart file size exceeds host limit | Document 8 MB limit from image-uploads; domain rejects undersized/oversized |
| R2 unavailable during logo upload | Surface domain error on form; document env vars in DEPLOYMENT.md |
| `countPartners` without search filter breaks pagination totals | Add filtered count in same change |
| Events quick link 404 before step 04 | Acceptable stub; link prepares admin shell for step 04 |
| Duplicate auth checks (middleware + guard) | Intentional defense in depth; guard enables route-level session typing |

## Migration Plan

1. Implement on branch `catalog-03-admin-partners-and-dashboard`.
2. Optional small `@unveiled/db` change: `countPartners(db, { q })` with search filter.
3. No new Drizzle migration.
4. Verify with ADMIN account: create partner (URL logo), list thumbnail, seed on empty DB, USER blocked.
5. `bun run lint && bun run typecheck && bun run build`.
6. Rollback: revert branch; no DB rollback.

## Open Questions

- None blocking. Admin copy can be inline DE/EN in `copy.ts` until a dedicated i18n inventory entry exists.
