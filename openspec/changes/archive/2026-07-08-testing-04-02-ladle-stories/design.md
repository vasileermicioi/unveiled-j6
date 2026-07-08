## Context

Step 01 (`testing-04-01-test-harness`) delivered Ladle configs in `packages/ui` (port 61000) and `apps/web` (port 61001), global `ThemeDecorator` wrapping stories with production `globals.css` and `#FAFF86` background, and root `bun run stories`. Story globs are configured but no `*.stories.tsx` files exist yet.

Phases 0–4 shipped 51 page-level components under `apps/web/app/components/` plus `EventCard` in `@unveiled/ui`. The inventory and CTA precedence rules live in `docs/migration/ui/ui-component-map.md`. Components accept typed props (`AppSession`, `Event`, `EventCardItem`, etc.) that routes currently source from DB/session — stories must supply static fixtures instead.

**Prerequisite:** `testing-04-01-test-harness` merged.

## Goals / Non-Goals

**Goals:**

- One `export const <StateName>` story per distinct visual state in `ui-component-map.md`.
- `EventCard.stories.tsx` covers all four CTA states plus saved bookmark on/off for member stories.
- ~30–40 story files under `apps/web/app/components/**/*.stories.tsx` covering shell, marketing, auth, onboarding, admin/catalog.
- Every story wrapped by `ThemeDecorator` (via Ladle global provider from step 01).
- `bun run stories`, `bun run lint`, `bun run typecheck`, `bun run build` all pass.

**Non-Goals:**

- `EventMap` island stories (Phase 5).
- Booking, profile, checkout, partner-portal components.
- Interactive client islands beyond static render (e.g. `AppNavbarMenu`, `CookieConsentBanner` — shell stories may omit or stub).
- Playwright specs (steps 03–04), CI workflow (step 05).
- Visual regression baselines.

## Decisions

### 1. Story file placement mirrors component tree

```
packages/ui/src/EventCard.stories.tsx

apps/web/app/components/
  AppShell.stories.tsx
  AppNavbar.stories.tsx
  Logo.stories.tsx
  ...
  marketing/LandingPage.stories.tsx
  onboarding/OnboardingLayout.stories.tsx
  admin/AdminPagination.stories.tsx
  catalog/EventDetailPage.stories.tsx
  stories/fixtures.ts          # optional shared mocks
```

- Matches Ladle globs from step 01: `packages/ui/src/**/*.stories.tsx` and `apps/web/app/components/**/*.stories.tsx`.
- **Alternative:** Single `stories/` directory at repo root. Rejected — breaks package boundaries and Ladle config from step 01.

### 2. Story export pattern and titles

```typescript
// EventCard.stories.tsx
import type { Story } from "@ladle/react";
import { EventCard } from "./EventCard";
import { sampleEvent } from "./stories/event-fixtures";

export const GuestSeeDetails: Story = () => (
  <EventCard event={sampleEvent} locale="en" viewer={{ kind: "guest" }} />
);
GuestSeeDetails.storyName = "EventCard / Guest — See details";
```

- Use named exports per state; set `storyName` to `ComponentName / StateName` convention.
- Use Ladle `args` for locale (`de`/`en`) where copy differs — prefer separate exports when visual layout also changes (e.g. admin pagination labels).
- **Alternative:** Default export with `meta` object (Storybook style). Rejected — Ladle uses named exports.

### 3. Static fixtures — no live DB or auth

Create `apps/web/app/components/stories/fixtures.ts` (and `packages/ui/src/stories/event-fixtures.ts` for EventCard) with:

| Fixture | Purpose |
|---|---|
| `mockGuestSession`, `mockUserSession`, `mockAdminSession` | `AppSession` shapes for navbar/shell variants |
| `mockEventCardItem` | `EventCardItem` with `remainingCapacity: 0` variant for guest precedence test |
| `mockEvent` | Drizzle `Event` row shape for `EventDetailPage` |
| `mockPartnerRows`, `mockEventRows` | Admin table sample data |
| `mockImageId` | Placeholder image ID; `IMAGE_PUBLIC_BASE_URL` from env or hardcoded `https://images.example.test/` |

- Image URLs: use `buildCardImageSrc` / existing `@unveiled/ui` helpers with a static `imageId` — no R2 upload in stories.
- **Alternative:** MSW or live seed DB. Rejected — stories must be zero-dependency for designers.

### 4. EventCard CTA state matrix

