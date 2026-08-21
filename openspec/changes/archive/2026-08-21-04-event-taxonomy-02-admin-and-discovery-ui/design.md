## Context

Parent feature: event category/type taxonomy (`.dev-plan/current-iteration/04-event-taxonomy-parent-guide.md`), step 02 of 03 — locale labels on user-visible chrome + one-release `?category=` alias. See proposal.md for motivation.

Step 01 is done (`04-event-taxonomy-01-constants-and-migration`):

- `@unveiled/db` `event-taxonomy.ts`: `EVENT_CATEGORIES` / `EVENT_TYPES`, DE/EN labels, `getEventCategoryLabel` / `getEventTypeLabel` (unknown key → raw string), `LEGACY_EVENT_CATEGORY_MAP` / `mapLegacyEventCategory`.
- Writes reject unknown keys. SQL backfill remapped stored rows.
- `getEventCategoryOptions` / `getEventTypeOptions` already emit `{ id: key, label }` in parent-table order.
- Admin General native selects already post new keys.

Current live UI this step replaces:

- `toEventCardItem` sets `category: event.category` (stored key). `EventCard` Chip renders that string (`theater`, `live_music_venue`).
- `EventDetailPage` identity eyebrow `{event.category}`; DETAILS `MetaCell` type `{event.eventType}` (`theater_play`).
- `parseEventFeedQuery` copies `category` as-is. `listMemberFeedEvents` exact-matches `events.category`. `?category=Theater` matches nothing.
- `AdminEventsTable` has no category/type columns.
- Feed/map `<select>` already uses option helpers (keys + labels). Native `<select>` only.

Constraints: HeroUI-only markup + native-first selects (hard rules §8, §14); Tailwind layout only; no client-only filter store; Gherkin/Playwright/Abundo/schema-overview wait for step 03.

## Goals / Non-Goals

**Goals:**

- Every user-visible category/type string is the locale label (EventCard chip, detail eyebrow, DETAILS type, admin/feed option text).
- Legacy INTERESTS `?category=` values rewrite to mapped keys before the discovery query.
- Option order remains parent-table order. Stories that paint category/type show labels, not snake_case.
- Unit coverage for the alias in `event-feed.test.ts`. EventCard still accepts a `category` string.

**Non-Goals:**

- Gherkin, Playwright, Abundo `CATEGORY_EVENT_TYPE`, schema-overview, gaps-and-decisions, i18n inventory (step 03).
- Adding `Other` to the taxonomy; multi-select category/type; changing `INTERESTS`.
- Labeling admin Events table (no such columns).
- HTTP redirect from `?category=Theater` to `?category=theater` (parse rewrite is enough; rebuilt query strings emit the new key).
- Changing `listMemberFeedEvents` match semantics (still exact key).
- Teaching `EventCard` locale or taxonomy helpers (keep the chip dumb).

## Decisions

1. **Resolve labels at the mapper / page boundary; EventCard stays a display string**
   - **Choice:** `toEventCardItem(event, locale)` sets `category: getEventCategoryLabel(locale, event.category)`. `EventCardItem.category` remains `string` — it is now the painted label, not the storage key. `EventCard` continues to render `{event.category}` with no locale prop.

     `EventDetailPage` already has `locale` and the catalog `Event`: set eyebrow to `getEventCategoryLabel(locale, event.category)` and DETAILS type to `getEventTypeLabel(locale, event.eventType)`. Do **not** mutate `event`. Unknown/legacy leftover keys fall back to the raw string (helpers already do this) so a missed migration does not crash the page.
   - **Rationale:** Same pattern as step-02 copy i18n (`title` is resolved before the card). Cards, Discover, saved, and feed all go through `toEventCardItem`. Detail is the only other public surface that prints category/type.
   - **Alternatives:** Pass key + locale into `EventCard` (API churn; `@unveiled/ui` would depend on taxonomy). Resolve in SQL (wrong; labels are code). Leave type MetaCell as a key (fails “every user-visible type string”).

