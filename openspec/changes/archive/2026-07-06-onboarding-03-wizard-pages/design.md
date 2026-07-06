## Context

Onboarding steps 01–02 are merged:

- `@unveiled/auth` exports allowlists, `getOnboardingStepPath`, `saveOnboardingStep`, `completeOnboarding`, and `OnboardingValidationError`.
- `[locale]/_middleware.tsx` runs `evaluateOnboardingRedirect` after auth — incomplete USERs on member app prefixes redirect to the resolved wizard step; complete USERs on `/onboarding/*` redirect to `/:locale/events`.
- `AppSession.user` carries `profile`, `behavior`, and `onboardingComplete` for step resolution without extra DB reads.

No onboarding routes or UI exist yet. Auth pages (`login.tsx`, `AuthPageLayout`, `auth-content.ts`) establish the pattern for locale-prefixed SSR pages with `noindex` meta and HeroUI layout shells. This is the first feature using HonoX `export const POST` for SSR form mutations.

Source of truth: `.dev-plan/current-iteration/onboarding-03-wizard-pages.md`, `docs/migration/features/onboarding.feature`, `docs/migration/sitemap/sitemap.md`, `docs/migration/ui/ui-component-map.md`, `docs/migration/extras/content-i18n-inventory.md`, `design-tokens.md`.

## Goals / Non-Goals

**Goals:**

- Four locale-prefixed onboarding routes (`/onboarding/age`, `/interests`, `/location`, `/timing`) with GET (render) + POST (save + redirect).
- Shared `OnboardingLayout` with 4-step progress indicator, brand-yellow page background, DE/EN copy.
- Step forms built from HeroUI primitives (`RadioGroup`, `CheckboxGroup`, `Slider` or `NumberField`, `Switch`, `Button`/`Link`).
- POST handlers delegate to `@unveiled/auth`; timing step calls `completeOnboarding` then redirects to `/:locale/membership`.
- Route-level guards: signed-in USER only; complete USERs redirected to `/:locale/events`; out-of-order POSTs redirected to resolved step.
- `robots: "noindex"` on every onboarding render.
- Optional `/onboarding` index redirect via `getOnboardingStepPath`.

**Non-Goals:**

- Stripe checkout implementation on `/membership` (Phase 6 — page may already exist as marketing stub).
- `/events` feed UI (Phase 5).
- `/profile/preferences` edit flow (Phase 7).
- Client-side wizard state, modals, or multi-step SPA.
- Staging deploy, `DEPLOYMENT.md`, or parent-guide archival (step 04).
- Changes to `@unveiled/auth` domain logic (consume only).

## Decisions

### 1. File layout

```
apps/web/app/
├── lib/
│   └── onboarding-content.ts          # DE/EN titles, labels, option labels, CTAs
├── components/onboarding/
│   ├── OnboardingLayout.tsx           # shell + step indicator (steps 1–4)
│   ├── OnboardingStepIndicator.tsx    # progress UI (current / total)
│   ├── AgeStepForm.tsx
│   ├── InterestsStepForm.tsx
│   ├── LocationStepForm.tsx
│   └── TimingStepForm.tsx
└── routes/[locale]/onboarding/
    ├── index.tsx                      # optional — redirect to resolved step
    ├── age.tsx
    ├── interests.tsx
    ├── location.tsx
    └── timing.tsx
```

**Rationale:** Mirrors auth pattern (thin routes + layout component + content lib). Step forms are separate components for readability; routes wire session, guards, POST parsing, and redirects only.

### 2. HonoX GET + POST route pattern

Each step file exports default GET and named POST:

```typescript
// apps/web/app/routes/[locale]/onboarding/age.tsx
import { createRoute } from "honox/factory";

export const POST = createRoute(async (c) => { /* parse, save, redirect */ });

export default createRoute(async (c) => { /* guard, render form */ });
```

POST flow:

1. Resolve session via `getSession` (redirect to `/:locale/login` if missing).
2. Reject non-USER roles with 403 or redirect to `/:locale`.
3. If `session.user.onboardingComplete`, redirect to `/:locale/events`.
4. If resolved step path ≠ current route path, redirect to `/${locale}${getOnboardingStepPath(...)}`.
5. Parse `await c.req.parseBody()` (form fields).
6. Map body to step payload; call `saveOnboardingStep(getAuthOptions().db, userId, step, payload)`.
7. On `OnboardingValidationError`, re-render GET with error message (422-style UX via query param or inline prop — prefer re-render with flash-less inline error on same page).
8. On success, redirect to next step (or `/:locale/membership` after timing + `completeOnboarding`).

**Alternative considered:** Per-step POST routes under `/api/onboarding/*`. Rejected — violates SSR-only mutation rule (dedicated page + form POST on same URL).

### 3. Route guards (defense in depth)

Middleware already enforces onboarding redirects globally. Routes additionally:

| Check | Action |
|---|---|
| No session | 302 → `/:locale/login` |
| Role ≠ USER | 302 → `/:locale` |
| `onboardingComplete === true` | 302 → `/:locale/events` |
| POST to wrong step | 302 → `/${locale}${getOnboardingStepPath(profile, behavior)}` |

