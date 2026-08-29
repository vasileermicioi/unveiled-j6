## Context

Parent feature: catalog publish / unpublish (`.dev-plan/current-iteration/catalog-publish-parent-guide.md`), step 01 — schema, domain filters, and publish use cases so step 02 can be admin-UI only. See `proposal.md` for motivation.

Current state:

- `events`, `featured_events`, and `featured_partners` have no visibility flag. `getPublicEventById` is `return getEventById(...)`. `memberFeedConditions` gates only on date/title/category/partner. `listSavedUpcomingEvents` joins saves to upcoming events with no published filter. `saveEvent` inserts without loading the event.
- `listFeaturedEvents` / `listFeaturedPartners` return every curated row. Discover (`apps/web/app/routes/[locale]/discover.tsx`) calls them unfiltered (`listFeaturedEvents(db)` and `listFeaturedPartners(db, { limit: 8 })`).
- `listBookableEventsForSitemap` filters future `date_time` + remaining capacity. `listUpcomingEvents` filters future `date_time` only (admin comp picker).
- `bookEvent` locks the event by id and throws `EVENT_NOT_FOUND` only when the row is missing. `joinWaitlist` does not load the event (FK covers missing ids; unpublished would insert).
- Latest Drizzle migration in tree: `0029_clumsy_umar.sql`.
- Catalog errors already include `EVENT_NOT_FOUND` and `PARTNER_NOT_FOUND`. Featured tables are keyed by `event_id` / `partner_id`.

Constraints: business logic in `@unveiled/db` only. Booking remains the only purchase writer — add a published check inside `bookEvent`, do not fork booking. Schema in `public` only. Do not add `published` to create/edit event form input this step (DB default applies). Do not change partner create. Do not edit canonical `docs/product/` Gherkin (step 03). No event preview.

## Goals / Non-Goals

**Goals:**

- Three independent `published` columns with backfill `true` and new-insert default `false`.
- Public/member/sitemap/booking/waitlist/save readers hide or reject unpublished events; admin lists stay unfiltered.
- Discover cannot leak unpublished featured rows before admin UI exists (`publishedOnly: true` on that route only).
- Seeded demo catalog stays visible (explicit publish after create/add-featured).
- Package tests prove the gates without SSR admin pages.

**Non-Goals:**

- Admin publish/unpublish confirm pages, chips, or `published=` list filter (step 02).
- Canonical Gherkin, Playwright, schema-overview / SEO / i18n sweep (step 03).
- Event preview UI (`event-preview-*`).
- `partners.published` or hiding venues from the admin partner picker.
- Auto-cancelling bookings, dropping featured membership, or flipping the other flags on unpublish.
- Changing Discover’s include-past rule.

## Decisions

1. **Backfill `true`, then default `false`**
   - **Choice:** In one migration per table (or one file for all three):

     ```sql
     ALTER TABLE events ADD COLUMN published boolean DEFAULT true NOT NULL;
     ALTER TABLE events ALTER COLUMN published SET DEFAULT false;
     ```

     Same for `featured_events` and `featured_partners`. Drizzle column: `boolean("published").notNull().default(false)`. Add `index("events_published_date_time_idx").on(table.published, table.dateTime)`. If `bun run db:generate` emits `DEFAULT false` without the true backfill, hand-edit the SQL before migrate.
   - **Rationale:** Parent lock: existing live rows stay published so staging does not blank. New admin creates are drafts until step 02’s publish confirm.
   - **Alternatives:** Default true forever (no draft-on-create). Backfill false (blanks current catalog). Separate backfill migration (unnecessary).

2. **Three independent flags**
   - **Choice:** Unpublishing an event does not update or delete `featured_events`. Unpublishing a featured row does not change `events.published` or the partner. No `partners.published` column.
   - **Rationale:** Parent product table. Discover requires **both** featured + catalog flags for events so a live card cannot 404 on detail.
   - **Alternatives:** Cascade unpublish to featured (hides membership; harder to re-feature). Single flag on events only (cannot hide a featured card while keeping the event on Browse).

3. **`publishedOnly` defaults false; Discover flips this step**
   - **Choice:** `listFeaturedEvents(db, { publishedOnly?: boolean; upcomingOnly?; now? })` and `listFeaturedPartners(db, { publishedOnly?: boolean; limit? })`. Default `false` so admin featured list/reorder/remove keep seeing drafts. When `publishedOnly: true`, require `featured_*.published` and, for events, `events.published`. Change **only** `discover.tsx` to `publishedOnly: true` (keep `limit: 8` for partners; still no upcoming-only filter).
   - **Rationale:** Step plan: admin stays unfiltered; Discover must not leak before step 02. Reorder still calls unfiltered `listFeatured*` so draft membership stays in the permutation.
   - **Alternatives:** Default true (would hide drafts from admin lists). Leave Discover unfiltered until step 02 (unpublished featured leaks on production).

4. **`getPublicEventById` is the only public reader**
   - **Choice:** Implement as load-by-id then `return event?.published ? event : null` (or `and(eq(id), eq(published, true))`). Leave `getEventById` / `listEvents` unfiltered. Do not add `published` to `createEvent` / `updateEvent` input types this step.
   - **Rationale:** Public detail, book, waitlist, and confirm already call `getPublicEventById`. Admin clone/update/gallery keep drafts. DB default covers new inserts.
   - **Alternatives:** Filter `getEventById` (breaks admin). Add a `published` argument to create (step 02 owns the mutation UX).

