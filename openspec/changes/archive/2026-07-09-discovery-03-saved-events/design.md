## Context

Discovery-01 shipped `@unveiled/db` helpers: `saveEvent` / `unsaveEvent` (idempotent), `listSavedEventIds`, `listSavedUpcomingEvents`. Discovery-02 shipped authenticated `/:locale/events` with EventCards that hard-code `viewer.saved: false` and omit `onBookmarkToggle` (bookmark disabled). App shell (`AppNavbar` / `AppNavbarMenu`) has no USER Saved link yet. `/saved` is already listed in onboarding/auth middleware prefixes and robots `noindex` paths, but has no route.

`EventCard` today exposes a client `onPress` bookmark callback. Hard rule: SSR-only mutations via form POST — no client-only mutation modal. Inventory copy: `mySaves` (Gemerkt/Saved), `saveThis` (Merken/Save), `savedThis` (Gemerkt/Saved). App-shell: USER Saved icon+label with badge when count > 0.

This is discovery step 03 of 4: **save/unsave POST + `/saved` + feed saved state + navbar Saved**. Map/E2E come later.

Source: `.dev-plan/current-iteration/discovery-03-saved-events.md`, `event-discovery.feature` (save scenarios), `ui/app-shell.md`, `content-i18n-inventory.md`, `authorization-matrix.md`.

## Goals / Non-Goals

**Goals:**

- SSR POST save/unsave for authenticated members; guest POST → login with return URL.
- Authenticated `/:locale/saved` listing upcoming saved events (not today-restricted), empty state, working unsave.
- Feed EventCards reflect `viewer.saved` from `listSavedEventIds` and submit real save/unsave forms.
- USER navbar Saved link (`Gemerkt`/`Saved`) with badge when count > 0.
- Locale-correct bookmark `aria-label` (`saveThis` / `savedThis`).
- Derive `userId` from session only; HeroUI-only UI.

**Non-Goals:**

- MapLibre `/events/map`, booking/waitlist POSTs, behavior-analytics JSONB counters.
- Ladle/Playwright for discovery (keep markup accessible for later proximity selectors).
- New DB migrations (schema already from step 01).
- Bookings navbar item (Phase 6) — only Saved in this step unless already trivial; do not build `/bookings`.

## Decisions

### 1. Separate save and unsave POST routes (not a single toggle)

| Method | Path | Action |
|---|---|---|
| `POST` | `/:locale/events/:id/save` | `saveEvent(db, session.user.id, id)` |
| `POST` | `/:locale/events/:id/unsave` | `unsaveEvent(db, session.user.id, id)` |

**Rationale:** Explicit intent in the URL matches dedicated SSR mutation pages; no hidden field required; idempotent helpers already exist. Card UI posts to save when unsaved and unsave when saved.

**Alternative considered:** Single `POST …/save-toggle` with `intent` field — fewer routes but easier to mis-wire; rejected for clarity.

Handlers:

1. Resolve locale + event id from path.
2. `getSession(c)` — if null → `302` to login with `returnTo` = requested path or form `returnTo` (same-origin only).
3. Allow `USER` and `ADMIN` (same as feed); reject/redirect `PARTNER`.
4. Call `saveEvent` / `unsaveEvent` with **session** `userId` only.
5. Redirect to safe return target: prefer form field `returnTo` if same-origin relative path under `/:locale/…`; else `Referer` if same-origin; else `/${locale}/events` or `/${locale}/saved`.

Reuse `buildLoginRedirectUrl` / post-auth return patterns from feed/admin guards. Put shared redirect sanitization in e.g. `apps/web/app/lib/saved-events.ts` (`safeReturnTo(locale, candidate)`).

### 2. Bookmark UI: SSR form wrapper, not client `onPress`

`EventCard`'s `onBookmarkToggle` is a client press handler and cannot satisfy SSR-only mutations by itself.

**Decision:** Prefer a small apps/web (or `@unveiled/ui`) composition that wraps the bookmark control in HeroUI `Form method="post"` + submit `Button`, **or** extend `EventCard` to accept optional SSR bookmark props:

```ts
bookmarkAction?: string; // POST URL
// when set: render Form + submit button; ignore onBookmarkToggle
```

Minimal change path that keeps package API clean:

1. Add optional `bookmarkFormAction?: string` (and maybe `bookmarkReturnTo?: string` as hidden input) to `EventCard`.
2. When `bookmarkFormAction` is set and viewer is member: render `<Form method="post" action={…}>` with hidden `returnTo` and a submit `Button` (type submit) using existing star icon + `aria-label`.
3. When neither form action nor `onBookmarkToggle` is set: keep disabled (guest / pre-step-03 behavior).
4. Align `saveAriaLabel` strings with inventory: DE Merken/Gemerkt, EN Save/Saved (replace current "Save event" / "Saved event" / "Event speichern" / "Gespeichertes Event").

