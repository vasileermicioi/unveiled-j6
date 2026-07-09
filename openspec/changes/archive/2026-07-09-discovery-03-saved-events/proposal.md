## Why

Discovery steps 01–02 shipped `saved_events` helpers and the authenticated `/events` feed, but bookmark controls are still non-functional and there is no `/saved` surface. Members need SSR save/unsave, a saved-upcoming list, and a navbar Saved affordance to complete the save scenarios from `event-discovery.feature` before the map step.

## What Changes

- Add SSR form POST routes for save/unsave (e.g. `POST /:locale/events/:id/save` and `POST /:locale/events/:id/unsave`, or a single toggle with intent), deriving `userId` from session only and redirecting back via same-origin `Referer` or explicit `returnTo`.
- Redirect guests who POST save (and optionally GET `/saved`) to `/:locale/login` with a return URL.
- Add authenticated `/:locale/saved` listing upcoming saved events via `listSavedUpcomingEvents` (not today-restricted), with empty state and EventCards that show `viewer.saved=true` and working unsave.
- On `/events`, load `listSavedEventIds` for the current user and pass `viewer.saved` into EventCards; wire bookmark forms so save/unsave persist.
- Add USER navbar Saved link (`Gemerkt`/`Saved`) with a count badge when saved count > 0 (live `COUNT(*)` / id-list length for v1).
- Ensure bookmark controls always expose locale-correct `aria-label` (`saveThis` / `savedThis`).
- **Out of scope:** MapLibre `/events/map`; behavior-analytics `saved_count` JSONB counters; booking/waitlist; Ladle/Playwright (except keeping markup accessible).

## Capabilities

### New Capabilities

- _(none)_ — save UI and `/saved` extend the existing `event-discovery` capability.

### Modified Capabilities

- `event-discovery`: Add SSR save/unsave POST requirements (auth redirect for guests) and the authenticated saved-events page; supersede the discovery-02 “bookmark not persisted” feed rule so feed EventCards persist saves and reflect saved state.

## Impact

- **App:** `apps/web` — save/unsave POST routes under `app/routes/[locale]/events/`, new `/:locale/saved` route + page components, feed route updates for saved ids / bookmark forms, app shell / header Saved nav + badge.
- **Packages (consume only):** `@unveiled/db` (`saveEvent`, `unsaveEvent`, `listSavedEventIds`, `listSavedUpcomingEvents`), `@unveiled/ui` (`EventCard` bookmark + `viewer.saved`), `@unveiled/auth` (session for `userId`).
- **Downstream:** Consumed by `discovery-05-stories-e2e-release` (and optionally map popups in step 04).
- **Verification:** `bun run typecheck`, `bun run lint`, manual USER save ↔ `/saved` toggle, upcoming-beyond-today list, guest login redirect, aria-labels in both locales.
- **Source:** `.dev-plan/current-iteration/discovery-03-saved-events.md`; behavior from `docs/migration/features/event-discovery.feature`, `ui/app-shell.md`, `content-i18n-inventory.md`, `authorization-matrix.md`.
