## Context

Auth step 01 (`@unveiled/db`) is merged: `public.users` and `public.subscriptions` exist with Drizzle migrations. Neon Auth hosts Better Auth in the same Postgres project under `neon_auth`; the app must not model or implement that schema. `better-auth-ui` (step 03) requires a **same-origin** Better Auth API at `/api/auth/*`.

Current state: `apps/web` has marketing routes only; no `packages/auth/`, no API auth proxy, no session middleware. `AUTH_URL` and `DATABASE_URL` are documented in `DEPLOYMENT.md` but unused at runtime.

Source of truth: `.dev-plan/current-iteration/auth-02-neon-auth-and-session-layer.md`, `docs/migration/features/auth.feature` (signup starter state), `docs/migration/extras/authorization-matrix.md` (role model).

## Goals / Non-Goals

**Goals:**

- Scaffold `@unveiled/auth` with typed session model, Hono guard factories, and idempotent `provisionNewUser`.
- Forward `/api/auth/*` to `AUTH_URL` preserving method, path suffix, body, cookies, and relevant headers.
- On first authenticated request with no `public.users` row, provision starter state (`USER`, 17 credits, `INACTIVE` subscription, `onboarding_complete: false`).
- Export `getSession(c)` helper for SSR loaders via thin `apps/web/app/lib/auth.ts` wrapper.
- Wire `apps/web` dependencies on `@unveiled/auth` and `@unveiled/db`.

**Non-Goals:**

- Auth UI pages, `@better-auth-ui/*` install, login/signup routes (step 03).
- Protected-route redirects, navbar session display (step 04).
- Onboarding flow redirects (Phase 3).
- GDPR export/deletion.
- Reimplementing Better Auth routes or Drizzle `neon_auth` modeling.

## Decisions

### 1. Package layout

```
packages/auth/
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── index.ts           # public exports
    ├── session.ts         # getSession, types, Neon Auth fetch + DB join
    ├── guards.ts          # requireAuth, requireRole, optionalSession
    └── provision-user.ts  # provisionNewUser(db, neonAuthUser, profile?)
```

**Rationale:** Matches IMPLEMENTATION-PLAN; keeps business logic out of route files. Packages never depend on `apps/web`.

### 2. Auth forward proxy (HonoX route)

- **Route:** `apps/web/app/routes/api/auth/[...path].ts` — HonoX catch-all under `/api/auth/`.
- **Target:** `${AUTH_URL}/${path}` (strip `/api/auth` prefix; preserve remainder and query string).
- **Forward:** HTTP method, request body (for POST/PUT/PATCH), `Cookie`, `Authorization`, `Content-Type`, and other Better Auth–relevant headers.
- **Response:** Pass through status, body, and `Set-Cookie` headers; rewrite cookie `Domain`/`Path` if needed so cookies bind to app origin.
- **Env:** Read `AUTH_URL` in route handler only; fail fast with 503 if unset in production paths.

**Alternative considered:** Implement Better Auth in-repo. Rejected — Neon Auth owns the backend; AGENTS.md mandates forward-only proxy.

**Alternative considered:** Client-side calls directly to Neon URL. Rejected — cross-origin cookies break `better-auth-ui`; same-origin proxy is required.

### 3. Session resolution

```typescript
// Conceptual flow in session.ts
type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  partnerId: string | null;
  credits: number;
  onboardingComplete: boolean;
};

type AppSession = { user: SessionUser } | null;
```

- **Neon Auth fetch:** Server-side `fetch` to same-origin `/api/auth/get-session` (or internal forward to `AUTH_URL`) forwarding the incoming request's `Cookie` header — avoids hardcoding Neon URL in package.
- **DB join:** Query `public.users` by `id` from Better Auth session user; map `profile.onboarding_complete`, `credits`, `role`, `partner_id`.
- **Provisioning trigger:** If Better Auth session is valid but no DB row, call `provisionNewUser` then re-fetch user row (see §4).
- **Factory:** `createAuthServices({ db, authBaseUrl })` or pass `db` + `Context` per call — no env reads inside `@unveiled/auth`.

**Alternative considered:** Post-signup webhook from Neon Auth. Rejected for step 02 — first-request provisioning is simpler, idempotent, and matches iteration spec; webhook can be added later if needed.