Use inline session resolution in route handlers (same as login redirect pattern) rather than Hono middleware chain on individual files — keeps onboarding routes self-contained and testable via manual curl.

**Alternative considered:** `requireAuth()` + `requireRole('USER')` middleware returning JSON 401/403. Rejected for user-facing wizard — browser form POST expects redirects, not JSON errors.

### 4. Step payloads from form fields

| Step | Form fields | Payload to `saveOnboardingStep` |
|---|---|---|
| age | `age_group` (radio) OR `action=skip` (submit button name) | `{ age_group }` or `{ skip: true }` |
| interests | `interests[]`, `moods[]` (checkbox groups) | `{ interests: string[], moods: string[] }` |
| location | `districts[]`, `max_distance` (slider/number) | `{ districts: string[], max_distance: number }` |
| timing | `timing[]`, `preferred_days[]`, `preferred_languages[]`, `accessibility` (checkbox/switch) | `{ timing, preferred_days, preferred_languages, accessibility: boolean }` |

Timing POST sequence:

```typescript
await saveOnboardingStep(db, userId, "timing", payload);
await completeOnboarding(db, userId);
return c.redirect(`/${locale}/membership`, 302);
```

Validation errors from `@unveiled/auth` are caught and the GET form re-rendered with a generic validation message (DE/EN from content lib).

### 5. OnboardingLayout and step indicator

```typescript
type OnboardingLayoutProps = {
  locale: Locale;
  step: 1 | 2 | 3 | 4;
  children: ReactNode;
  error?: string | null;
};
```

- Wrap content in HeroUI `Surface` with layout-only Tailwind (`max-w-*`, `gap`, `flex`).
- Title/subtitle from `getOnboardingCopy(locale).title` / `.subtitle` (inventory keys `onboardingTitle`, `onboardingSubtitle`).
- Step indicator: HeroUI `Progress` or a simple 4-segment visual using themed `Surface`/`Chip` nodes — current step highlighted, prior steps filled, future steps muted. No client island unless Progress requires hydration for drag (use read-only indicator only).
- Primary CTA: `Button` with `className="button button--primary"` and `type="submit"`.
- Age skip: secondary `Button` with `className="button button--secondary"`, `type="submit"`, `name="action"`, `value="skip"`.

Page background yellow comes from app shell / `_renderer` (`brand-yellow` token) — no per-route background override needed.

### 6. i18n content module

`onboarding-content.ts` follows `auth-content.ts` pattern:

- Export `getOnboardingCopy(locale)` for shared title, subtitle, step labels, CTAs (`next`, `skip`, `finish`, `km`).
- Export `getOnboardingOptionLabels(locale)` mapping `@unveiled/auth` allowlist values to DE/EN display strings where they differ (most option values are German proper nouns used in both locales per feature file; English locale may pass through or provide short glosses).
- Import allowlist constants from `@unveiled/auth` for option lists — single source of truth for values submitted in forms.

### 7. SEO

Every `c.render()` passes `robots: "noindex"` in render metadata (same as `login.tsx`). No canonical needed for wizard steps.

Optional: add `/*/onboarding/*` to `robots.txt` in step 04 — not required for this step if per-page meta is present.

### 8. Optional index route

`onboarding/index.tsx`:

```typescript
export default createRoute(async (c) => {
  const session = await getSession(c);
  // guards...
  const stepPath = getOnboardingStepPath(session.user.profile, session.user.behavior);
  return c.redirect(`/${locale}${stepPath}`, 302);
});
```

Useful for links that point to `/de/onboarding` without a step segment.

### 9. Pre-fill from saved profile

GET handlers pass current `session.user.profile` values into form components as `defaultValue` / `defaultSelected` props so users see prior selections when resuming a step.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| HeroUI form controls may need client hydration for interactive groups | Prefer SSR-friendly controlled defaults; allow minimal client behavior only inside form controls if HeroUI requires it — no wizard state island |
| `<form method="post">` is not a listed HeroUI primitive | Wrap in HeroUI `Surface`; use HeroUI `Button type="submit"` — native `<form>` is required for SSR POST and is the standard HonoX mutation pattern |
| `/membership` may be marketing stub without Stripe | Acceptable — spec requires redirect target after completion, not working checkout |
| `/events` redirect for complete USERs may 404 until Phase 5 | Matches step 02 behavior; middleware and routes stay consistent |
| Checkbox array naming (`interests[]`) varies by browser | Use consistent `name` attributes; parse with Hono `parseBody` array handling; test in manual QA |
| Validation re-render without flash messages | Pass `error` prop from POST failure to layout; keep messages generic |

## Migration Plan

1. Implement on branch `onboarding-03-wizard-pages`.
2. Add `onboarding-content.ts` and shared components.
3. Implement routes bottom-up: age → interests → location → timing (+ optional index).
4. Run `bun run typecheck` and `bun run lint`.
5. Manual QA: full wizard on `/de` and `/en`; skip-age path; verify DB profile fields and `onboarding_complete`.
6. Hand off to `onboarding-04-hardening-and-release`.
7. Rollback: delete onboarding routes and components; no DB migration to revert.

## Open Questions

- None blocking step 03. Option label localization for German district nicknames (X-Berg, P-Berg) can stay as feature-file literals in v1.
