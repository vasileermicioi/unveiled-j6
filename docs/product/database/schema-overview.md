# Database Schema Overview (MVP — Drizzle ORM + Neon Postgres)

Complete production-MVP schema (including booking/credits/waitlist tables even if Phase 6–7 code is unshipped). Drizzle manages `public` only; Neon Auth owns `neon_auth`. Partner-portal / check-in **columns** may exist for forward compatibility but are labeled **post-MVP**.

## Entity overview

Tables: `users`, `subscriptions` (1:1), `saved_events`, `featured_events`, `featured_partners`, `partners`, `images`, `events`, `event_gallery_images`, `bookings`, `waitlist_entries`, `credit_ledger`.

---

### `users`

| Field | Type | Notes |
|---|---|---|
| `id` | text/uuid, PK | Was Firebase Auth UID; in the rewrite stores the **Better Auth user id** from Neon Auth (same value as `neon_auth.user.id`) — keyed in app code, not modeled as a Drizzle FK to `neon_auth` (see "Auth integration note" below) |
| `email` | text, unique | |
| `email_verified` | boolean | |
| `role` | enum: `USER`, `ADMIN`, `PARTNER` | MVP active roles: `USER`, `ADMIN`. `PARTNER` reserved for **post-MVP** portal |
| `credits` | integer | Non-negative constraint recommended |
| `partner_id` | text/uuid, FK → `partners.id`, nullable | Only for `PARTNER` role — **post-MVP** usage |
| `saved_event_ids` | — | **Use `saved_events` join table** (`user_id`, `event_id`) — not an array column |
| `created_at` / `updated_at` | timestamptz | Present in Firestore docs but not in the old TS types — add explicitly |

**`profile` (recommend: JSONB column `profile`, OR normalize if frequently queried):**

| Field | Type |
|---|---|
| `first_name`, `last_name` | text, nullable — set to `NULL`/anonymized placeholder on account deletion (see "Account deletion" below) |
| `age_group` | enum: `18-25`, `26-35`, `36-50`, `50+`, nullable |
| `interests`, `moods`, `timing`, `preferred_days`, `preferred_languages` | text[] (Postgres native arrays are fine here — low cardinality, not relational) |
| `country` | text, ISO 3166-1 alpha-2 — location preference; this release defaults / prefills `DE` |
| `city` | text, canonical city key — this release defaults / prefills `berlin` |
| `zip_code` | text — postal code validated via shared `validatePostalCode({ country, city, zipCode })` (Berlin PLZ under `(DE, berlin)`) |
| `interests_other` | text, nullable — free-text interest when `interests` includes `Other`; null when Other is not selected |
| ~~`districts`~~ | **Replaced** by `country` / `city` / `zip_code`. Legacy key is cleared on preference / onboarding location writes (not an active preference array) |
| `max_distance` | integer (km), optional **legacy** JSONB — not collected in onboarding or Vibes; location/preference saves leave the key untouched (neither required nor cleared by policy). Admin Membership HQ may show km when non-null. Not used to rank the member feed |
| `accessibility` | boolean |
| `language` | enum: `DE`, `EN` |
| `onboarding_complete` | boolean |
| `deleted_at` | timestamptz, nullable | Set when account deletion (GDPR erasure) is processed — see below |

**Decided: newsletter fields dropped entirely.** The old app's `newsletterOptIn`/`newsletterStatus`/`newsletterToken`/`newsletterTokenExpires` fields had zero corresponding product (no signup UI, no sending logic) — carrying dead schema forward invites confusion. See `product/vision-and-domains.md` non-goals. If a newsletter is built later, add its schema then.

**Account deletion (GDPR right to erasure — new for the rewrite, see `features/auth.feature`):** on deletion, anonymize `email` (replace with a non-reversible placeholder unique value to preserve the unique constraint), null out `first_name`/`last_name` and all preference arrays, set `deleted_at`, and disable login (delete/ban the corresponding row in `neon_auth.user`, or clear its credentials — Neon Auth owns that table). **Do not hard-delete the `public.users` row** — `bookings` and `credit_ledger` rows retain their `user_id` foreign key for legally-required financial/accounting retention (German GoBD retention rules), so the `users` row must continue to exist in anonymized form rather than being deleted, which would either orphan those records or force cascading deletes that destroy required financial history.