**Alternative considered:** Keep `onBookmarkToggle` and POST via `fetch` island — **rejected** (violates SSR-only mutations).

Feed and saved pages pass per-card action:

- unsaved → `/${locale}/events/${id}/save`
- saved → `/${locale}/events/${id}/unsave`
- `returnTo` → current page path + search (feed) or `/${locale}/saved`

### 3. `/saved` page

| Piece | Location |
|---|---|
| GET | `apps/web/app/routes/[locale]/saved/index.tsx` |
| Page | `apps/web/app/components/discovery/SavedEventsPage.tsx` |

- Guard: reuse/adapt `guardMemberFeedRoute` (or shared `guardMemberAppRoute`) — guest → login with `returnTo=/…/saved`; PARTNER redirected; USER+ADMIN allowed.
- Data: `listSavedUpcomingEvents(db, userId)` — no today default, no pagination in v1 (lists stay small per discovery-01).
- Map rows via existing `toEventCardItem`; subscription status for CTA precedence (same as feed).
- Empty state when zero items (copy from inventory / feed empty patterns; title uses `mySaves`).
- `robots: "noindex"` (already in robots-config path list).
- Every card: `viewer.saved: true` + unsave form action.

### 4. Feed wiring

In `events/index.tsx` (and `EventFeedPage`):

1. After auth, `listSavedEventIds(db, userId)` → `Set` for O(1) lookup.
2. Per event: `viewer.saved = savedIds.has(event.id)`; pass matching `bookmarkFormAction` + `returnTo` (current feed URL with query).
3. Remove hard-coded `saved: false` and enable bookmark forms.

### 5. Navbar Saved link + badge

- For `session.user.role === "USER"` (and optionally ADMIN browsing as member UX — **Decision:** show Saved for USER only per `app-shell.md`; ADMIN keeps admin dashboard link, no Saved badge required).
- Link to `/${locale}/saved`, label `mySaves` (Gemerkt/Saved).
- Badge: numeric Chip when `savedCount > 0`.
- **Count source:** live length of `listSavedEventIds` (or a thin `countSavedEvents` helper if adding one line in `@unveiled/db` is cleaner). Prefer not denormalizing.
- **Where to load count:** `_renderer.tsx` / AppShell currently only gets `session`. Options:
  - **A.** Load saved count in renderer for USER sessions (extra DB read every page) — simplest, correct badge everywhere.
  - **B.** Pass optional `savedCount` only from member routes — badge missing on marketing pages.
  - **Decision:** **A** for USER sessions when DB is available; if load fails, omit badge (count 0) rather than break chrome. Document the extra read as acceptable for Phase 5.

Include Saved in desktop header and mobile `AppNavbarMenu` so small screens can reach `/saved`.

Bookings nav item stays out of scope (no `/bookings` yet).

### 6. Public surfaces / guests

- Guests on `/discover` and public `/events/:id`: do not show filled saved state; if a bookmark control is shown, POST still hits save route → login redirect.
- Prefer leaving guest bookmark disabled (no form action) on public cards unless a control is already visible — matching ui-component-map “guest never sees filled bookmark.”

### 7. Authz

- Users mutate only their own rows: `userId` from session; never accept client `userId`.
- Event id from path is enough; FK integrity handles missing events (save may no-op or 404 — **Decision:** if event missing, still redirect back without error page noise; optional 404 if easy).

## Risks / Trade-offs

- **[Risk] EventCard API change breaks Ladle stories** → Mitigation: update stories to pass `bookmarkFormAction` or keep `onBookmarkToggle` for story-only demos; both paths supported.
- **[Risk] Extra DB read for navbar count on every USER page** → Mitigation: single indexed query by `user_id`; acceptable at Phase 5 traffic; denormalize later if needed.
- **[Risk] Open redirect via `returnTo`/`Referer`** → Mitigation: allow only relative paths starting with `/${locale}/` (or same-origin absolute URL stripped to path); reject `//`, external hosts.
- **[Trade-off] Separate save/unsave routes vs toggle** → Two handlers, clearer forms.
- **[Trade-off] Form submit full page reload** → Required by SSR mutation rule; acceptable UX for bookmark.

## Migration Plan

1. Extend EventCard bookmark form props + aria-label copy; update feed page + save/unsave routes + `/saved` + navbar.
2. No DB migration.
3. `bun run typecheck` / `bun run lint`.
4. Manual USER smoke: save on feed → `/saved` → unsave; guest save → login; aria-labels DE/EN.
5. Mark step 03 done in `discovery-parent-guide.md`.
6. Rollback = revert routes/components; data rows in `saved_events` are harmless.

## Open Questions

- None blocking. If product wants ADMIN Saved nav, add in one place later.
