## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/image-pipeline-02-partner-logo-required.md` and parent guide; confirm backfill = solid WebP placeholder via `@unveiled/images/offline` (design Decision 1)
- [x] 1.2 Inventory NULL `partners.logo_image_id` paths: schema, `createPartner` / `updatePartner` / `replacePartnerLogo`, admin create/edit routes + forms, seed/fixtures, TypeScript `| null` logo call sites

## 2. Domain and schema

- [x] 2.1 Enforce required prebuilt (or exclusive logo source) on `createPartner`; reject missing/incomplete logo without inserting a partner row; mirror event primary-image cleanup on failed create if needed
- [x] 2.2 Ensure `updatePartner` / `replacePartnerLogo` are replace-only — never write NULL; omit new logo ⇒ keep existing id
- [x] 2.3 Implement Bun/scripts-safe backfill for NULL logo rows (offline solid five-WebP set + `images` row + attach); never import `@unveiled/images/offline` into Workers route graphs
- [x] 2.4 Set `logoImageId` `.notNull()` in Drizzle schema; `bun run db:generate` and land migration that backfills then applies `NOT NULL`

## 3. Admin UI and seed

- [x] 3.1 Partner create: require logo / prebuilt variants; minimum client guard so create does not submit without a processed logo; server still rejects if bypassed
- [x] 3.2 Partner edit: keep current logo when no file; remove any clear-logo control; replacement uses same prebuilt WebP path
- [x] 3.3 Update `seed:demo` / fixtures so every partner has a non-null logo with five WebP variants (or `skipUpload` in tests as today)
- [x] 3.4 Fix TypeScript optional chains / `| null` assumptions for `logoImageId` now that the column is required (keep broken-URL empty states only)

## 4. Verification and handoff

- [x] 4.1 Migrate on a branch DB — zero NULL logos remain; constraint applies
- [x] 4.2 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 4.3 Manual: create without logo rejected; create with WebP variants succeeds; edit without new file keeps existing logo; spot-check event image-required still works
- [x] 4.4 Mark step 02 done in `image-pipeline-parent-guide.md`; leave Gherkin/product SoT rewrites for step 04
