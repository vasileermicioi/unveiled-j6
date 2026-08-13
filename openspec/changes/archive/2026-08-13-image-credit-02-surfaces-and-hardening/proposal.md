## Why

Step 01 stored optional `images.credit` and persist/update APIs, but nothing collects or shows it. This step closes parent feature `02-image-credit` (step 02 of 02): admins can credit partner logos, event primaries, and gallery photos; members and guests see those credits on public event detail when present.

## What Changes

- Optional credit text field next to partner logo, event primary image, and each gallery-add file (`image_credit` single; `image_credit_{index}` gallery multi). Text is HeroUI `TextField` (hard rule §14). Copy: DE **Bildnachweis** + hint “z. B. Foto: Name”; EN **Image credit** + hint “e.g. Photo: Name”.
- Create: persist credit with the new image. Edit without a new file: `updateImageCredit` (including staged-id retry). Edit with replacement: credit applies to the **new** row only; omitted credit → `NULL` (does not copy the old row).
- Gallery add: one credit input per processed file. Gallery manage: show credit under thumbs; save credits via the existing Save-order SSR POST (no dedicated per-image page).
- Public `/events/:id`: caption under the primary hero when credit is non-empty; lightbox caption for that gallery photo when non-empty; optional muted caption under the DETAILS partner logo when logo credit is non-empty. Compact EventCards and map popups: no credit. Display the stored string as-is (no auto `Foto:` / `Photo:` prefix).
- Gherkin + Playwright for set-on-create, keep-and-edit, public caption, omit-when-empty. R2 skip when an upload is required.
- Canonical docs: `image-uploads.md`, `schema-overview.md` (if still incomplete), `admin-partners.feature`, `admin-events.feature`, `event-discovery.feature`, `ui-component-map.md`, coverage matrix. Ladle EventDetailPage story with a credited hero/gallery.
- Out of scope: EventCards/map/OG/JSON-LD credits; required credit; Pica/variant pipeline; partner public profile page; renaming `images.source`.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `image-uploads`: Admin partner logo, event primary image, and gallery add/manage SHALL offer an optional credit text field (max 200). Keeping an existing image on edit SHALL still allow changing credit via SSR POST. Gallery add SHALL collect credit per file. Empty credit SHALL persist NULL and SHALL NOT render a public caption.
- `event-discovery`: Public event detail SHALL show `images.credit` as a caption under the primary hero when non-empty, and in the gallery lightbox for that photo when non-empty. Compact EventCards and map popups SHALL NOT show credit. When the partner logo has credit, DETAILS MAY show it as a muted caption under the logo; when empty, no caption.

## Impact

- **Admin UI:** `EventImageUpload`, `PartnerLogoUpload`, `AdminEventGalleryAddPage`, `AdminImageVariantGallerySummary` (per-file fields), `AdminEventGalleryManager` / list page (thumbs + save). `getAdminCopy` labels/hints. Parsers: `parseEventFormBody`, `parsePartnerFormBody`, gallery add/reorder POSTs.
- **Domain wiring:** `CreateEventInput` / `UpdateEventInput` / `CreatePartnerInput` / `UpdatePartnerInput` gain optional `imageCredit` / `logoCredit`; pass through persist/replace options; keep-file / staged-id paths call `updateImageCredit` from `@unveiled/db/catalog/images` (not the main barrel). Gallery add passes per-set `credit` into `persistPrebuiltImage`.
- **Public:** `toPublicEventGalleryImages` + `PublicEventGalleryImage.credit`; event detail route loads hero/logo credit; `EventDetailPage` hero caption; `EventGallerySlider` lightbox caption; optional partner-logo caption on DETAILS.
- **E2E / docs:** `e2e/specs/admin-events.spec.ts`, `admin-partners.spec.ts`, `event-discovery.spec.ts`; product SoT listed above; `EventDetailPage.stories.tsx` + `public-event-gallery.test.ts`.
- **Source brief:** `.dev-plan/current-iteration/02-image-credit-02-surfaces-and-hardening.md`
- **Parent:** `.dev-plan/current-iteration/02-image-credit-parent-guide.md`
- **Depends on:** `image-credit-01-schema-and-domain` (archived / done)
- **Consumed by:** closes the Image credit feature (`03-event-form-wizard` inherits the field if `EventImageUpload` already has it)
- **Verification:** `bun run typecheck`; `bun run lint`; `cd packages/db && bun test`; Playwright titles match new Gherkin (R2 skip when upload required); Ladle EventDetailPage credited story still renders
