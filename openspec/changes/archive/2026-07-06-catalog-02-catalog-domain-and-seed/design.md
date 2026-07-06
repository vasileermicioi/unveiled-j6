## Context

Catalog step 01 is merged: `@unveiled/db` exposes `images`, `partners`, and `events` tables with migrations; `@unveiled/images` handles six-variant WebP processing and S3 upload/delete. Step 02 adds the **domain layer** that admin routes (steps 03–04) and the demo seed will call — keeping business rules out of HonoX route files per AGENTS.md.

Source of truth: `docs/migration/features/admin-partners.feature`, `docs/migration/features/admin-events.feature`, `docs/migration/database/schema-overview.md`, `docs/migration/extras/image-uploads.md`.

Existing patterns: `@unveiled/auth` integration tests skip when `DATABASE_URL` unset; Drizzle `createDb()` export from `packages/db/src/index.ts`; auth provisioning uses typed domain functions with explicit validation errors.

## Goals / Non-Goals

**Goals:**

- Implement partner and event catalog domain functions in `@unveiled/db` with validation, defaults, derived datetime fields, rename propagation, capacity recalculation, and image attach/replace orchestration calling `@unveiled/images`.
- Provide `scripts/seed-demo.ts` with empty-DB guard per `admin-events.feature` seed scenarios.
- Unit/integration tests for validation failures, defaults, rename sync, capacity rules, and seed idempotency.
- Re-export catalog functions from `packages/db/src/index.ts`; document in `packages/db/README.md`.

**Non-Goals:**

- HonoX admin routes, `@unveiled/ui`, public pages (`/discover`, `/events/:id`).
- Partner portal-access user creation UI and `PARTNER` role provisioning (Phase 8) — domain may expose `regenerateVenueCheckInToken` but not `createPartnerPortalAccess`.
- Multipart form parsing (routes in steps 03–04 pass buffers/URLs to domain).
- Full CSV export with booking data — `exportRedemptionCodesCsv` stub (headers-only) until Phase 6 bookings exist.
- Event series date-range builder UI — domain accepts explicit slot list; range builder is route/UI concern in step 04.

## Decisions

### 1. Module layout

```
packages/db/src/catalog/
├── index.ts              # re-exports
├── errors.ts             # CatalogValidationError, typed error codes
├── validation.ts           # email, redemption rules, image source XOR
├── datetime.ts             # Europe/Berlin start_time_minutes + weekday
├── partners.ts             # createPartner, updatePartner, deletePartner, listPartners, getPartnerById, regenerateVenueCheckInToken, renamePartnerSyncEvents
├── events.ts               # createEvent, createEventSeries, updateEvent, deleteEvent, listEvents, getEventById, recalculateRemainingCapacity, exportRedemptionCodesCsv
├── images.ts               # attachImageToPartner, attachImageToEvent, deleteImageRecord
├── seed-data.ts            # demo partner/event payloads (used by scripts/seed-demo.ts)
└── *.test.ts
```

**Rationale:** Mirrors `@unveiled/auth` modular layout; keeps image orchestration separate from entity CRUD. Single package export avoids premature `@unveiled/catalog` micro-package.

**Alternative considered:** Dedicated `@unveiled/catalog` package. Rejected — AGENTS.md defers domain micro-packages until logic is painful to keep inline; step 02 fits cleanly in `@unveiled/db`.

### 2. `@unveiled/db` depends on `@unveiled/images`

Add `@unveiled/images` as a runtime dependency of `@unveiled/db`. Image orchestration lives in `catalog/images.ts`:

1. Call `processImageFromBuffer` or `processImageFromUrl`.
2. Upload variants via images package S3 helpers (or accept pre-uploaded result from process functions).
3. Insert `images` row in same Drizzle transaction as partner/event write.
4. On replace: delete old row + `deleteImageObjects(oldId)` synchronously before commit.

**Rationale:** Step 01 intentionally kept `@unveiled/images` storage-only; step 02 owns DB + bucket atomicity per image-uploads §8.

### 3. Validation layer

| Rule | Enforcement |
|---|---|
| Partner name, address non-empty | `validation.ts` before insert |
| Partner contact email | RFC5322-lite regex or `zod` email (match auth patterns) |
| Partner logo | Optional; if provided, exactly one of buffer or URL |
| Event image | Required on create; on update if changing image, same XOR rule |
| Both upload + URL | Reject with `CatalogValidationError` |
| Neither upload nor URL on create | Reject |
| `SECRET_CODE` + `MANUAL` | `secret_code` required |
| `VOUCHER` | `promo_code` and `event_website_url` both required |
| `SHARED_GENERATED` | `secret_code` optional at create (generated at booking time in Phase 6) |
| Series slots | Dedupe by ISO instant; reject empty list and duplicates |
| Partner FK | Validate `partner_id` exists before event create |

Throw `CatalogValidationError` with stable `code` string (e.g. `INVALID_EMAIL`, `MISSING_EVENT_IMAGE`) — routes map to form errors in step 03–04.

### 4. Event creation defaults

When omitted on create:

| Field | Default |
|---|---|
| `total_capacity` | 10 |
| `remaining_capacity` | same as `total_capacity` |
| `ticket_type` | `SECRET_CODE` |
| `secret_code_mode` | `MANUAL` |
| `timing_mode` | `TIME_SLOT` |

