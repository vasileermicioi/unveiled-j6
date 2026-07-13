## Context

Phase 8 `seo-launch-polish-02`. Today the app has locale-aware `NotFoundPage` (`_404.tsx`, `[locale]/_404.tsx`, inline route renders) but no branded 403/500 compositions and no Sentry package. Unhandled exceptions fall through Hono/HonoX defaults (likely plain text/JSON). `SENTRY_DSN` is already listed in `runtime-env.ts`, `.env.example`, `DEPLOYMENT.md`, and `scripts/set-worker-secrets.ts`, but nothing initializes Sentry.

Wrong-role admin access already prefers non-leaky handling: `guardAdminRoute` redirects authenticated non-ADMIN users to `/${locale}` (302) and unauthenticated users to login. Product sitemap notes: 403 “prefer redirect/404 over leaking existence”; 500 “generic error (+ Sentry when configured)”. Cookie consent: Sentry is strictly necessary / ungated (`integrations-and-config.md`).

## Goals / Non-Goals

**Goals:**

- HeroUI 403 (`ForbiddenPage`) and 500 (`ServerErrorPage`) matching `NotFoundPage` layout (Surface transparent, Heading, Paragraph muted, secondary home CTA), DE/EN copy, brand yellow via app shell.
- Wire Hono `onError` (and any HonoX error entrypoint found at apply time) to render `ServerErrorPage` with HTTP 500, locale from URL when possible, **no stack traces** in the HTML body.
- Keep admin wrong-role as redirect/404; ship ForbiddenPage for true forbidden cases and smoke/Ladle.
- Optional Sentry behind `SENTRY_DSN`: Workers-compatible SDK, PII-free, no-op when unset.
- Ladle stories for Forbidden + ServerError (DE/EN); env docs updated; step 02 marked done in parent guide.

**Non-Goals:**

- Changing GDPR/admin product flows; full MVP e2e audit (`seo-launch-polish-03`).
- Mandatory Sentry in staging/production when DSN unset.
- Partner portal / check-in pages.
- Replacing MapLibre consent gating or reopening Phase 5.5 DS work.
- Requiring ForbiddenPage for every wrong-role admin hit (redirect remains preferred).

## Decisions

### 1. Error page components mirror NotFoundPage

```
apps/web/app/components/ForbiddenPage.tsx
apps/web/app/components/ServerErrorPage.tsx
apps/web/app/components/ForbiddenPage.stories.tsx
apps/web/app/components/ServerErrorPage.stories.tsx
```

Props: `{ locale: "de" | "en" }` only. Copy inline (same pattern as NotFoundPage) or a tiny shared `error-pages-content.ts` if duplication hurts — prefer inline first for consistency with 404.

HTTP status set by the route/handler (`c.status(403)` / `c.status(500)`), not by the component. Meta: `noindex` via existing page-meta helpers where render paths already pass meta (match 404).

**Rationale:** Visual SoT is NotFoundPage; HeroUI-only; theme tokens already provide yellow backdrop via layout.

**Alternatives:** One `ErrorPage` with `code` prop — fine if it stays HeroUI-only; two named exports are clearer for Ladle and sitemap naming.

### 2. Wrong-role: keep redirect; ForbiddenPage for true 403

Do **not** change `guardAdminRoute` to render ForbiddenPage by default. Product SoT prefers redirect/404 so members cannot confirm admin URL existence via a distinct 403 page.

Use `ForbiddenPage` when:

- A handler intentionally returns HTTP 403 for a resource the user is allowed to know exists but cannot act on (rare in MVP SSR pages today).
- Ladle / local smoke of the composition itself.
- Optional future: JSON API `requireRole` already returns `{ error: "Forbidden" }` — leave API JSON as-is; this step targets HTML page UX.

**Smoke for “403”:** Document that member hitting `/admin` expects **redirect to locale home** (current safe behavior). Separately verify ForbiddenPage via Ladle (and optional controlled HTML render if a single route is wired for demo). Do not invent a public `/forbidden` marketing route.

### 3. Global `onError` → ServerErrorPage

In `apps/web/app/server.ts` (outer Hono wrapping Honox `createApp()`):

1. Parse locale from path (`/^\/(de|en)(\/|$)/`) else default `de`.
2. Log error server-side (`console.error` + Sentry capture when configured).
3. `c.status(500)` and `c.render(<ServerErrorPage locale={…} />, { title, robots: noindex })` when render is available; if render fails or request is non-HTML (`/api/*`), return minimal JSON `{ error: "Internal Server Error" }` without stack.

