## Why

Events already require a primary catalog image, but partners still allow nullable `logo_image_id` and optional logo supply on admin create/edit. Product now requires images for both surfaces; without a schema + domain cutover, admins can still create logo-less partners and staging/demo data can drift from that rule.

## What Changes

- **BREAKING:** `partners.logo_image_id` becomes `NOT NULL` after backfilling any existing NULL rows (placeholder five-variant WebP set via `@unveiled/images/offline`, preferred over deleting staging partners).
- Domain: partner create requires a complete prebuilt logo variant set; edit may replace the logo but MUST NOT clear it to empty/NULL.
- Admin UI: logo upload required on create; edit keeps the current logo unless a valid replacement is processed; no “remove logo” control.
- Demo seed / fixtures: every seeded partner has a non-null logo image id with five WebP variants (or `skipUpload` in tests as today).
- TypeScript call sites that treated logo FK as optional are tightened where the column is now required (UI empty-state initials may remain only for broken-URL edge cases, not NULL FK).
- Product/BDD/`docs/product` rewrites stay in step 04; this change updates code + OpenSpec deltas for `partner-catalog` and `image-uploads`.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `partner-catalog`: Partner logo image is required — create rejects missing prebuilt logo; `logo_image_id` NOT NULL; edit replace-only (no clear).
- `image-uploads`: Required images apply to both events (primary) and partners (logo); remove former “partners optional logo” rule; partner logo uses the same prebuilt WebP pipeline as events.

## Impact

- **Schema/DB:** `packages/db/src/schema/partners.ts`; new Drizzle migration (backfill then `NOT NULL`); `packages/db/src/catalog/partners.ts` create/update attach path.
- **Admin web:** partner create/edit routes and form components (`EventImageUpload` / partner logo wrapper); multipart parsers that currently allow omitting logo on create.
- **Seed:** `@unveiled/db` catalog seed + any demo partner fixtures without logos.
- **Consumers:** `catalog-mappers`, admin partner list logo URL helpers, TypeScript types for `Partner.logoImageId`.
- **Unchanged this step:** client error/gallery UX polish beyond minimum “create cannot submit without logo” (03); canonical product SoT / BDD / DEPLOYMENT sync (04); event gallery multi-image rules; event primary-image requirement (regression only).
- **Source brief:** `.dev-plan/current-iteration/image-pipeline-02-partner-logo-required.md`
- **Parent:** `.dev-plan/current-iteration/image-pipeline-parent-guide.md`
- **Depends on:** `image-pipeline-01-webp-variants-and-limits` (done)
- **Consumed by:** `image-pipeline-03-client-errors-and-variant-gallery`
- **Verification:** `bun run db:generate` (if needed) + migrate on branch DB; `bun run lint`; `bun run typecheck`; manual create-without-logo rejected / create-with-logo succeeds / edit without new file keeps logo