**`subscription` (recommend its own 1:1 `subscriptions` table given it now integrates with real Stripe webhooks — easier to index/query independently of the `users` row than a JSONB blob):**

| Field | Type |
|---|---|
| `status` | enum: `ACTIVE`, `CANCELLED_PENDING`, `INACTIVE`, `PAST_DUE`, `UNPAID` — **`PAUSED` is decided-cut** (no feature ever used it; see `features/credits-subscription.feature`) |
| `period_end` | timestamptz, nullable |
| `plan` | enum/text, currently only `BASIC_BERLIN` |
| `stripe_customer_id`, `stripe_subscription_id` | text, nullable, unique where not null — **payment provider is decided: Stripe** (Stripe Billing: Checkout + Customer Portal + webhooks), see `extras/integrations-and-config.md` |
| `payment_method` | enum: `CARD`, `PAYPAL`, `SEPA`, nullable — informational display only; the actual charge/payment-method handling lives in Stripe, not in this app's database |
| `billing_address` | text, nullable |

**`behavior` analytics (recommend: JSONB column `behavior`, low query priority — this is write-heavy telemetry, not core business data):**

Counters (`session_count`, `event_open_count`, `booking_count`, `waitlist_count`, `saved_count`, `unsaved_count`, `filter_apply_count`), `view_counts` (map of view name → count), `recent_event_ids` (last 8), timestamps/last-touched fields (`last_seen_at`, `last_view`, `last_opened_event_id`, `last_booked_event_id`, `last_waitlisted_event_id`, `last_saved_event_id`, `onboarding_completed_at`, `preferences_updated_at`), and `last_filter` (category/partner/date-range/result-count/applied-at snapshot).
**Recommendation:** if real analytics/BI is planned (mentioned as future scope in the old migration plan), consider moving this to a proper event-log table instead of a mutable JSONB blob, so historical behavior isn't overwritten.

---

### `partners`

| Field | Type | Notes |
|---|---|---|
| `id` | text/uuid, PK | |
| `name` | text | |
| `street` | text, not null | Required structured street name |
| `house_number` | text, not null | Required house number (may include suffix, e.g. `12a`) |
| `address_line2` | text, nullable | Optional unit/floor/entrance; excluded from geocode queries |
| `country` | text, not null, default `DE` | ISO 3166-1 alpha-2. This release supports `DE` only. |
| `city` | text, not null, default `berlin` | Canonical city key (lowercase slug). This release supports `berlin` only. |
| `zip_code` | text, not null | Berlin PLZ via `validatePostalCode({ country, city, zipCode })` — zip parity with events |
| `address` | text, not null | **Composed on write** from structured fields (`street`, `house_number`, optional `address_line2`, `zip_code`, city display label) — display/legacy read surface, not admin-authored free text |
| `contact_email` | text | |
| `logo_image_id` | uuid, FK → `images.id`, NOT NULL | **Was `logo_url` (text)** — replaced by a real image with generated size variants; see `extras/image-uploads.md`. **Required** on partner create (same five-WebP pipeline as event images); edit may replace but MUST NOT clear to NULL |
| `venue_check_in_token` | text, unique, nullable | **Post-MVP** — QR self-check-in |
| `portal_user_id` | text/uuid, FK → `users.id`, nullable | **Post-MVP** — partner portal login |
| `portal_user_email` | text, nullable | **Post-MVP** — denormalized portal email |
| `created_at` / `updated_at` | timestamptz | |

---

### `images`