### 5. Derived datetime fields (Europe/Berlin)

`datetime.ts` converts `date_time` (UTC `timestamptz`) to Europe/Berlin local:

- `weekday`: 0 (Sunday) – 6 (Saturday) in Berlin local date.
- `start_time_minutes`: minutes from midnight Berlin local (0–1439); for `ALL_DAY`, use 0.

Use `Intl` or a lightweight TZ helper (e.g. `@date-fns/tz` if already in repo, otherwise native `Temporal` or manual offset via `toLocaleString` with `timeZone: 'Europe/Berlin'`). **Do not** trust client-supplied derived values.

Recompute on every create and whenever `date_time` or `timing_mode` changes.

### 6. Partner rename propagation

`updatePartner` when `name` changes:

```sql
UPDATE events SET partner_name = :newName, updated_at = now() WHERE partner_id = :partnerId
```

Run in same transaction as partner update. Exposed as internal helper `renamePartnerSyncEvents`; also callable from `updatePartner`.

### 7. Capacity recalculation

`recalculateRemainingCapacity(event, newTotalCapacity)`:

```
soldCount = event.total_capacity - event.remaining_capacity
remaining = max(0, newTotalCapacity - soldCount)
```

Called from `updateEvent` when `total_capacity` changes. Without bookings table in Phase 4, sold count derives from capacity delta only (both capacities set equal on create).

### 8. Venue check-in token

On `createPartner`, if `venue_check_in_token` omitted, generate `crypto.randomUUID()` or 32-char hex; ensure uniqueness (retry on collision). `regenerateVenueCheckInToken(partnerId)` replaces with new unique value — domain only; admin UI in Phase 8.

### 9. List/query helpers

`listPartners` / `listEvents` accept pagination params aligned with `docs/migration/extras/pagination-and-search.md` (limit, offset, optional search string on name/title). Admin routes pass filters; domain builds Drizzle queries.

`getPartnerById` / `getEventById` return null when missing — routes decide 404.

### 10. Delete flows

- **deletePartner:** Delete logo image (if any) via `deleteImageRecord`, then partner row. Events FK is `ON DELETE RESTRICT` — reject delete if events exist (match feature: admin must delete events first, or document cascade policy). **Decision:** reject with error if partner has events (safer for v1).
- **deleteEvent:** Delete event image via `deleteImageRecord`, then event row.

### 11. `exportRedemptionCodesCsv` stub

Return CSV string with header row only (`booking_id,redemption_code,status`) or empty body until bookings exist in Phase 6. Function signature accepts `eventId` for forward compatibility.

### 12. Demo seed script

`scripts/seed-demo.ts`:

1. Load `DATABASE_URL` from env (exit 1 if missing).
2. Count `partners` and `events`; if either > 0, log "skipped" and exit 0.
3. Call catalog domain functions (not raw SQL) to create 2–3 partners with remote logo URLs and 3–5 upcoming events spread across partners.
4. Use stable demo content (names, categories) suitable for staging screenshots.

Seed data constants live in `packages/db/src/catalog/seed-data.ts` so tests can import the same payloads.

**Alternative considered:** Raw Drizzle inserts in script. Rejected — seed should exercise domain validation path.

### 13. Testing strategy

Follow `@unveiled/auth` pattern:

- **Validation unit tests:** Mock-free; call pure validation helpers and expect throws.
- **Integration tests:** Require `DATABASE_URL`; create partners/events, assert DB state, clean up in `finally`.
- **Seed idempotency test:** Run seed logic twice; assert second run no-ops (can use transaction rollback or dedicated test DB).
- Add `"test": "bun test"` script to `packages/db/package.json`.

### 14. Package exports

`packages/db/src/index.ts`:

```typescript
export * from "./catalog";
```

Keep schema exports unchanged. README documents catalog function list and `bun run seed:demo`.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Orphaned bucket objects if transaction fails mid-upload | Process + upload + insert in transaction; on failure attempt best-effort `deleteImageObjects` for new id |
| `@unveiled/db` now depends on `sharp` transitively | Document Node.js requirement in README; already required for hosting |
| Europe/Berlin DST edge cases | Test around DST transition dates; use established TZ library |
| Partner delete with events blocked | Clear error code; admin deletes events first (matches RESTRICT FK) |
| Integration tests need live Neon | Skip with warning when `DATABASE_URL` unset (auth pattern) |
| Seed remote URL fetch fails offline | Document required network/R2 for full seed; tests use buffer fixtures |

## Migration Plan

1. Implement on branch `catalog-02-catalog-domain-and-seed`.
2. `bun install` — link `@unveiled/images` into `@unveiled/db`.
3. No new Drizzle migration (schema unchanged from step 01).
4. `cd packages/db && bun test` — catalog tests pass.
5. Fresh DB: `bun run seed:demo` twice — second run no-op.
6. `bun run typecheck && bun run lint`.
7. Rollback: revert branch; no DB rollback needed.

## Open Questions

- None blocking step 02. Event series date-range builder deferred to admin UI (step 04) — domain accepts explicit slot arrays only.
- Optional Postgres FK `users.partner_id` → `partners.id` remains deferred to Phase 8.
