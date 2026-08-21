## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/04-event-taxonomy-02-admin-and-discovery-ui.md`, parent guide alias + label tables, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 01 is present: `getEventCategoryLabel` / `getEventTypeLabel` / `mapLegacyEventCategory` exported from `@unveiled/db`; `getEventCategoryOptions` / `getEventTypeOptions` emit new keys; `toEventCardItem` still passes `event.category`; `parseEventFeedQuery` still copies `category` as-is; EventCard chip and detail eyebrow still show the stored key

## 2. Feed alias

- [x] 2.1 In `parseEventFeedQuery`, rewrite `category` through `mapLegacyEventCategory` when the value is a locked legacy id; leave allowlisted keys and unknown strings unchanged (trim/empty behavior unchanged)
- [x] 2.2 Update `event-feed.test.ts`: `?category=Theater` parses to `theater`; cover the other INTERESTS ids (`Kino` → `cinema`, …); `theater` unchanged; unknown stays exact; page-clamp redirect after `Theater` emits `category=theater`. Leave `buildEventFeedQueryString({ category: "Theater" })` as a serializer passthrough unless a test goes through parse first

## 3. Locale labels on cards and detail

- [x] 3.1 Change `toEventCardItem(event, locale)` to set `category` from `getEventCategoryLabel(locale, event.category)` (Discover, member feed, saved already pass `locale`)
- [x] 3.2 `EventDetailPage` identity eyebrow uses `getEventCategoryLabel(locale, event.category)`; DETAILS type MetaCell uses `getEventTypeLabel(locale, event.eventType)`; do not mutate `event`
- [x] 3.3 Confirm `getEventCategoryOptions` / `getEventTypeOptions` stay in `EVENT_CATEGORIES` / `EVENT_TYPES` table order (not alpha). Admin Events table has no category/type columns — skip it
- [x] 3.4 Keep `EventCard` dumb: it still renders `event.category` as given. Native `<select>` only for category/type filters and admin fields

## 4. Stories and grep

- [x] 4.1 Update Ladle / fixtures so painted category is a locale label (`packages/ui` EventCard samples, `mockEventCardItem`); keep stored `Event.category` / `eventType` as allowlisted keys
- [x] 4.2 Feed/map filter stories keep option `id` = key and visible `label` = locale string
- [x] 4.3 Grep guest/member UI (`EventCard`, `EventDetailPage`, discovery components) for leftover raw `event.category` / `event.eventType` display (admin table MAY omit columns; JSON-LD/SEO need not gain a category field)

## 5. Verification and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` — exit 0
- [x] 5.2 Run `cd apps/web && bun test app/lib/event-feed.test.ts` — exit 0; EventCard still typechecks with a `category` string
- [x] 5.3 Mark step 02 done in `.dev-plan/current-iteration/04-event-taxonomy-parent-guide.md`. Leave Gherkin / Playwright / Abundo / schema-overview to `04-event-taxonomy-03-hardening`