5. **Unpublished is `EVENT_NOT_FOUND` / `PARTNER_NOT_FOUND`, not a new code**
   - **Choice:** `setEventPublished` / `setFeaturedEventPublished`: missing row → `EVENT_NOT_FOUND`. `setFeaturedPartnerPublished`: missing featured row → `PARTNER_NOT_FOUND`. `saveEvent` and `joinWaitlist`: unpublished or missing → `EVENT_NOT_FOUND` (or waitlist’s existing `EVENT_NOT_FOUND`). `bookEvent`: after lock, `if (!event.published) throw BookingError("EVENT_NOT_FOUND")`. No `EVENT_UNPUBLISHED` code.
   - **Rationale:** Public routes already treat not-found as 404 and must not leak draft titles in metadata. Step plan allows a dedicated unpublished code only if public routes still treat it as not found — existing codes are enough.
   - **Alternatives:** `EVENT_UNPUBLISHED` (extra mapping everywhere). HTTP 403 (leaks that the id exists).

6. **Booking check after idempotency and lock; waitlist join loads the event**
   - **Choice:** In `bookEvent`, after the existing `(user_id, idempotency_key)` return and after `FOR UPDATE` lock: reject unpublished before eligibility/credits/capacity writes. Idempotent retry of an existing booking still returns even if the event is now unpublished. In `joinWaitlist`, after qty validation and before insert: load the event; missing/unpublished → `EVENT_NOT_FOUND`. If a `WAITING` row already exists, return it (no new row) even if the event is now unpublished.
   - **Rationale:** Existing CONFIRMED / WAITING rows stay (parent). Booking domain stays the only purchase writer. Join today never loads the event; unpublished would otherwise insert.
   - **Alternatives:** Check published before idempotency (turns retry into not-found). Cancel bookings/waitlist on unpublish (forbidden). Add `EVENT_NOT_FOUND` to waitlist skip codes this step (promotion may throw; no booking is created either way).

7. **Member/saved/sitemap/comp filters share `events.published = true`**
   - **Choice:** Add `eq(events.published, true)` inside `memberFeedConditions` (covers feed + map). Same predicate on `listSavedUpcomingEvents`, `listBookableEventsForSitemap`, and `listUpcomingEvents`. `unsaveEvent` / `isEventSaved` / `listSavedEventIds` unchanged.
   - **Rationale:** Parent: Browse, saved-upcoming, public detail, sitemap, and comp picker must not surface drafts. Comp picker published-only is a parent risk note.
   - **Alternatives:** Filter only in SSR routes (easy to miss a helper). Hide saves by deleting rows (parent keeps the join row).

8. **Seed publishes after create / add-featured**
   - **Choice:** After each demo `createEvent` / `addFeaturedEvent` / `addFeaturedPartner` (including voucher/locale helper creates), call the matching `set*Published(..., true)`. Do not pass `published` through create input.
   - **Rationale:** New default is false; seeded Discover and Browse must keep working. Use cases stay the only writers of the flag.
   - **Alternatives:** Bulk `UPDATE … SET published = true` in seed (bypasses the use case). Hard-code `published: true` on insert (adds the field to create input).

## Risks / Trade-offs

- **[Risk] `db:generate` emits `DEFAULT false` and existing rows become drafts** → Mitigation: hand-edit migration to add-with-default-true then `SET DEFAULT false`; verify with a select count of `published = false` after migrate on a copy of staging data (expect 0 until new inserts).
- **[Risk] Discover still lists drafts if the route change is skipped** → Mitigation: this step owns the Discover `publishedOnly: true` call; add a package test that unpublished featured is absent from `publishedOnly` lists.
- **[Risk] New admin-created events disappear from Browse after migrate** → Mitigation: intended (draft-on-create). Existing rows stay published. Step 02 adds the publish confirm; step 03 updates e2e that assume create = live.
- **[Risk] `saveEvent` / `joinWaitlist` leak a different error than public 404** → Mitigation: reuse `EVENT_NOT_FOUND`; public routes already map that to not found.
- **[Risk] Featured published + event unpublished still shows a Discover card that 404s** → Mitigation: `publishedOnly` requires both flags.
- **[Trade-off] Waitlist promotion of an unpublished event throws `EVENT_NOT_FOUND` rather than skip** → Acceptable this step; no booking is written. Skip-code mapping can wait if step 02/03 hits it.
- **[Trade-off] Schema overview / Gherkin stay stale until step 03** → Required by the parent split.

## Migration Plan

1. Add `published` on the three Drizzle tables + `events_published_date_time_idx`.
2. Generate SQL (`bun run db:generate`); ensure backfill `true` then default `false`; apply (`bun run db:migrate`).
3. Implement `set*Published`; split `getPublicEventById`; add query filters; Discover `publishedOnly: true`; booking + waitlist + save gates; seed publish.
4. Add package tests next to existing catalog/discovery/featured/booking/waitlist files.
5. `bun run lint`, `bun run typecheck`, `bun test packages/db/src/catalog/ packages/db/src/booking/ packages/db/src/waitlist/`.
6. Rollback: drop the three columns and the new index. Forward-fix rather than trying to restore “everything is live” in application code.

## Open Questions

- None blocking. Admin surfaces, canonical Gherkin, and preview wait for later steps / the other parent.
