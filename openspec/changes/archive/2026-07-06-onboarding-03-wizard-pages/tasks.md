## 1. Pre-flight

- [x] 1.1 Read `.dev-plan/current-iteration/onboarding-03-wizard-pages.md`, `proposal.md`, `design.md`, and `specs/member-onboarding/spec.md`
- [x] 1.2 Read `docs/migration/features/onboarding.feature`, `docs/migration/ui/ui-component-map.md`, and `design-tokens.md`
- [x] 1.3 Confirm steps 01–02 merged: `@unveiled/auth` onboarding helpers, `evaluateOnboardingRedirect` in locale middleware
- [x] 1.4 Review auth route patterns: `login.tsx`, `AuthPageLayout`, `auth-content.ts`

## 2. i18n content

- [x] 2.1 Create `apps/web/app/lib/onboarding-content.ts` with DE/EN strings from `content-i18n-inventory.md` (`onboardingTitle`, step labels, `next`/`skip`/`finish`, `km`)
- [x] 2.2 Export option label helpers using allowlist constants from `@unveiled/auth` (age groups, interests, moods, districts, timing, weekdays, languages)

## 3. Shared onboarding UI

- [x] 3.1 Create `apps/web/app/components/onboarding/OnboardingStepIndicator.tsx` — 4-step progress indicator (read-only, theme tokens)
- [x] 3.2 Create `apps/web/app/components/onboarding/OnboardingLayout.tsx` — title, subtitle, step indicator, error slot, children
- [x] 3.3 Create `AgeStepForm.tsx` — HeroUI `RadioGroup` for age groups, primary continue + secondary skip submit buttons
- [x] 3.4 Create `InterestsStepForm.tsx` — HeroUI `CheckboxGroup` for interests and moods
- [x] 3.5 Create `LocationStepForm.tsx` — HeroUI `CheckboxGroup` for districts + `Slider` or `NumberField` for `max_distance` (1–25)
- [x] 3.6 Create `TimingStepForm.tsx` — timing/days/languages checkbox groups, accessibility `Switch`, finish CTA

## 4. Route helpers

- [x] 4.1 Add shared onboarding route guard helper (session check, USER role, complete-user redirect, step-order check via `getOnboardingStepPath`)
- [x] 4.2 Add form-body parsers mapping POST fields to `@unveiled/auth` step payload types (including age skip via `action=skip`)

## 5. SSR routes

- [x] 5.1 Create `apps/web/app/routes/[locale]/onboarding/age.tsx` — GET render + POST save/skip → redirect to interests
- [x] 5.2 Create `apps/web/app/routes/[locale]/onboarding/interests.tsx` — GET render + POST save → redirect to location
- [x] 5.3 Create `apps/web/app/routes/[locale]/onboarding/location.tsx` — GET render + POST save → redirect to timing
- [x] 5.4 Create `apps/web/app/routes/[locale]/onboarding/timing.tsx` — GET render + POST save, `completeOnboarding`, redirect to `/:locale/membership`
- [x] 5.5 Create optional `apps/web/app/routes/[locale]/onboarding/index.tsx` — redirect to resolved step
- [x] 5.6 Set `robots: "noindex"` on all onboarding GET renders; pre-fill forms from saved profile values

## 6. Validation

- [x] 6.1 Run `bun run typecheck` — passes
- [x] 6.2 Run `bun run lint` — passes
- [ ] 6.3 Manual full wizard on `/de`: signup new USER → complete all four steps → lands on `/de/membership`; DB shows saved arrays and `onboarding_complete = true`
- [ ] 6.4 Manual skip-age path on `/de`: skip step 1 → complete wizard → `age_group` null in DB
- [ ] 6.5 Repeat smoke checks on `/en`; verify `noindex` meta and brand-yellow background on each step
- [ ] 6.6 Verify complete USER hitting `/de/onboarding/age` redirects to `/de/events`; guest redirects to login

## 7. Wrap-up

- [x] 7.1 Hand off to `onboarding-04-hardening-and-release`
- [ ] 7.2 Mark step 03 done in `onboarding-parent-guide.md` when change is archived
