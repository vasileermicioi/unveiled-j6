## Why

Step 01 already stores allowlisted snake_case keys (`theater`, `cinema`, …) and admin/feed `<select>`s already emit those keys with locale labels. User-visible chrome still prints the stored key (`theater` on EventCard and the public-detail eyebrow; `theater_play` on DETAILS type) and `parseEventFeedQuery` still passes `?category=Theater` through unchanged, so one-release INTERESTS bookmarks match nothing. This is step 02 of parent `04-event-taxonomy`.

## What Changes

- Resolve category (and type where shown) to the active-locale label before display. EventCard chip, public-detail category eyebrow, and DETAILS type cell SHALL NOT show raw keys.
- **One-release alias:** `parseEventFeedQuery` SHALL rewrite legacy INTERESTS `?category=` values (`Theater`, `Kino`, `Museum`, `Ausstellung`, `Konzert`, `Talk/Lesung`, `Comedy`, `Tanz/Performance`, `Other`) to the parent-guide mapped keys so old feed/map URLs keep filtering. Unknown values stay exact (and match nothing).
- Confirm filter/admin `<option value>` is the key and visible text is the locale label; option order stays parent-table order (`EVENT_CATEGORIES` / `EVENT_TYPES`, not alpha, not INTERESTS).
- Stories/fixtures that show category/type UI use new keys and **visible labels** (EventCard `category` is the display string).
- Out of scope: Gherkin / Playwright / Abundo / schema-overview (step 03); adding `Other`; multi-select category; changing `INTERESTS`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-discovery`: Member feed and map category filter SHALL use `EVENT_CATEGORIES` keys as option values and locale labels as visible text, in taxonomy table order. Filtering SHALL match `events.category` to the key. Legacy INTERESTS query values SHALL be rewritten to mapped keys so old URLs keep working.
- `event-catalog`: Public and member surfaces SHALL NOT show raw taxonomy keys. EventCard category chip and public detail category eyebrow SHALL show `getEventCategoryLabel(locale, key)`. Public detail DETAILS type SHALL show `getEventTypeLabel(locale, key)`. Admin category/type selects SHALL show the same labels.

## Impact

- **Display:** `toEventCardItem(event, locale)` sets `category` to the locale label; `EventDetailPage` eyebrow + DETAILS type use label helpers; `EventCard` stays dumb (renders the string it is given). Admin Events table has no category/type columns — no list change.
- **Feed alias:** `parseEventFeedQuery` (shared by `/events` and `/events/map`) via `mapLegacyEventCategory`. `listMemberFeedEvents` stays exact-match on the parsed key. Pagination/`buildEventFeedQueryString` emit the rewritten key.
- **Selects:** `getEventCategoryOptions` / `getEventTypeOptions` already emit new keys + labels in table order (step 01) — verify, do not re-sort.
- **Stories:** `packages/ui` EventCard fixtures, `apps/web` EventCard/feed/map/detail fixtures — keys in stored fields, labels where the UI paints category/type.
- **Tests:** `apps/web/app/lib/event-feed.test.ts` — `Theater` → `theater`; other INTERESTS aliases; unknown stays exact.
- **Source brief:** `.dev-plan/current-iteration/04-event-taxonomy-02-admin-and-discovery-ui.md`
- **Parent:** `.dev-plan/current-iteration/04-event-taxonomy-parent-guide.md`
- **Depends on:** `04-event-taxonomy-01-constants-and-migration` (done — keys, labels, validation, migration, option helpers)
- **Consumed by:** `04-event-taxonomy-03-hardening`
- **Verification:** `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/event-feed.test.ts`; EventCard still builds with a `category` string (key or label)
