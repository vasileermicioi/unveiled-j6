## Why

Step 01 bootstrapped empty Ladle configs and `ThemeDecorator`, but designers and agents still cannot review Phases 0–4 UI in isolation — every component must be navigated through the full SSR app with live sessions and database state. This step backfills one story per visual state for every shipped component so marketing, shell, auth, onboarding, admin, and catalog UI can be reviewed without runtime dependencies.

## What Changes

- Add `packages/ui/src/EventCard.stories.tsx` with four CTA states (guest / waitlist / unlock / book) plus saved bookmark variants, using static `EventCardItem` fixtures.
- Add ~30–40 `*.stories.tsx` files under `apps/web/app/components/` covering Phase 0 shell, Phase 1 marketing, Phase 2 auth chrome, Phase 3 onboarding, and Phase 4 catalog/admin components per `ui/ui-component-map.md`.
- Add optional shared fixtures at `apps/web/app/components/stories/fixtures.ts` for mock event, partner, session, and admin table rows.
- Apply conventions: `ThemeDecorator` on every story, `ComponentName / StateName` titles, static props only (no DB/auth), HeroUI-only markup, layout Tailwind only.

**Out of scope:** `EventMap` island stories (Phase 5), booking/profile/checkout/partner-portal components, Playwright specs (steps 03–04), CI workflow (step 05).

## Capabilities

### New Capabilities

_(none — story coverage extends existing platform foundation)_

### Modified Capabilities

- `platform-foundation`: Add requirement that every Phase 0–4 UI component has at least one Ladle story per visual state documented in `ui/ui-component-map.md`, including isolated EventCard CTA states with guest-first precedence.

## Impact

- **Packages:** `packages/ui` — `EventCard.stories.tsx`.
- **App:** `apps/web/app/components/**/*.stories.tsx` — shell, marketing, auth, onboarding, admin, catalog page components; optional `stories/fixtures.ts`.
- **No new dependencies** — uses Ladle harness from step 01.
- **Verification:** `bun run stories`, `bun run lint`, `bun run typecheck`, `bun run build` must pass.
- **Downstream:** Consumed by `testing-04-05-ci-and-release` (stories gate); parallel with steps 03–04.
