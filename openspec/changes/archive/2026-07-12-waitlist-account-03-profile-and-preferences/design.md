## Context

Phase 7 steps 01–02 shipped waitlist schema/domain/UI. Auth UI config already sets `settings` base path to `/:locale/profile` with view paths `account` and `security`, and onboarding middleware already includes `profile` in `MEMBER_APP_PREFIXES`. There are **no** `apps/web/app/routes/[locale]/profile*` files and no package helper to update identity or post-onboarding preferences.

Existing building blocks:

- `UserProfile` / `UserBehavior` on `public.users` (`packages/db/src/schema/users.ts`) — names in `profile.first_name` / `last_name`; credits on `users.credits`; preference arrays in profile JSONB; `behavior.preferences_updated_at`.
- `@unveiled/auth` onboarding: allowlists, `validateOnboardingStepPayload`, `saveOnboardingStep` (advances `onboarding_step` — **not** safe to call for onboarded preference edits).
- Onboarding forms + `onboarding-content.ts` labels/options; body parsers in `onboarding-route.ts`.
- `@better-auth-ui/heroui` exports `ChangePassword` / `SecuritySettings` / `AccountSettings` (unwired).
- Product SoT: `docs/product/features/profile.feature`, sitemap `/profile` + `/profile/preferences`, app-shell Profile → `/profile`.

Source of truth for this change: `.dev-plan/current-iteration/waitlist-account-03-profile-and-preferences.md`, parent guide, and this change’s proposal/specs.

## Goals / Non-Goals

**Goals:**

- Authenticated `/:locale/profile` — view credit balance, edit first/last name + email via SSR form POST, links to preferences / billing stub / refill / password / optional GDPR entry points.
- Authenticated `/:locale/profile/preferences` — edit cultural preferences (interests, moods, districts, travel radius, timing, preferred days, languages, accessibility) via SSR POST; persist to `users.profile` + `behavior.preferences_updated_at`.
- Package-level helpers in `@unveiled/auth` (not business logic only in routes).
- Password change via Neon Auth / Better Auth UI reachable from profile.
- Refill CTA → `/:locale/membership`.
- Navbar Profile link per app-shell if still missing.
- Unit tests for profile helpers (validation + merge behavior without requiring cloud services).

**Non-Goals:**

- `/profile/billing`, Stripe Customer Portal, cancel → `CANCELLED_PENDING` (step 04).
- GDPR export/delete page implementations (Phase 8) — entry links only.
- Waitlist UI (step 02), Playwright / Ladle / release docs (step 05).
- New preference vocabularies or parallel allowlists.
- Custom password / credential store.
- Changing onboarding wizard behavior or `onboarding_step` progression.

## Decisions

### 1. Module layout (domain)

```
packages/auth/src/
├── profile.ts           # updateProfileIdentity, updateCulturalPreferences, validation errors
├── profile.test.ts      # unit tests
└── index.ts             # re-export public profile API
```

**Rationale:** Same package as onboarding; routes stay thin. Prefer extending `@unveiled/auth` over a new package.

**Alternatives considered:** Put helpers in `@unveiled/db` (rejected — DB package stays schema/client); put only in `apps/web` (rejected — AGENTS.md business logic rule).

### 2. Do not reuse `saveOnboardingStep` for Vibes edits

`saveOnboardingStep` mutates `behavior.onboarding_step` and is ordered for the wizard. For onboarded members:

- Reuse **allowlists** and validation logic (extract shared validators if needed, or call `validateOnboardingStepPayload` for `interests` / `location` / `timing` and merge results).
- New `updateCulturalPreferences(db, userId, payload)` merges preference fields into `profile`, sets `behavior.preferences_updated_at = berlinIsoNow()`, updates `updatedAt`, **does not** change `onboarding_step`, `onboarding_complete`, or identity fields.

**Payload shape:** Single preferences object covering interests, moods, districts, max_distance, timing, preferred_days, preferred_languages, accessibility (union of onboarding interests + location + timing fields; exclude age).

### 3. Identity update + email sync

```typescript
updateProfileIdentity(db, userId, { first_name, last_name, email })
```

- **Names:** Merge into `users.profile.first_name` / `last_name` (trim; non-empty required).
- **Email:** Normalize (trim + lowercase). Update `public.users.email` when changed. Enforce uniqueness on `public.users` (query conflict → typed validation error).
- **Neon Auth sync:** When email changes, also invoke the Better Auth / Neon Auth change-email (or update-user) endpoint via the existing same-origin `/api/auth/*` proxy (server-side fetch with the member’s session cookie forwarded), so auth identity and `public.users` stay aligned. If the auth provider rejects the change, abort and do not leave a split-brain email (transaction or compensating revert on `public.users`).
- **Do not** invent a second user store or model `neon_auth` in Drizzle.

**Alternatives considered:** Email-only via Better Auth UI `AccountSettings` on `/profile/account` (cleaner auth ownership) — deferred as secondary path; step plan requires SSR identity form including email. Names remain SSR either way (`additionalFields` have `profile: false` on signup fields).

