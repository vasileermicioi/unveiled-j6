## Context

Parent feature: Image pipeline (`.dev-plan/current-iteration/image-pipeline-parent-guide.md`). Child step 02 — depends on step 01 WebP multipart + URL helpers (done).

Today `partners.logo_image_id` is nullable (`packages/db/src/schema/partners.ts`). `createPartner` persists NULL when no logo source is supplied; admin create/edit treat logo as optional; seed may create partners without logos. Events already require a primary image — product now requires the same for partner logos.

Constraints: SSR form POST only; catalog domain owns attach/replace/cleanup; Drizzle `public` schema only; five WebP prebuilt pipeline from step 01; product SoT / BDD rewrite deferred to step 04; OpenSpec deltas are the planning contract for this increment.

Parent open question (NULL logos before `NOT NULL`) is resolved here as Decision 1.

## Goals / Non-Goals

**Goals:**

- Backfill every NULL `partners.logo_image_id`, then make the column `NOT NULL`.
- Enforce required complete prebuilt logo on partner create; replace-only on edit (never clear to NULL).
- Admin create requires logo supply; edit has no clear-logo path; minimum client guard so create does not submit without a logo.
- Demo seed / fixtures: every partner has a logo image id with five WebP variants (or `skipUpload` in tests).
- Tighten TypeScript optional chains that assumed nullable logo FK (broken-URL empty states may remain).

**Non-Goals:**

- Client error messaging / variant preview gallery polish (step 03) beyond the minimum create submit guard.
- Canonical `docs/product/` / Gherkin / DEPLOYMENT narrative rewrite (step 04).
- Changing event gallery multi-image rules or event primary-image behavior.
- Partner portal / check-in image flows (post-MVP).
- Bulk rewrite of historical partner logos beyond NULL backfill.

## Decisions

1. **Backfill NULL logos with solid WebP placeholder (offline helper), not delete partners**
   - **Choice:** Before `SET NOT NULL`, for each partner with `logo_image_id IS NULL`, create an `images` row, upload a complete five-variant WebP set generated via `@unveiled/images/offline` (`createSolidWebp` / `bufferToPrebuiltVariants` or equivalent seed path), attach that id, then alter the column. Prefer a SQL+script migration pattern consistent with repo Drizzle migrations (custom SQL step or one-shot script invoked from migration docs — implementers: keep Workers-safe packages free of `/offline` imports; run backfill from Bun/scripts context only).
   - **Rationale:** Preserves staging/demo partner rows and featured associations; parent listed placeholder as primary option; deleting partners risks cascading event/featured damage.
   - **Alternatives:** Manual staging cleanup / delete NULL-logo partners — faster but destructive; leave nullable until ops cleans — blocks schema goal.

2. **Schema: `logoImageId` non-null FK**
   - **Choice:** Drizzle `logoImageId: uuid("logo_image_id").notNull().references(() => images.id, { onDelete: "restrict" })` (retain restrict). Generate migration after backfill ordering is safe (backfill in same migration before `SET NOT NULL`, or ordered pre-migration script + follow-up alter — prefer single migration that backfills then constrains when runnable from Bun).
   - **Rationale:** Matches event `image_id` required pattern; DB enforces product rule.
   - **Alternatives:** App-only validation without DB constraint — drift risk.

3. **Domain create requires prebuilt (or exclusive logo source); reject empty**
   - **Choice:** `createPartner` MUST obtain a non-null `logoImageId` via `persistImageFromSource` when a valid exclusive logo source (prefer `logoPrebuilt` admin path) is present; if missing/incomplete, throw `CatalogValidationError` and do not insert. Align with how event create requires primary image. Keep `skipUpload` for tests that still attach a real image id / prebuilt pack.
   - **Rationale:** Spec scenarios; catalog owns writes.
   - **Alternatives:** Route-only validation — bypassable; allow URL/buffer-only without prebuilt — contradicts step 01 admin contract (prebuilt WebP is the path).

4. **Domain edit is replace-only**
   - **Choice:** `updatePartner` / `replacePartnerLogo` never write NULL. Omitting a new logo keeps `existing.logoImageId`. Supplying a new valid prebuilt set replaces and cleans up the previous image when unreferenced. No admin API to “clear logo.”
   - **Rationale:** Spec: edit keeps logo when no replacement; NOT NULL column.
   - **Alternatives:** Explicit clear control — rejected by product.

5. **Admin UI: required on create; no remove on edit**
   - **Choice:** Partner create form marks logo required (native file / existing `EventImageUpload` pattern) and blocks submit without processed variants (minimum for this step). Edit shows current logo; replacement optional; remove/clear control absent. Server still rejects create without variants even if client guard is bypassed.
   - **Rationale:** SSR POST + defense in depth; gallery/error polish stays in 03.
   - **Alternatives:** Client-only required attribute — insufficient alone.

6. **Seed always attaches logos**
   - **Choice:** Every demo/seed partner path that inserts into `partners` MUST set `logoImageId` to a persisted five-WebP image (reuse existing seed image packs / solid offline generation). Update any fixture that currently omits logos.
   - **Rationale:** Staging demo script must comply after NOT NULL.
   - **Alternatives:** Conditional seed logos — fails migration/seed on empty DBs.

7. **Type narrowing after NOT NULL**
   - **Choice:** Treat `Partner.logoImageId` as `string`. Remove NULL branches that skip URL build solely because FK is null; keep try/catch or empty-state for invalid/missing public URL if already present.
   - **Rationale:** Matches schema; avoids dead optional chains.
   - **Alternatives:** Keep `| null` in app types — lies to callers.

## Risks / Trade-offs

- **[Risk] Migration fails if backfill cannot reach R2** → Mitigation: support `skipUpload` / offline-only attach for local test DBs where documented; staging/production migration must have image env vars; dry-run count of NULL rows before apply.
- **[Risk] Placeholder logos look wrong on Discover** → Mitigation: accepted for legacy NULL rows; admins replace via edit; seed should use real packs where available.
- **[Risk] `/offline` imported into Workers graph** → Mitigation: backfill only in Bun scripts / migration runner; never import offline from `apps/web` routes.
- **[Risk] Orphan images if create fails mid-flight** → Mitigation: persist-then-insert ordering already used by catalog; on validation failure before insert, clean partial image if create path already does for events — mirror event create cleanup.
- **[Trade-off] OpenSpec vs product SoT** → Planning contract ships here; `admin-partners.feature` / schema overview / image-uploads.md sync in step 04.
- **[Trade-off] Minimum create submit guard vs step 03 UX** → Enough to not submit empty logo; polished errors/gallery deferred.

## Migration Plan

1. Inventory NULL `logo_image_id` on target DB (`SELECT count(*) …`).
2. Land domain + admin + seed code that always writes non-null logos for new/updated paths.
3. Run backfill (migration or script) creating placeholder WebP sets for remaining NULL rows; verify zero NULLs.
4. Apply `NOT NULL` constraint via Drizzle migration; deploy Workers.
5. Re-seed demo if needed (`bun run seed:demo`).
6. Rollback: revert app + drop NOT NULL only if placeholders/backfill are acceptable to keep; deleting placeholder images while FK is NOT NULL is unsafe — restore previous migration state from DB branch if needed.

## Open Questions

- None blocking implementation. If a specific staging DB has partners that should be deleted instead of placeholder-backed, ops may delete those rows **before** running the backfill migration; default remains placeholder backfill.
