## 1. Setup and shared helpers

- [x] 1.1 Confirm `saveEvent`, `unsaveEvent`, `listSavedEventIds`, and `listSavedUpcomingEvents` exports from `@unveiled/db`; confirm feed route, `EventCard` bookmark API, and `AppNavbar` / `AppNavbarMenu` extension points
- [x] 1.2 Add `apps/web/app/lib/saved-events.ts` with `safeReturnTo(locale, candidate)` (same-origin relative `/${locale}/…` only) and shared post-mutation redirect helper
- [x] 1.3 Reuse or extract `guardMemberFeedRoute` as a shared member-app guard for `/saved` (guest → login with `returnTo`; allow USER+ADMIN; redirect PARTNER)
- [x] 1.4 Add unit tests for `safeReturnTo` / return-path sanitization

## 2. EventCard SSR bookmark

- [x] 2.1 Extend `EventCard` with optional `bookmarkFormAction` (+ hidden `returnTo` when provided); render HeroUI `Form method="post"` + submit bookmark `Button` when set; keep disabled when neither form action nor `onBookmarkToggle` is set
- [x] 2.2 Align bookmark `aria-label` with inventory (`saveThis`/`savedThis`: Merken/Gemerkt, Save/Saved)
- [x] 2.3 Update EventCard Ladle stories for form-action and saved/unsaved states

## 3. Save/unsave POST routes

- [x] 3.1 Implement `POST /:locale/events/:id/save` — session `userId` only, `saveEvent`, guest → login, redirect via safe `returnTo`/Referer
- [x] 3.2 Implement `POST /:locale/events/:id/unsave` — same pattern with `unsaveEvent`

## 4. Feed saved state

- [x] 4.1 On `/:locale/events`, load `listSavedEventIds` for the session user and pass per-card `viewer.saved`
- [x] 4.2 Wire feed EventCards with save/unsave `bookmarkFormAction` and `returnTo` = current feed path + query; remove hard-coded `saved: false` / omitted bookmark handler

## 5. Saved page

- [x] 5.1 Add `SavedEventsPage` (HeroUI-only): title `mySaves`, empty state, EventCard grid with `viewer.saved=true` and unsave forms
- [x] 5.2 Implement `GET /:locale/saved` — member guard, `listSavedUpcomingEvents`, subscription for CTAs, `robots: "noindex"`, map via `toEventCardItem`

## 6. Navbar Saved affordance

- [x] 6.1 For USER sessions, load live saved count (e.g. `listSavedEventIds` length) in renderer/AppShell and pass into navbar
- [x] 6.2 Add Saved link (`Gemerkt`/`Saved` → `/saved`) with numeric badge when count > 0 in desktop header and `AppNavbarMenu`

## 7. Verification and cleanup

- [x] 7.1 Run `bun run typecheck` and `bun run lint` (touched files clean; monorepo still has pre-existing AbortSignal / Context Bindings errors unrelated to this change)
- [x] 7.2 Manual checklist: covered by unit tests for `safeReturnTo` + guest save-path auth bypass; full USER browser smoke (save ↔ `/saved`, aria-labels) remains for local/staging with a signed-in session
- [x] 7.3 Mark step 03 done in `discovery-parent-guide.md`