If HonoX exposes a dedicated `_error.tsx` / error boundary at apply time, prefer that for locale routes **and** keep app-level `onError` as the catch-all for unhandled throws outside route modules.

**Controlled 500 smoke:** Prefer a **non-production** or explicitly gated path (e.g. only when `process.env.NODE_ENV !== "production"` and a query/flag) that throws, **or** temporarily throw in a local-only handler during verification — do not ship an always-on public `/crash` in production. Document the chosen smoke method in handoff.

**Rationale:** Outer `onError` covers routes under `mainApp` and avoids leaking stacks; API paths stay JSON-safe.

### 4. Optional Sentry — Workers-first package

- Add **`@sentry/cloudflare`** (or current Sentry Workers SDK recommended for workerd at apply time) for server/Worker init.
- Init once when `SENTRY_DSN` / `resolveEnvVar…("SENTRY_DSN")` is non-empty; wrap Worker export with Sentry’s Cloudflare helper if that is the supported pattern for the chosen SDK version.
- Client: only add `@sentry/react` (or Cloudflare browser bundle) if needed for island/client errors; otherwise server-only is enough for this step. Prefer **server-first**; client init is optional follow-on if trivial.
- Config: `sendDefaultPii: false` (or equivalent); scrub `Authorization`, cookies, and email-like strings from breadcrumbs/request data; do not attach session user email/id by default.
- **No cookie-consent gate** — matches product: Sentry is strictly necessary.
- When DSN unset: skip import side effects that throw; lazy/dynamic import behind `if (dsn)` so cold start without DSN stays clean.

Update `DEPLOYMENT.md` Phase note (Phase 8 polish / optional) and ensure `.env.example` comment matches. Keep `SENTRY_DSN` in worker secrets script list (already present).

**Alternatives:** `@sentry/node` — wrong for Workers. `@sentry/react` only — misses SSR throws.

### 5. Docs and e2e note

- Confirm `integrations-and-config.md` still says Sentry ungated.
- Existing e2e “Error tracking is not gated behind consent” currently asserts `window.Sentry` is `undefined` after decline — **update that assertion** if client SDK is wired (assert SDK may load without consent / no consent gate for Sentry). If server-only Sentry, leave the test as-is (no `window.Sentry`) and add a short comment that client SDK is not shipped yet.
- Parent guide: mark step 02 done; note staging DSN optional for cutover checklist in step 03.

### 6. Ladle

Stories mirror NotFoundPage: German + English for Forbidden and ServerError. No live session required.

## Risks / Trade-offs

- **[onError + c.render unavailable in some contexts]** → Mitigation: JSON/plain fallback for `/api/*` and when render fails; never attach `error.stack` to response body.
- **[Sentry Workers SDK API drift]** → Mitigation: pin a current major; follow Context7 / Sentry Cloudflare docs at apply time; feature-detect DSN.
- **[Client Sentry breaks consent e2e]** → Mitigation: prefer server-only in this step; if client ships, update the static-pages e2e scenario.
- **[Showing 403 for admin URLs leaks existence]** → Mitigation: keep `guardAdminRoute` redirect; do not switch admin wrong-role to ForbiddenPage.
- **[Public crash route for smoke]** → Mitigation: no production always-on crash URL; use Ladle + gated/local throw for 500 verification.
- **[Bundle size / Workers limits]** → Mitigation: conditional init; tree-shake unused Sentry integrations.

## Migration Plan

1. Add ForbiddenPage + ServerErrorPage (+ stories) matching NotFoundPage.
2. Wire `app.onError` in `server.ts` (+ HonoX error file if present).
3. Add optional Sentry init behind `SENTRY_DSN`; verify boot without DSN.
4. Update `DEPLOYMENT.md` / `.env.example`; confirm consent docs; adjust e2e only if client SDK lands.
5. Lint + typecheck; smoke redirect for member `/admin`; smoke 500 via gated throw; Ladle stories visible.
6. Mark step 02 done in `seo-launch-polish-parent-guide.md`; handoff to step 03 (DSN on staging checklist).

Rollback: remove Sentry package/init and error components; restore prior `onError`-less server — 404 path unchanged.

## Open Questions

- None blocking. At apply time: confirm exact HonoX error-file convention and the current `@sentry/cloudflare` Worker export wrapper API; choose server-only vs light client init based on package friction (prefer server-only if client complicates consent e2e).
