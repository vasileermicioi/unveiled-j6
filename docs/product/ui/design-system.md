# Design system — `@unveiled/ui`

**Status:** Binding for MVP product docs and Phase 5.5 DS ownership (step 02).

## Ownership

| Concern | Owner |
|---|---|
| Shared HeroUI-composed primitives (e.g. `EventCard`, `Logo`) | `packages/ui` (`@unveiled/ui`) |
| Ladle stories for design-system primitives | **`packages/ui` only** |
| Theme tokens + Uber yellow reskin | Shared `packages/ui/src/styles/brand-theme.css` (imported by `apps/web/app/styles/globals.css` and UI Ladle `stories.css`; documented in `design-tokens.md`); Theme Overview at `packages/ui/src/stories/ThemeOverview.stories.tsx` |
| Route-specific page compositions (e.g. Discover sections, admin list chrome) | `apps/web/app/components/` — optional page-level Ladle stories allowed in `apps/web` |
| App shell (navbar/footer) | `apps/web` compositions using HeroUI + shared pieces from `@unveiled/ui` when extracted |

**Allowed page-level story groups in `apps/web`:** app shell (`AppShell`, `AppNavbar`, `NavLink`, `GuestFooter`), marketing pages/sections, discovery (feed/filters/map/saved), booking (confirm, ticket card, My Tickets, book gate), onboarding steps/layouts, admin chrome/tables/forms, auth layouts/fallbacks, `NotFoundPage`. These are **not** design-system primitives and MUST NOT be forced into `packages/ui`.

**Ban:** Do not add design-system primitive stories only under `apps/web`. Do not split the same primitive’s stories across packages without updating this doc.

**Ban:** Raw HTML elements (`<section>`, `<p>`, `<a>`, `<button>`, `<h1>`, …) in routes or UI components. Use `@heroui/react` primitives (`Card`, `Link`, `Button`, `Heading`, `Paragraph`, `Surface`, `Chip`, …) or compositions built entirely from them. Exceptions: `<script type="application/ld+json">`; `<img>` inside HeroUI wrappers when no image primitive applies; MapLibre canvas host `<div>` refs (`EventMap`, `EventGeoPicker`).

**Theme-only visual styling:** colors, borders, radius, shadows, typography, and interactive hover states belong in theme tokens / `@layer components` — not ad-hoc per-route Tailwind color/border/shadow utilities. Tailwind on HeroUI nodes is for **layout only** (flex, grid, gap, max-width, positioning).

## Ladle home

- Design-system catalog: stories under `packages/ui` (e.g. `bun run stories` configured to include `@unveiled/ui` globs).
- Theme decorator must apply the production Uber yellow theme via `packages/ui/src/styles/stories.css` → shared `brand-theme.css` (same visual contract as web `globals.css`, which imports that brand theme). Do not permanently cross-import `apps/web` CSS as the design-system home.

## Theme Overview story (required)

`packages/ui` **SHALL** include a **Theme Overview** Ladle story at `packages/ui/src/stories/ThemeOverview.stories.tsx` used to adjust and verify the brand theme. It MUST show at least:

1. Brand yellow page background (`#FAFF86`)
2. Near-zero radius bordered surfaces (no drop shadows)
3. Work Sans typography samples (body + display/heading treatment: uppercase, tight tracking)
4. Primary CTA (`button--primary` / yellow + dark text; hover invert via theme)
5. Secondary CTA (`button--secondary` / white + dark text; hover invert via theme)
6. Representative chips/badges and a sample card surface

Implementers use this story when changing tokens in `globals.css` — not ad-hoc route pages.

## Visual rules (summary)

Full detail: [`design-tokens.md`](./design-tokens.md).

- Page background: brand yellow `#FAFF86` app-wide
- Near-zero border radius on cards; thick dark borders; **no drop shadows**
- Work Sans only (no EK Notice Sans)
- HeroUI **Uber** preset re-skinned — override colors; keep neo-brutalist radius/shadow policy via theme

## Form controls

Prefer **native** HTML controls for choice, numeric, date, and file fields when a native control exists: `select` (single or multi), `input` of type `checkbox|radio|number|date|time|file`, and `textarea`. Do **not** use HeroUI `Select`, `NumberField`, `Checkbox`, `Radio`, or `Switch` for those fields in new work.

Keep HeroUI for text fields (`TextField` / `TextArea`), buttons, labels, and layout chrome. Native controls MAY be wrapped in HeroUI `Label` / `Surface` / `Field`. Theme styling belongs in `globals.css` tokens (Discover `.event-feed-filters__select`, onboarding preference cards, admin `.admin-native-select` / `.admin-native-number`) — not ad-hoc per-route colors.

**Exceptions (keep non-native):** admin image upload / Pica processing UI; `EventGeoPicker` / map islands; `@better-auth-ui/*` auth chrome.

Preference allowlist keys stay locale-invariant; user-visible option labels come from locale copy (`onboarding-content.ts`).

## Related docs

- [`ui-component-map.md`](./ui-component-map.md) — which components exist and where they live
- [`app-shell.md`](./app-shell.md) — navbar/footer
- [`CHARTER.md`](../CHARTER.md) — Locked decision §4