### 4. Routes and SSR POST pattern

| Route | File | Behavior |
|---|---|---|
| `GET/POST /:locale/profile` | `apps/web/app/routes/[locale]/profile.tsx` | Wallet + identity form; POST → `updateProfileIdentity` → redirect/re-render with error |
| `GET/POST /:locale/profile/preferences` | `apps/web/app/routes/[locale]/profile/preferences.tsx` | Vibes form; POST → `updateCulturalPreferences` |
| `GET /:locale/profile/security` | thin route + island | Renders `@better-auth-ui/heroui` `SecuritySettings` or `ChangePassword` inside existing `AppAuthProvider` |
| Optional `GET /:locale/profile/account` | only if needed for auth-ui viewPaths | Prefer linking password to `/security`; skip full AccountSettings if identity is SSR on `/profile` |

Follow onboarding/waitlist patterns: `c.req.parseBody()`, package helper, validation error → re-render with message, success → `302` redirect (PRG). Use `guardMemberAppRoute` (or USER-scoped variant); onboarding middleware already redirects incomplete USERs away from `/profile`.

**Auth:** Session required (already in `PROTECTED_PREFIXES`). Sitemap marks USER; ADMIN may hit `/profile` per existing middleware tests — keep read/edit for USER; do not block ADMIN if already allowed.

### 5. UI composition

- New `apps/web/app/components/profile/*` built from HeroUI only (Card, Heading, Paragraph, Form, TextField, Button, Link, Chip for credits, etc.).
- **Reuse** `@unveiled/auth/constants` + `getInterestLabel` / mood / district helpers from `onboarding-content.ts` — no parallel vocabularies.
- Preferences form: mirror onboarding multi-select patterns already shipped (`CheckboxGroup`, `NumberField`, `Switch`) for field parity; do not invent new option strings. Prefer extracting shared field-group components only if duplication is painful in the same PR; otherwise copy structure with shared option helpers.
- Theme tokens / layout Tailwind only; yellow page backdrop via app shell.
- Profile page links:
  - Preferences → `/:locale/profile/preferences`
  - Billing → `/:locale/profile/billing` (stub link for step 04 — page need not exist yet)
  - Refill → `localizedPath(locale, "membership")`
  - Change password → `/:locale/profile/security`
  - Optional GDPR → `/:locale/profile/data-export`, `/:locale/profile/delete-account` (entry links only; pages Phase 8)

### 6. Navbar

Add Profile link for `USER` → `/:locale/profile` in `AppNavbar` (app-shell §5). Credits badge already exists.

### 7. Testing

| Area | Approach |
|---|---|
| Preference validation | Pure unit tests (invalid interest, distance bounds) |
| Preference merge | Unit/integration: unrelated profile fields preserved; `preferences_updated_at` set; `onboarding_step` unchanged |
| Identity validation | Empty name / duplicate email rejected |
| Routes | Manual / deferred e2e to step 05 |

Skip integration tests when `DATABASE_URL` unset (match auth package pattern).

### 8. i18n / copy

Locale in URL; DE/EN labels for profile chrome. Prefer existing content inventory / app-shell wording where specified; keep form labels consistent with onboarding copy helpers.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Email split-brain (Neon Auth vs `public.users`) | Dual-write with auth-provider call; fail closed on auth rejection; document in README |
| Calling `saveOnboardingStep` by mistake | Dedicated `updateCulturalPreferences`; code review + unit test asserts `onboarding_step` unchanged |
| Dead GDPR / billing links | Billing is intentional stub for step 04; GDPR links are Phase 8 entry points per parent guide |
| CheckboxGroup vs “no checkboxes” hard rule | Match **shipped** onboarding multi-select patterns for consistency (step plan allows “patterns already used in onboarding”) |
| Better Auth UI security route conflicts with SSR `/profile` | Use nested `/profile/security` island only; keep identity SSR on `/profile` root |
| ADMIN editing profile | Allow if middleware already permits; primary persona is USER |

## Migration Plan

1. Implement on branch `waitlist-account-03-profile-and-preferences`.
2. No DB migration (JSONB + existing columns only).
3. Run package tests, `bun run lint`, `bun run typecheck`.
4. Hand off to step 04 (billing under profile shell).
5. Rollback: remove routes/components/helpers; no schema to revert.

## Open Questions

- **Neon Auth change-email API shape:** Confirm exact server-side endpoint/body when implementing (Better Auth `change-email` vs `update-user`). Not blocking design — spike during apply; if server dual-write is blocked by Neon Auth hosted constraints, fall back to SSR names + Better Auth UI email change on `/profile/account` and document the deviation in the parent guide / DEPLOYMENT notes.
- **Billing stub UX:** Plain link to `/profile/billing` (may 404 until step 04) vs disabled “Coming in next step” label — prefer real href so step 04 lights up without profile rework.
