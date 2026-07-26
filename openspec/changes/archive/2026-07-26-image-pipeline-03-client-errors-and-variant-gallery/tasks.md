## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/image-pipeline-03-client-errors-and-variant-gallery.md`, parent guide, and this change’s proposal/design/specs
- [x] 1.2 Confirm five WebP filenames (`VARIANT_FILENAMES`) and required-partner create behavior from steps 01–02; skim Discover/featured tile spacing for gallery cues only

## 2. Copy and error mapping

- [x] 2.1 Add/refresh de/en admin copy keys: required event image, undecodable, WebP unsupported, incomplete variants, processing-in-progress block; refresh stale JPEG/800×420/8 MB hint and generic processing strings
- [x] 2.2 Harden `mapClientImageError` (or sibling classifier) to map generator/proxy failures to those localized keys — prefer stable codes if cheap, else known message match + generic fallback

## 3. Variant gallery

- [x] 3.1 Add `AdminImageVariantGallery` rendering five labeled tiles from blobs (object URLs, revoked on change/unmount) or from `imageId` via `buildVariantUrl`
- [x] 3.2 Add theme/layout classes for the gallery under existing admin form patterns (bordered tiles on yellow page; Tailwind layout only)
- [x] 3.3 Wire gallery into `EventImageUpload` / `PartnerLogoUpload` for `ProcessedAdminUpload` and for existing `currentImageId` / `currentLogoImageId`; pass ids from create/edit routes; remove sole reliance on single `currentImageUrl` / `currentLogoUrl` thumb where superseded
- [x] 3.4 Smoke-check gallery-add multiple mode: per-item or compact summary tiles without breaking indexed multipart fields

## 4. Submit guards

- [x] 4.1 Expand event create/edit submit capture: block when required image missing (create), `error`/`processing`, or file selected with incomplete variants; show localized errors on every block
- [x] 4.2 Keep partner create/edit aligned (required logo on create; edit may keep existing); ensure gallery-add blocks empty/incomplete/processing submits with localized copy
- [x] 4.3 Confirm edit flows still submit other fields when keeping an existing valid image with no new file

## 5. Verification and handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Manual: create event with corrupt/non-image → error shown, submit blocked; create partner omit logo → error shown, submit blocked
- [x] 5.3 Manual: edit event with existing image → five labeled variant tiles before any new file; successful process → gallery updates to blob previews of the five WebP sizes
- [x] 5.4 Sanity: server still rejects tampered incomplete POSTs
- [x] 5.5 Mark step 03 done in `image-pipeline-parent-guide.md`; list any new copy keys for step 04 i18n inventory update
