## Why

Admin image supply already generates five WebP variants client-side, but invalid/incomplete states are only partially guarded (file chosen without ready variants; partner create missing logo). Admins still cannot reliably see each ladder size before save, and event create / error-class failures do not consistently block submit with localized copy. Closing this UX gap is the next Image pipeline slice before product SoT / BDD hardening in step 04.

## What Changes

- Harden client submit guards on event create/edit, partner create/edit, and event gallery-add so invalid/failed/incomplete/processing/required-missing image states always show a localized error and `preventDefault` on form submit (server validation remains).
- Expand error mapping for undecodable files, unsupported WebP encode, processing failures, incomplete variant sets, and missing required images (event + partner create).
- Add shared admin **resized-variant preview gallery** (`AdminImageVariantGallery` or equivalent): five labeled tiles (`hero-1920`, `large-1280`, `medium-640`, `small-320`, `og-1200x630`) for newly processed blob previews and for existing attached images via `buildVariantUrl`.
- Replace sole reliance on the single small `currentImageUrl` / `currentLogoUrl` thumb where the gallery supersedes it.
- Wire gallery into event create/edit, partner create/edit, and gallery-add (per processed item or compact multi-item summary).
- Add/extend de/en admin copy keys for new error strings; keep keys stable for step 04 i18n inventory.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `image-uploads`: Client-visible localized image errors MUST block submit; admin event/partner/gallery surfaces MUST show a five-tile resized-variant preview gallery for both newly processed uploads and already-attached images.

## Impact

- **Admin islands/components:** `EventImageUpload`, `PartnerLogoUpload`, `admin-image-variants.ts` / `mapClientImageError`, new gallery component; gallery-add multi mode smoke.
- **Admin copy:** `apps/web/app/lib/admin-content.ts` (and any inventory path used by these forms).
- **URL helpers:** `@unveiled/images` / `buildVariantUrl` for existing `imageId` tiles; edit forms need `currentImageId` (or equivalent) not only a single preview URL.
- **Theme/layout:** gallery tile grid under existing admin form patterns (HeroUI chrome; Tailwind layout only; theme borders on yellow page).
- **Unchanged this step:** product SoT / Gherkin / Playwright authorship (04); variant dimensions / crop UI; public Discover page behavior; server prebuilt validation (sanity only).
- **Source brief:** `.dev-plan/current-iteration/image-pipeline-03-client-errors-and-variant-gallery.md`
- **Parent:** `.dev-plan/current-iteration/image-pipeline-parent-guide.md`
- **Depends on:** `image-pipeline-02-partner-logo-required` (implies 01) — done
- **Consumed by:** `image-pipeline-04-hardening-and-docs`
- **Verification:** `bun run lint`; `bun run typecheck`; manual corrupt-file / missing-logo / existing five tiles / successful blob gallery updates
