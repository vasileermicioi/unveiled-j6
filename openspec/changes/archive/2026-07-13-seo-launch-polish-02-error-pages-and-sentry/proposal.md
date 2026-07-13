## Why

Phase 8 SEO launch polish step 02: production still lacks branded 403/500 pages and optional Sentry, so unhandled failures risk raw framework errors or JSON, and operators have no Workers-compatible monitoring hook. Sitemap/SEO gaps from step 01 are done; this step closes failure UX and optional observability before the MVP audit/cutover in step 03.

## What Changes

- Add HeroUI `ForbiddenPage` (403) and `ServerErrorPage` (500) compositions aligned with existing `NotFoundPage` (locale copy, brand yellow backdrop, secondary CTA home)
- Wire HonoX / Hono error handling so unhandled errors render the 500 page under `/:locale` when possible; never expose stack traces to end users
- Keep wrong-role admin access preferring redirect/404 per auth matrix (`guardAdminRoute` already redirects non-ADMIN members to `/:locale`); provide a generic 403 composition for true forbidden cases and any path that must return 403
- Optional Sentry: initialize server (+ client if needed) only when `SENTRY_DSN` is set; PII-free; Workers-compatible SDK; app MUST boot cleanly when DSN is unset
- Document `SENTRY_DSN` in `DEPLOYMENT.md` / `.env.example`; confirm cookie-consent docs still treat Sentry as ungated / strictly necessary
- Add Ladle stories for 403/500 (and keep 404 stories consistent)

**Out of scope:** Full MVP e2e audit; GDPR/admin product features; mandatory Sentry in all envs; partner check-in; `seo-launch-polish-03`

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `platform-foundation`: Add branded HeroUI 403/500 error pages (no stack traces; wrong-role SHOULD prefer redirect/404 when leaking existence is undesirable) and optional PII-free Sentry init behind `SENTRY_DSN` that MUST NOT throw when unset

## Impact

- **Code:** `apps/web/app/components/` (ForbiddenPage, ServerErrorPage + stories); HonoX error entrypoints (`app/server.ts`, `_404` patterns, possible `_error` / `onError`); optional `@sentry/*` Workers-compatible package; `runtime-env.ts` already lists `SENTRY_DSN`
- **Auth UX:** Prefer existing redirect behavior for member→admin; use ForbiddenPage only where a true 403 response is required
- **Docs:** `apps/web/DEPLOYMENT.md`, `.env.example`; mark step 02 done in `seo-launch-polish-parent-guide.md`; confirm `integrations-and-config.md` cookie-consent / Sentry ungated note
- **Downstream:** Consumed by `seo-launch-polish-03-mvp-audit-and-cutover` (error stories / cutover DSN checklist)
- **Verification:** `bun run lint`, `typecheck`; smoke 403 path (member `/admin` → safe redirect or branded forbidden) and controlled 500; boot with DSN unset; DSN set (if available) init does not throw