**Image pipeline** — see `extras/image-uploads.md`: S3-compatible storage, **five WebP** variants per image (`hero-1920.webp`, `large-1280.webp`, `medium-640.webp`, `small-320.webp`, `og-1200x630.webp`). No `original` master. Both `events.image_id` and `partners.logo_image_id` FK into this table (both required on create).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | Doubles as the storage key folder name — bucket layout is `images/{id}/{variant}.webp` (five fixed filenames per id, see `extras/image-uploads.md` §1) |
| `original_width`, `original_height` | integer | Natural dimensions of the decoded source, before any resizing (claimed from the client when no master object is stored) |
| `source` | enum: `UPLOAD`, `REMOTE_URL` | Which entry path produced this image (`extras/image-uploads.md` §3) |
| `source_url` | text, nullable | The original remote URL, only set when `source = REMOTE_URL` — kept for audit/re-processing, never used for direct display (the app always serves its own bucket copy) |
| `uploaded_by` | text/uuid, FK → `users.id`, nullable | Who triggered the upload/fetch (signed-in admin; partner uploads are **post-MVP**) |
| `created_at` | timestamptz | |

No per-variant rows or columns — the five filenames are a fixed, universal convention rather than stored data; a variant's URL is always computed as `{IMAGE_PUBLIC_BASE_URL}/images/{id}/{filename}` (`extras/image-uploads.md` §6).

**Deletion:** no legal retention requirement (unlike `bookings`/`credit_ledger`). When an event/partner's image is replaced, or the event/partner itself is deleted, delete the old `images` row and all five of its bucket objects in the same request — see `extras/image-uploads.md` §8.

---

### `events`

| Field | Type | Notes |
|---|---|---|
| `id` | text/uuid, PK | |
| `partner_id` | text/uuid, FK → `partners.id` | |
| `partner_name` | text | **Denormalized** from `partners.name` — kept in sync on partner rename in the old app. Recommend either (a) keeping the denormalization with an app-layer sync step, or (b) dropping it and always joining `partners` — Postgres makes the join cheap, so (b) is likely simpler now |
| `title`, `description` | text | `description` is **Markdown at rest** (GFM on public detail via `MarkdownContent`; authored in admin via MDXEditor). Plain text remains valid Markdown. No separate HTML column. |
| `street` | text, not null | Required structured street name |
| `house_number` | text, not null | Required house number |
| `address_line2` | text, nullable | Optional unit/floor/entrance; excluded from structured geocode |
| `country` | text, not null, default `DE` | ISO 3166-1 alpha-2. This release supports `DE` only (postal registry). |
| `city` | text, not null, default `berlin` | Canonical city key (lowercase slug). This release supports `berlin` only. |
| `zip_code` | text, not null | Postal code; for `(DE, berlin)` must be a valid Berlin PLZ (5-digit + membership ranges **10115–14199**). Replaces legacy `neighborhood`. |
| `address` | text, not null | **Composed on write** from structured fields — public LOCATION and list displays use this string; admins author structured fields, not free-text `address` |
| `image_id` | uuid, FK → `images.id`, **not nullable** | **Was `image_url` (text)** — replaced by a real image with generated size variants; see `extras/image-uploads.md`. Stays required, matching today's `image` field being non-optional on event create/edit (`features/admin-events.feature`) |
| `category`, `event_type` | text | Free-form strings today — consider enum/lookup table if the category list is meant to be fixed |
| `tags` | text[] | |
| `date_time` | timestamptz | |
| `timing_mode` | enum: `TIME_SLOT`, `ALL_DAY` | |
| `start_time_minutes` | integer (0–1439) | Derived/cached from `date_time` — recompute on write rather than trusting client input |
| `weekday` | integer (0–6) | Same — derived |
| `credit_price` | integer | |
| `total_capacity`, `remaining_capacity` | integer | `remaining_capacity` must never go negative — recommend a DB check constraint (`remaining_capacity >= 0`) in addition to app-layer transaction logic |
| `ticket_type` | enum: `SECRET_CODE`, `VOUCHER_PROMO`, `VOUCHER_PDF` | Replaces legacy `VOUCHER`. No secret-code generation modes. |
| ~~`secret_code_mode`~~ | — | **Decided cut:** `SHARED_GENERATED` / `UNIQUE_PER_BOOKING` / `MANUAL` modes removed. `SECRET_CODE` is always an admin-configured manual `secret_code`. |
| `secret_code` | text, nullable | Required when `ticket_type = SECRET_CODE` (shared by all bookings/tickets for that event) |
| ~~`voucher_template`, `secret_code_rules`~~ | — | **Decided cut:** present in the old type system but referenced by no scenario in any feature file and no current UI/business logic — dropped from the schema rather than carried forward as dead fields |
| `promo_code` | text, nullable | **Deprecated for new writes.** Legacy migration may seed at most one `event_voucher_codes` row; voucher redemption source is inventory, not this column. |
| `event_website_url` | text, nullable | Required when `ticket_type = VOUCHER_PROMO` (partner site link shown with promo codes) |
| `barrier_free` | boolean, nullable | |
| `language_independent` | boolean, **not nullable**, default `false` | When true, the event has no spoken-language requirement; `languages` MUST be null. Language filters treat these events as matching every language value. |
| `languages` | text[], nullable | Spoken-language codes when not language-independent; null/empty means unset / none selected for language-specific events |
| `has_subtitles` | boolean, **not nullable**, default `false` | When true, the event has subtitles; independent of spoken `languages` / `language_independent`. |
| `subtitle_language` | text, nullable | Single ISO 639-1 language code (uppercase alpha-2, e.g. `DE`, `EN`, `SW`) when `has_subtitles` is true — broader than spoken-event `EVENT_LANGUAGES`; MUST be null when `has_subtitles` is false. |
| `target_age_groups` | enum[], nullable | |
| `lat`, `lng` | numeric, nullable | System-derived from **structured** geocode (`street` + `house_number` + `zip_code`; `address_line2` excluded) for map display only — not admin-authored. Null when geocode soft-fails; MUST NOT store invented default-center coordinates |
| ~~`map_zoom`~~ | — | **Decided cut:** admin zoom authoring removed; maps use a UI default zoom. Column dropped. |
| `created_at` / `updated_at` | timestamptz | |