### 4. `provisionNewUser`

- **Input:** Drizzle db handle, Neon Auth user `{ id, email, emailVerified?, name?, image? }`, optional profile hints from signup metadata (`first_name`, `last_name` from Better Auth user fields).
- **Insert `users`:** `id` = Neon Auth user id, `email`, `email_verified`, `role = USER` (never from client), `credits = 17`, `profile.onboarding_complete = false`, names from metadata when present.
- **Insert `subscriptions`:** `user_id`, `status = INACTIVE`, `plan = BASIC_BERLIN` (nullable plan column per schema — set when provisioning for clarity).
- **Idempotency:** Use `INSERT ... ON CONFLICT DO NOTHING` on `users.id` or check-then-insert in transaction; safe on concurrent first requests. Return existing row if already provisioned.
- **Never trust:** Client-supplied `role`, `credits`, or `partnerId`.

Google OAuth first login uses the same function — role always `USER`.

### 5. Guard middleware

```typescript
requireAuth()        // 401 if no session; sets c.set('session', appSession)
requireRole('ADMIN', 'PARTNER')  // 403 if role mismatch
optionalSession()    // attaches session or null; never blocks
```

- Store resolved `AppSession` on Hono context (`c.set('session', ...)`) for downstream handlers.
- `requireAuth` returns JSON 401 for API routes; redirect behavior deferred to step 04 for page routes.
- Role type from `@unveiled/db` `userRoleEnum`.

### 6. Web app integration

- **`apps/web/app/lib/auth.ts`:** Instantiate `createDb(process.env.DATABASE_URL!)` once (or lazy singleton), export `getSession(c)` delegating to `@unveiled/auth`.
- **`apps/web/package.json`:** Add `"@unveiled/auth": "workspace:*"`, `"@unveiled/db": "workspace:*"`.
- **Dependencies in `@unveiled/auth`:** `@unveiled/db`, `hono` (types only or peer), optionally `better-auth` for response typing — avoid pulling React.

### 7. Verification approach

| Check | Method |
|---|---|
| Proxy alive | `curl -I http://localhost:3000/api/auth/get-session` → non-404, forwarded response |
| Lint/typecheck | `bun run lint` && `bun run typecheck` |
| Provisioning | After Neon Auth creates user, query DB for `credits=17`, `role=USER`, `subscriptions.status=INACTIVE` |
| Guards | Unit test or manual Hono invoke: `requireAuth` without cookie → 401 |

Document provisioning trigger (first session resolve) in `packages/auth/README.md`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Race on concurrent first requests double-inserts | Idempotent upsert / ON CONFLICT on `users.id`; transaction for user + subscription |
| Cookie not set on app origin after proxy | Forward `Set-Cookie` from Better Auth response; test sign-in in step 03 |
| `AUTH_URL` misconfigured | Fail fast in proxy handler; document in DEPLOYMENT.md |
| Session fetch adds latency to every SSR page | Acceptable for step 02; cache session on context per request only |
| Package calls same-origin proxy (loop) | Use direct `AUTH_URL` fetch inside `@unveiled/auth` when called from SSR, or internal helper that hits Neon URL without routing back through Hono — **prefer direct `AUTH_URL` in session.ts** to avoid recursion when proxy and getSession run in same process |
| Google signup missing name metadata | Provision with empty profile names; onboarding step collects later |

**Important:** `getSession` inside `@unveiled/auth` SHOULD fetch `AUTH_URL/get-session` directly (forwarding cookies from Hono `Context`), not call back into `/api/auth/get-session` on localhost — prevents infinite loop and skips double proxy hop.

## Migration Plan

1. Implement on branch `auth-02-neon-auth-and-session-layer`.
2. `bun install` — link `@unveiled/auth`.
3. Set `DATABASE_URL` and `AUTH_URL` in `.env`; confirm migrations applied.
4. Run dev server; verify proxy with curl.
5. Manual test: create Neon Auth user via API/dashboard; confirm DB provisioning.
6. Deploy to staging with env vars; update `DEPLOYMENT.md` if proxy path or env notes change.
7. Rollback: remove proxy route and auth package usage; no DB schema changes in this step.

## Open Questions

- None blocking step 02. Redirect vs JSON for `requireAuth` on HTML routes will be finalized in step 04 (protected routes).
