## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/waitlist-account-03-profile-and-preferences.md`, parent guide, `proposal.md`, `design.md`, and `specs/member-profile/spec.md`
- [x] 1.2 Confirm `UserProfile` / credits / `preferences_updated_at` in `packages/db/src/schema/users.ts` and onboarding helpers in `packages/auth/src/onboarding.ts`
- [x] 1.3 Skim `docs/product/features/profile.feature`, sitemap `/profile*` entries, and app-shell Profile nav
- [x] 1.4 Confirm auth-ui `settings` path is `/:locale/profile` and `MEMBER_APP_PREFIXES` includes `profile`

## 2. Profile domain helpers

- [x] 2.1 Create `packages/auth/src/profile.ts` with typed `ProfileValidationError` (or reuse onboarding error pattern)
- [x] 2.2 Implement `updateProfileIdentity(db, userId, { first_name, last_name, email })` — merge names into `profile`, uniqueness-check + update `users.email`, sync Neon Auth / Better Auth on email change (fail closed)
- [x] 2.3 Implement `updateCulturalPreferences(db, userId, payload)` — validate via onboarding allowlists (`interests`/`location`/`timing` fields), merge profile preference fields, set `behavior.preferences_updated_at` via `berlinIsoNow()`, do **not** mutate `onboarding_step` / `onboarding_complete`
- [x] 2.4 Re-export public profile API from `packages/auth/src/index.ts`
- [x] 2.5 Document helpers + email-sync approach in `packages/auth/README.md`

## 3. Domain tests

- [x] 3.1 Add `packages/auth/src/profile.test.ts` — invalid preference rejected; `max_distance` out of range rejected
- [x] 3.2 Test preference merge preserves unrelated profile fields and leaves `onboarding_step` / `onboarding_complete` unchanged; sets `preferences_updated_at`
- [x] 3.3 Test identity validation rejects empty names; duplicate email rejected (integration with `DATABASE_URL` or mocked tx; skip when unset)

## 4. Profile UI components

- [x] 4.1 Add `apps/web/app/components/profile/` — HeroUI-only identity form, credit wallet display, nav links (preferences, billing stub, refill, password, optional GDPR)
- [x] 4.2 Add preferences (“Vibes”) form reusing onboarding constants/labels from `@unveiled/auth/constants` and `onboarding-content.ts` (same multi-select patterns as onboarding)
- [x] 4.3 Add password/security island wrapping `@better-auth-ui/heroui` `ChangePassword` or `SecuritySettings` under `AppAuthProvider`

## 5. Routes

- [x] 5.1 Implement `apps/web/app/routes/[locale]/profile.tsx` — GET wallet + identity form; POST → `updateProfileIdentity`; auth/onboarding guards; PRG redirect on success
- [x] 5.2 Implement `apps/web/app/routes/[locale]/profile/preferences.tsx` — GET/POST → `updateCulturalPreferences`
- [x] 5.3 Implement `apps/web/app/routes/[locale]/profile/security.tsx` (or equivalent) for password-change Better Auth UI entry
- [x] 5.4 Wire refill CTA to `localizedPath(locale, "membership")`; link billing to `/:locale/profile/billing` (stub); optional GDPR entry links without handlers

## 6. App shell

- [x] 6.1 Add Profile nav link for `USER` → `/:locale/profile` in `AppNavbar` per `docs/product/ui/app-shell.md`

## 7. Validation

- [x] 7.1 Run `cd packages/auth && bun test` — profile tests pass
- [x] 7.2 Run `bun run typecheck` — exits 0
- [x] 7.3 Run `bun run lint` — exits 0
- [x] 7.4 Confirm billing portal/cancel and GDPR handlers were **not** implemented

## 8. Wrap-up

- [x] 8.1 Update `docs/product/` only if behavior diverges from `profile.feature`
- [x] 8.2 Mark step 03 done in `waitlist-account-parent-guide.md` when change is ready to archive
- [x] 8.3 Hand off to `waitlist-account-04-billing-portal-and-cancel` with change ID + parent guide link