---

### `saved_events`

Join table for member bookmarks (MVP).

| Field | Type | Notes |
|---|---|---|
| `user_id` | FK → `users.id` | Composite PK with `event_id` |
| `event_id` | FK → `events.id` | |
| `created_at` | timestamptz | |

Unique `(user_id, event_id)`. Cascade or restrict deletes per product rules (prefer remove save when event deleted).

---

### `featured_events`

Admin-curated Discover featured list (join table; no duplicated event payload).

| Field | Type | Notes |
|---|---|---|
| `event_id` | FK → `events.id`, PK | One featured row per event; **ON DELETE CASCADE** |
| `sort_order` | integer | Append on add; Discover/admin order by `sort_order` then `date_time` |
| `created_at` | timestamptz | |

Removing a featured row MUST NOT delete the underlying `events` row. Full Discover/browse product behavior is documented with the Featured Discover feature steps.

---

### `featured_partners`

Admin-curated Discover Partner venues list (join table; no duplicated partner payload).

| Field | Type | Notes |
|---|---|---|
| `partner_id` | FK → `partners.id`, PK | One featured row per partner; **ON DELETE CASCADE** |
| `sort_order` | integer | Append on add; Discover/admin order by `sort_order` then partner name |
| `created_at` | timestamptz | |

Removing a featured row MUST NOT delete the underlying `partners` row. Discover displays up to 8 by `sort_order`; admin may hold a longer curated list. Empty curated list hides the Partner venues section on Discover.

---

### `event_gallery_images`

Optional ordered photo gallery per event (separate from required primary `events.image_id`).

| Field | Type | Notes |
|---|---|---|
| `event_id` | FK → `events.id` | Composite PK with `image_id`; **ON DELETE CASCADE** |
| `image_id` | FK → `images.id` | **ON DELETE RESTRICT** — app deletes unreferenced `images` rows/objects after join removal (same sequencing as hero cleanup; see `extras/image-uploads.md` §8) |
| `sort_order` | integer | Append on add; list ordered by `sort_order` then `image_id` |
| `created_at` | timestamptz | |

No hard count cap — admins may attach any number of gallery images per event. Gallery membership MUST NOT replace the primary hero. Index `(event_id, sort_order)` for list queries. Admin UI / public slider are separate feature steps.

---

### `event_voucher_codes`