2. **Alias only in `parseEventFeedQuery`; reuse `mapLegacyEventCategory`**
   - **Choice:** After reading `category` from the query string, if `mapLegacyEventCategory(value)` returns a key, use that key; otherwise keep the trimmed value (allowlisted keys pass through; unknown strings stay exact). Import the mapper from `@unveiled/db` — do not duplicate the INTERESTS table in web.

     Required INTERESTS aliases (parent lock):

     | Query | Stored key |
     |---|---|
     | `Theater` | `theater` |
     | `Kino` | `cinema` |
     | `Museum` | `museum` |
     | `Ausstellung` | `exhibition_hall` |
     | `Konzert` | `live_music_venue` |
     | `Talk/Lesung` | `literature_house` |
     | `Comedy` | `comedy_club` |
     | `Tanz/Performance` | `dance_venue` |
     | `Other` | `cultural_center` |

     The existing map also aliases fixture spellings `Music` / `music` / `Art` / `Film` / `Talk`. Keep those — they are locked in step 01 and do not change INTERESTS. Matching is **case-sensitive** (same as the map). `THEATER` stays `THEATER` and matches nothing.
   - **Rationale:** Step plan names `parseEventFeedQuery`. Feed and map already share it. Discovery SQL stays “exact key” so the alias is one function, one-release, easy to delete later.
   - **Alternatives:** Alias inside `listMemberFeedEvents` (hides URL contract; two list helpers). Dual-match old+new in SQL (wider than a one-release URL alias). Case-fold (would collide with future keys and disagrees with the locked map).

3. **Rebuilt query strings emit the rewritten key; no 302**
   - **Choice:** `buildEventFeedQueryString` remains a passthrough. After parse, `query.category` is already `theater`, so pagination, list↔map tabs, and a later Apply all emit `?category=theater`. Do **not** add a redirect when the incoming URL still has `Theater`. The native `<select defaultValue={query.category}>` matches option `id`s (`theater`) even while the address bar still shows the legacy value.
   - **Rationale:** Step plan is parse + filter, not URL canonicalization. Avoid an extra round-trip on every bookmarked INTERESTS URL.
   - **Alternatives:** 302 to the new key (cleaner URLs; extra hop; not required). Rewrite in `buildEventFeedQueryString` as well (double-maps if callers already pass new keys; `Theater` is not a stored key so a second map would still work, but parse is the single gate).

4. **Unknown `?category=` stays exact; empty omitted**
   - **Choice:** Whitespace-only still omitted. `?category=theater` unchanged. `?category=NotARealCategory` stays `NotARealCategory` and the list query matches nothing. Do not 400 the feed.
   - **Rationale:** Step plan: “Unknown values still filter exact (and match nothing).” Same as today’s non-matching category behavior.
   - **Alternatives:** Drop unknown params (hides typos; changes empty vs no-results). Validate against `EVENT_CATEGORIES` and ignore (would drop `Theater` if the alias were missed).

5. **Option helpers: verify order only; do not re-sort**
   - **Choice:** `getEventCategoryOptions` / `getEventTypeOptions` already `EVENT_CATEGORIES.map` / `EVENT_TYPES.map`. Confirm they are not `localeCompare`-sorted (unlike preferred-language options). Admin `AdminFormSelect` and feed/map native `<select>` keep `value={option.id}` and `{option.label}` as children. Native-first; no HeroUI `Select`.
   - **Rationale:** Step 01 already switched helpers so POST stays valid. This step’s job is display + alias, not a second option source.
   - **Alternatives:** Sort labels alphabetically per locale (forbidden — parent table order). Rebuild options from `INTERESTS` (would post illegal keys).

6. **Admin list and Featured chrome stay unlabeled; selects already labeled**
   - **Choice:** Skip `AdminEventsTable` / Featured add-results (no category/type columns). Admin create/edit/clone already use the option helpers. If a debug dump or JSON-LD ever printed `event.category`, leave it (not user-visible chrome). Do **not** translate category in SEO/JSON-LD unless a current field already exposes it (it does not).
   - **Rationale:** Step plan: “Admin table if it shows category/type: labels too.” It does not.
   - **Alternatives:** Add category columns to the admin table (out of scope).

