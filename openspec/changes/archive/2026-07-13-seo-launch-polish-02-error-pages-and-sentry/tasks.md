## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/seo-launch-polish-02-error-pages-and-sentry.md`, parent guide, `docs/product/sitemap/sitemap.md` error notes, `docs/product/extras/integrations-and-config.md` (Sentry / cookie consent), and current `NotFoundPage` + `app/server.ts` / `_404` routes
- [x] 1.2 Confirm Workers-appropriate Sentry package (`@sentry/cloudflare` or current recommended workerd SDK) and whether server-only init is enough for this step
- [x] 1.3 Note current wrong-role behavior (`guardAdminRoute` redirect) — keep it; do not switch admin wrong-role to ForbiddenPage by default

## 2. Error page components

- [x] 2.1 Add HeroUI `ForbiddenPage` (403) matching `NotFoundPage` layout — locale DE/EN copy, no stack traces, secondary CTA to `/${locale}`
- [x] 2.2 Add HeroUI `ServerErrorPage` (500) with the same composition patterns
- [x] 2.3 Add Ladle stories for Forbidden and ServerError (German + English), consistent with `NotFoundPage.stories.tsx`

## 3. Error wiring

- [x] 3.1 Wire Hono `onError` on the outer app in `apps/web/app/server.ts` to render `ServerErrorPage` with status 500 and locale from the URL when HTML render is available; never include `error.stack` in the response body
- [x] 3.2 For `/api/*` (and when `c.render` is unavailable), return a minimal JSON/plain 500 without stack traces; still log + capture to Sentry when configured
- [x] 3.3 If HonoX exposes a locale `_error` (or equivalent) entrypoint, wire it to `ServerErrorPage`; keep outer `onError` as catch-all
- [x] 3.4 Ensure true forbidden HTML paths can render `ForbiddenPage` with status 403 where needed; leave `guardAdminRoute` redirect for non-ADMIN members

## 4. Optional Sentry

- [x] 4.1 Add Workers-compatible Sentry dependency and init only when `SENTRY_DSN` is set (via `runtime-env` / Worker bindings); PII-free (`sendDefaultPii: false` or equivalent; scrub auth headers/cookies)
- [x] 4.2 Capture unhandled errors from `onError` when Sentry is initialized; confirm app boots with DSN unset and init does not throw
- [x] 4.3 Prefer server-only Sentry for this step; if client SDK is added, update `e2e/specs/static-pages.spec.ts` “Error tracking is not gated behind consent” accordingly — otherwise leave the existing `window.Sentry` assertion and comment that client SDK is not shipped

## 5. Docs and handoff

- [x] 5.1 Update `apps/web/DEPLOYMENT.md` and `.env.example` for optional `SENTRY_DSN` (Phase 8 polish); confirm `integrations-and-config.md` still states Sentry is ungated / strictly necessary
- [x] 5.2 Mark step 02 done in `seo-launch-polish-parent-guide.md`; note staging DSN setup for step 03 cutover checklist; handoff linking `seo-launch-polish-02-error-pages-and-sentry`

## 6. Validation

- [x] 6.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 6.2 Local smoke: member hitting `/admin` redirects to locale home (safe wrong-role); verify ForbiddenPage via Ladle; force a controlled/non-production 500 and confirm branded `ServerErrorPage` with no stack in HTML
- [x] 6.3 Boot with `SENTRY_DSN` unset; with DSN set (if available), confirm init does not throw