Promo-code inventory for `VOUCHER_PROMO` events (one row per redeemable code).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `event_id` | FK → `events.id` | |
| `code` | text | Unique per event |
| `status` | enum: `AVAILABLE`, `ALLOCATED` | |
| `booking_ticket_id` | FK → `booking_tickets.id`, nullable | Set when allocated |
| `created_at` / `updated_at` | timestamptz | |

### `event_voucher_pdfs`

PDF voucher inventory for `VOUCHER_PDF` events (one row per downloadable ticket PDF in R2).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `event_id` | FK → `events.id` | |
| `object_key` | text | R2 object key; unique per event |
| `original_filename`, `page_label` | text, nullable | Display / export metadata |
| `status` | enum: `AVAILABLE`, `ALLOCATED` | |
| `booking_ticket_id` | FK → `booking_tickets.id`, nullable | Set when allocated |
| `created_at` / `updated_at` | timestamptz | |

For `VOUCHER_PROMO` / `VOUCHER_PDF`, admin does not set capacity separately — `total_capacity` is derived from inventory size (codes or PDF tickets). Bookable quantity remains `min(remaining_capacity, available_inventory)` as a safety bound.

### `bookings`

| Field | Type | Notes |
|---|---|---|
| `id` | text/uuid, PK | Old app used a deterministic id `{userId}_{idempotencyKey}` for the atomic-booking path — in Postgres, prefer a real generated PK plus a **unique constraint on `(user_id, idempotency_key)`** to achieve the same idempotency guarantee more idiomatically |
| `user_id` | FK → `users.id` | |
| `event_id` | FK → `events.id` | |
| `partner_id` | FK → `partners.id` | **Denormalized** from `events.partner_id` — kept for fast partner-scoped guest-list queries. Worth keeping in Postgres too (or replace with an indexed join — measure query cost first) |
| `tickets_count` | integer | Member max = `min(floor(credits ÷ creditPrice), remainingCapacity)` (and voucher inventory when applicable); not a universal hard max of 3 |
| `total_credits` | integer | Snapshot of price paid, independent of later price changes |
| `status` | enum: `CONFIRMED`, `WAITLIST`, `CANCELLED`, `USED` | |
| `redemption_type` | enum: `SECRET_CODE`, `VOUCHER_PROMO`, `VOUCHER_PDF`, nullable | Same enum as `events.ticket_type` |
| `redemption_info`, `redemption_url` | text, nullable | Booking-level summary (typically ticket ordinal 1) for email/backward-compatible readers; member UI prefers `booking_tickets` |
| `idempotency_key` | text | See PK note above |
| `checked_in_at` | timestamptz, nullable | **Post-MVP** active use (door check-in); column may exist for forward compatibility |
| `cancelled_at` | timestamptz, nullable | Set when an admin cancels a booking; distinct from `checked_in_at` |
| `cancellation_reason` | text, nullable | New — required whenever `status` is set to `CANCELLED` by an admin |
| `created_at` / `updated_at` | timestamptz | |

### `booking_tickets`

One redemption artifact per ticket on a booking (`ordinal` 1..N, unique per booking).

| Field | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `booking_id` | FK → `bookings.id` | |
| `ordinal` | integer | 1..N within the booking |
| `redemption_code` | text, nullable | Secret or promo code text |
| `redemption_url` | text, nullable | Partner website for promo types |
| `voucher_pdf_id` | uuid, nullable | Points at `event_voucher_pdfs.id` (no circular FK; inventory row holds `booking_ticket_id`) |
| `created_at` / `updated_at` | timestamptz | |

Admin cancel of a confirmed booking returns allocated inventory to `AVAILABLE` and clears live redemption payloads on these rows (credits are not auto-refunded).

---

### `waitlist_entries`

| Field | Type | Notes |
|---|---|---|
| `id` | text/uuid, PK | |
| `event_id` | FK → `events.id` | |
| `user_id` | FK → `users.id` | |
| `requested_qty` | integer | |
| `status` | enum: `WAITING`, `PROMOTED`, `CANCELLED` | **Decided/resolved:** `PROMOTED` is now a real, produced status — automatic promotion is implemented (see `features/waitlist.feature`). `CANCELLED` is now also user-reachable (self-cancel), not just admin-only |
| `skipped_once` | boolean, default `false` | New — set when a promotion attempt skips this entry because the member was no longer eligible (subscription lapsed / insufficient credits) at the moment their turn came up; lets support distinguish "still waiting, never offered" from "was offered, couldn't take it" |
| `created_at` / `updated_at` | timestamptz | |