| Story | `viewer` | `remainingCapacity` | Expected CTA (en) |
|---|---|---|---|
| Guest — See details | `{ kind: "guest" }` | `0` (sold out) | "See details" |
| Member — Waitlist | `{ kind: "member", subscriptionActive: true }` | `0` | "Waitlist" |
| Member — Unlock | `{ kind: "member", subscriptionActive: false }` | `5` | "Unlock event" |
| Member — Book Now | `{ kind: "member", subscriptionActive: true }` | `5` | "Book Now" |
| Member — Saved on/off | active member + `saved: true/false` | `5` | bookmark aria-label differs |

Guest-first precedence per `ui-component-map.md` — guest story MUST use `remainingCapacity: 0` to prove precedence.

### 5. Component inventory by phase

**Phase 0 shell (7 files):** `AppShell`, `AppNavbar` (guest / USER / ADMIN), `GuestFooter`, `Logo` (black/white/yellow), `NotFoundPage`, `NavLink`.

**Phase 1 marketing (9 files):** `LandingPage`, `HowItWorksPage`, `FaqPage`, `HelpSection`, `DiscoverPage`, `LegalPage` (args: impressum/privacy/terms), `PageHero`, `SectionCard`, `MembershipInfoPage`.

**Phase 2 auth (2 files):** `AuthPageLayout`, `AuthFormFallback` (loading + error if applicable).

**Phase 3 onboarding (8 files):** `OnboardingLayout`, `OnboardingStepIndicator` (steps 1–4), `OnboardingStepPage`, `OnboardingFormActions`, `AgeStepForm`, `InterestsStepForm`, `LocationStepForm`, `TimingStepForm`.

**Phase 4 admin/catalog (12+ files):** `EventDetailPage` (guest), `AdminLayout`, `AdminPageShell`, `AdminTabNav`, `AdminKpiGrid`, `AdminDashboardPage`, `AdminEventsListPage`, `AdminEventsTable`, `AdminPartnersListPage`, `AdminPartnersTable`, `AdminPagination` (first/middle/last), `AdminSearchForm`, `AdminFormSelect`, `EventAdminBaseFields` (collapsed preview).

Components intentionally skipped: `EventMap`, `AppAuthProvider`, `PartnerForm`, `EventAdminForm`, `EventImageUpload`, `PartnerLogoUpload`, `EventGeoPicker` (interactive/upload islands), `AdminTable`/`AdminTableActions` (covered by table page stories).

### 6. ThemeDecorator and islands

- `packages/ui`: global provider in `.ladle/components.tsx` already wraps `ThemeDecorator`.
- `apps/web`: verify `.ladle/components.tsx` (or equivalent) imports same `ThemeDecorator` from `@unveiled/ui` or duplicates with `globals.css`.
- Components that import islands (`AppShell` → `CookieConsentBanner`, `AppNavbar` → `AppNavbarMenu`): stories render the server component tree; islands may hydrate with empty/minimal client state. If an island blocks render, stub via story-only wrapper or accept static SSR output.

### 7. Locale handling

- Default fixture locale: `de` (primary market).
- Add `en` variant stories only where copy materially differs and is listed in scope (EventCard CTAs, LegalPage types).
- Use `getCopy(locale)` paths already in components — pass `locale` prop from story args.

## Risks / Trade-offs

- **[Island hydration in stories]** `AppShell`/`AppNavbar` pull client islands → May show loading flash or require `"use client"` story wrappers → Accept static SSR shell; document if menu drawer is non-interactive in stories.
- **[Drizzle `Event` type coupling]** `EventDetailPage` expects full `Event` row → Fixture must mirror schema fields; update fixture when schema changes.
- **[Image 404s]** Placeholder `imageId` without R2 → Use env `IMAGE_PUBLIC_BASE_URL` or inline data URI fallback in fixture helpers; broken images acceptable if layout still reviewable.
- **[Story count drift]** New components added without stories → Step 05 CI gate will catch; parent guide lists deferred components.
- **[Cross-package fixture duplication]** EventCard fixtures in `packages/ui`, Event detail in `apps/web` → Extract shared shape only if duplication exceeds ~3 files (per iteration plan).

## Migration Plan

1. Inventory components against `ui-component-map.md` and existing `apps/web/app/components/`.
2. Add fixtures, then EventCard stories (validates harness + CTA precedence).
3. Add stories by phase area; run `lint`/`typecheck` after each area.
4. `bun run stories` — spot-check EventCard guest/sold-out and admin pagination.
5. No production deploy changes; stories excluded from `bun run build` bundle.
6. Rollback: delete `*.stories.tsx` and fixtures — no runtime impact.

## Open Questions

- Whether `apps/web` needs its own `.ladle/components.tsx` global provider or already inherits ThemeDecorator — verify during setup task.
- Exact props for onboarding step forms (some may need `action` URL strings) — read component signatures during implementation.
- Whether `LegalPage` uses a `page` prop enum or separate routes — one story with args per legal page type.