7. **Stories: stored keys on `Event`; labels on `EventCardItem.category`**
   - **Choice:** Catalog `Event` fixtures keep `category: "live_music_venue"` / `eventType: "live_set"` (write-valid keys). `EventCardItem` / `mockEventCardItem.category` becomes the **EN** (or story-locale) label, e.g. `"Live music venue"`, so Ladle shows what production paints. Feed/map stories already use `{ id: "theater", label: "Theater" }` — keep keys as `id`, labels as visible text; prefer parent EN/DE strings when touching those arrays. `AdminFormSelect` primitive story may keep dummy `music`/`Music` options (it is not the taxonomy control).
   - **Rationale:** Step plan: stories/fixtures use new keys; story UI should show labels. EventCard has no locale, so the fixture string is the label.
   - **Alternatives:** Leave `category: "live_music_venue"` on the card fixture (chip still shows a key in Ladle). Give EventCard a locale (decision 1).

8. **Tests this step: `event-feed.test.ts` only (plus typecheck of EventCard)**
   - **Choice:** Update existing parse/build/redirect cases that assumed `category` stays `Theater` after parse:

     - parse `?category=Theater` → `category: "theater"`
     - parse every INTERESTS id → mapped key (table in decision 2)
     - parse `?category=theater` unchanged
     - parse `?category=NotARealCategory` unchanged
     - `eventFeedPageRedirectPath` after `?category=Theater&page=99` emits `category=theater`

     `buildEventFeedQueryString({ category: "Theater" })` (no parse) may still emit `Theater` — it is a serializer, not the alias gate. Do not add Playwright. Do not require `packages/ui` unit tests if none exist; `bun run typecheck` plus Ladle types cover `EventCardItem.category: string`.
   - **Rationale:** Step verification names that file and EventCard still building.
   - **Alternatives:** Snapshot EventDetailPage (Ladle is enough). Discovery integration for `Theater` (SQL should never see `Theater` after parse; the web test is the right layer).

## Risks / Trade-offs

- **[Risk] Missed raw `event.category` / `event.eventType` on a guest/member surface** → Mitigation: grep `apps/web/app/components` and `packages/ui` (not admin tables, not JSON dumps) for those fields; leftover hits listed in the PR.
- **[Risk] `EventCardItem.category` meaning shifts from key to label** → Mitigation: only display uses it; no card click handler filters by that string. Call sites that compared `item.category === "Theater"` would break — grep `EventCardItem` / `.category` in UI. Production mapper always labels.
- **[Risk] Alias map drifts from INTERESTS** → Mitigation: reuse `mapLegacyEventCategory`; unit-test the nine INTERESTS ids explicitly. Do not edit `INTERESTS`.
- **[Trade-off] Address bar may still show `Theater` until the next GET rebuild** → Accepted; select and query use the mapped key.
- **[Trade-off] Fixture spellings (`Music`, `Art`) also alias** → Harmless superset; one-release.
- **[Trade-off] Type is labeled only on public DETAILS, not on cards** → Cards never showed type; no new chip.

## Migration Plan

1. Confirm step 01 exports (`getEventCategoryLabel`, `getEventTypeLabel`, `mapLegacyEventCategory`, option helpers).
2. Alias in `parseEventFeedQuery`; extend `event-feed.test.ts`.
3. Label `toEventCardItem` + `EventDetailPage` eyebrow and type MetaCell.
4. Spot-check option order vs parent tables (no code change if already mapped in constant order).
5. Update EventCard / feed stories so painted category is a label; keep stored keys on `Event` fixtures.
6. Grep leftover user-visible keys; `bun run lint`; `bun run typecheck`; `cd apps/web && bun test app/lib/event-feed.test.ts`.
7. Mark step 02 done in the parent guide. Do not start step 03 Gherkin/Abundo.
8. **Rollback:** revert the PR. Stored keys stay (step 01); cards would show keys again; `?category=Theater` would stop matching.

## Open Questions

- None blocking. Whether `toEventCardItem` labels vs `EventCard` labeling is an implementation detail; production cards MUST NOT show snake_case keys.