---

### `credit_ledger`

| Field | Type | Notes |
|---|---|---|
| `id` | text/uuid, PK | Old app used `book_{bookingId}` for booking-related entries |
| `user_id` | FK → `users.id` | |
| `amount` | integer | Positive (refill/adjust-up) or negative (booking spend/adjust-down) |
| `balance_after` | integer | Snapshot for audit trail |
| `type` | enum: `SUBSCRIPTION_REFILL`, `BOOKING`, `EXPIRY`, `REFUND`, `ADMIN_ADJUST` | **Decided, resolved from the old app's unused-enum-value gap:** `PURCHASE` and `REFERRAL_BONUS` are cut (no à la carte credit purchases or referral program — see `product/vision-and-domains.md` non-goals). `EXPIRY` and `REFUND` are now real, produced types — `EXPIRY` on every subscription renewal/cancellation-at-period-end (forfeiting unused credits, see `features/credits-subscription.feature`), `REFUND` on admin manual goodwill refunds (decoupled from booking cancellation, see `features/booking.feature`) |
| `description` | text | |
| `idempotency_key` | text, nullable, **unique where not null** | Enforces the idempotent-booking guarantee |
| `timestamp` | timestamptz | |

---

## Foreign key summary

```mermaid
erDiagram
  users ||--o{ bookings : "userId"
  users ||--o{ waitlist_entries : "userId"
  users ||--o{ credit_ledger : "userId"
  users }o--|| partners : "partnerId (PARTNER role)"
  partners ||--o| users : "portalUserId"
  partners ||--o{ events : "partnerId"
  partners ||--o{ bookings : "partnerId (denormalized)"
  partners ||--o{ featured_partners : "partnerId"
  events ||--o{ bookings : "eventId"
  events ||--o{ featured_events : "eventId"
  events ||--o{ waitlist_entries : "eventId"
  users }o--o{ events : "savedEventIds (recommend join table)"
  images ||--o| partners : "logoImageId"
  images ||--|| events : "imageId"
  events ||--o{ event_gallery_images : "eventId"
  images ||--o{ event_gallery_images : "imageId"
  users ||--o{ images : "uploadedBy"
```

## Indexes to replicate (from `firestore.indexes.json` + function queries)

| Table | Columns | Purpose |
|---|---|---|
| `events` | `(date_time, partner_id)` | Date-sorted feed filtered by partner |
| `events` | `(date_time, category)` | Date-sorted feed filtered by category |
| `events` | `(date_time)` | Range scans (daily partner-codes email job) |
| `bookings` | `(user_id, created_at desc)` | User's booking history |
| `bookings` | `(partner_id, created_at desc)` | Partner guest list |
| `bookings` | `(user_id, partner_id, status)` | Venue QR self-check-in lookup |
| `bookings` | `(event_id)` | Daily partner-codes email job |
| `waitlist_entries` | `(event_id, created_at)` | Event waitlist queue order |
| `waitlist_entries` | `(user_id, created_at)` | User's waitlist entries |
| `credit_ledger` | `(user_id, timestamp desc)` | User's credit history |

## Constraints worth enforcing at the DB layer

- `events.remaining_capacity >= 0`
- `users.credits >= 0`
- `credit_ledger.idempotency_key` unique (where not null)
- `bookings (user_id, idempotency_key)` unique — replaces the old deterministic-ID trick
- Foreign keys with `ON DELETE RESTRICT` (or `CASCADE` only where deletion should genuinely cascade, e.g. deleting a partner probably should NOT cascade-delete its historical bookings)
- `events.image_id` / `partners.logo_image_id` → `images.id`: `ON DELETE RESTRICT` (deleting an event/partner is what triggers deleting its image, not the other way around — see `extras/image-uploads.md` §8 for the app-level cleanup sequencing)
- `event_gallery_images.event_id` → `events.id`: `ON DELETE CASCADE`; `event_gallery_images.image_id` → `images.id`: `ON DELETE RESTRICT` (event delete / gallery remove deletes unreferenced gallery images at the app layer after join rows are gone)

## Business-critical transaction: booking

The old `bookEventAtomic` Firestore transaction (check subscription → check capacity → check credits → deduct credits → decrement capacity → generate redemption → create booking → write ledger entry) must become a single Postgres transaction (`BEGIN ... COMMIT`) in the HonoX server action, using `SELECT ... FOR UPDATE` on the event row (and/or the user row) to prevent race conditions on concurrent bookings for the same event/user. This is the single most important piece of business logic to get right in the rewrite.

**New transactional flows that reuse this same logic (decided during the rewrite, not present in the old app):**
- **Comp tickets** (`features/credits-subscription.feature`) go through the identical transaction, just skipping the credit-deduction step.
- **Waitlist promotion** (`features/waitlist.feature`) calls the same transaction on a waiting member's behalf when capacity frees up — it must re-run the full subscription/credit checks at promotion time, not reuse stale checks from when they originally joined the waitlist.
- **Booking cancellation** (`features/booking.feature`) is its own transaction: set `status = 'CANCELLED'`, increment `events.remaining_capacity`, then (in the same or an immediately-following transaction) trigger waitlist promotion processing for that event.

## Timezone handling

Not addressed anywhere in the old app's type system (Firestore timestamps are UTC instants by construction, so the ambiguity never surfaced explicitly, but it's worth being explicit for the rewrite since Postgres/Drizzle gives more ways to get this wrong):

- Store every `timestamptz` column as a genuine UTC instant (Postgres's `timestamptz` always normalizes to UTC internally regardless of session timezone — use it, not a plain `timestamp`/`timestamp without time zone`, for every timestamp column in this schema).
- The product is Berlin-only (`product/vision-and-domains.md` non-goals), so **display** — event start times, check-in window boundaries, optional discovery date-range filters (`features/event-discovery.feature`), the daily partner-codes cron (`extras/integrations-and-config.md`, already specified as `Europe/Berlin`) — is always rendered/evaluated in `Europe/Berlin` local time, converting from the stored UTC instant at render/query time. The member feed defaults to all upcoming events (`date_time >= now`, soonest first); custom `from`/`to` filters use inclusive full Berlin calendar days. This matters concretely for date-range filters and the check-in window (`features/checkin.feature`'s "24 hours before / 18 hours after") around the twice-yearly DST transitions — compute both using a real timezone-aware library (e.g. a `Temporal`/`date-fns-tz`/`luxon`-equivalent) against `Europe/Berlin`, not by hardcoding a fixed UTC offset that silently drifts by an hour twice a year.
- Client-supplied `startTimeMinutes`/`weekday` derived fields (`events.start_time_minutes`, `events.weekday`, per the table above) must be computed server-side from the event's `date_time` interpreted in `Europe/Berlin`, not from whatever local timezone the admin's or partner's browser happens to be in when creating the event.

## Auth integration note

Auth is **Neon Auth** — Neon hosts the **Better Auth** backend inside the same Postgres database, so there's no separate auth service to run in this repo. Neon Auth automatically creates and owns its own tables (`user`, `session`, `account`, `verification`, etc.) in a dedicated `neon_auth` schema; you don't define or migrate those yourself, and shouldn't add app-specific columns to them. **Do not model `neon_auth` in Drizzle** — Drizzle manages `public` schema tables only.

This means `public.users` stays a genuinely separate table, with `users.id` holding the same id as `neon_auth.user.id` (returned by the Better Auth session API) rather than being the same managed row — the old app's pattern of putting everything (role, credits, profile, subscription) on one auth-identity row doesn't map 1:1 here, since Neon Auth's `user` table isn't app-editable. In practice: `public.users` holds all app/business fields described in this document, keyed by the Better Auth user id. Enforce the id relationship in application code when provisioning; a Postgres FK to `neon_auth.user` is optional and outside Drizzle's scope for Phase 2.
