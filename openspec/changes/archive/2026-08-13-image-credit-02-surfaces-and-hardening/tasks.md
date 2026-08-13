## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/02-image-credit-02-surfaces-and-hardening.md`, parent guide release criteria / non-goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm step 01 is merged: `images.credit` exists; `updateImageCredit` / `getImageCredit` / `PersistImageOptions.credit` work; `EventGalleryImageRow.credit` is joined; no admin fields or public captions yet

## 2. Admin credit fields

- [x] 2.1 Add `getAdminCopy` keys: `imageCreditLabel` (DE Bildnachweis / EN Image credit), `imageCreditHint` (DE “z. B. Foto: Name” / EN “e.g. Photo: Name”); optional gallery-manage hint that Save order also saves credits
- [x] 2.2 Add optional HeroUI `TextField` to `EventImageUpload` (`name="image_credit"`, `maxLength={200}`, `defaultValue` from `currentCredit`) after the file picker / variant gallery; gallery `multiple`: one field per processed file `name={`image_credit_${index}`}` next to that file’s compact preview
- [x] 2.3 Add the same single-file field to `PartnerLogoUpload` (`name="image_credit"`, `currentCredit` from edit defaults)

## 3. Parse and persist (partner, event, gallery add)

- [x] 3.1 Parse `image_credit` in `parsePartnerFormBody` / `parseEventFormBody`; round-trip on error re-render; add `logoCredit` / `imageCredit` to partner and event create/update inputs
- [x] 3.2 New persist (prebuilt): pass `credit` on attach/replace options. Keep current id or staged-id retry: `updateImageCredit` on that id (import `@unveiled/db/catalog/images` from server routes only). Replace with omitted credit → new row NULL
- [x] 3.3 Gallery add POST: zip `image_credit_${i}` with `parsePrebuiltImageVariantSets` order into `persistPrebuiltImage(..., { credit })`
- [x] 3.4 Unit-test parsers and route helpers for credit extract / round-trip / omit

## 4. Gallery manage

- [x] 4.1 Pass `credit` into `AdminGalleryManagerItem`; show stored credit under thumbs (omit line when empty); per-tile `TextField` `name={`image_credit_${imageId}`}` inside the save-order form (stop drag on the field)
- [x] 4.2 Gallery list POST: keep reorder; then `updateImageCredit` per posted `image_credit_<uuid>`; enable submit when order **or** any credit is dirty

## 5. Public captions

- [x] 5.1 Map `row.credit` onto `PublicEventGalleryImage.credit` in `toPublicEventGalleryImages`; update `public-event-gallery.test.ts`
- [x] 5.2 Event detail route: `getImageCredit` for hero and partner logo (same `Promise.all`); pass `heroCredit` and `partnerAttribution.logoCredit`
- [x] 5.3 `EventDetailPage`: caption under primary hero when non-empty; muted DETAILS logo caption when `logoCredit` non-empty. `EventGallerySlider`: lightbox caption when `active.credit` non-empty (not on thumbs). Render stored string as-is. Theme classes in `globals.css` only (muted/foreground tokens)
- [x] 5.4 Ladle: EventDetailPage story with credited hero and one credited gallery image still renders; optional `logoCredit` on partner attribution

## 6. Gherkin, Playwright, canonical docs

- [x] 6.1 Gherkin exact titles: `admin-events.feature` — `Event primary credit on create`, `Keep existing image and edit credit`, `Gallery photo credit on add`; `admin-partners.feature` — `Partner logo credit without replacing the file`; `event-discovery.feature` — `Hero shows credit`, `Gallery photo credit in lightbox`, `Empty credit omitted`, `Cards omit credit`
- [x] 6.2 Playwright: `adminLabels.imageCredit`; optional `imageCredit` on create helpers; tests with verbatim `test("Scenario: …")`; proximity selectors; R2 skip when upload or public image URLs are required
- [x] 6.3 Update `docs/product/extras/image-uploads.md`, `docs/product/ui/ui-component-map.md` (Event detail + Events/Partners admin), `docs/product/testing/coverage-matrix.md`; confirm `schema-overview.md` `images.credit` row is accurate

## 7. Verification & handoff

- [x] 7.1 Run `bun run typecheck` and `bun run lint` — exit 0. `cd packages/db && bun test` — exits 0
- [x] 7.2 Manual: set credit → caption; clear credit → caption gone; replace image without typing credit → old credit gone; cards still omit credit
- [x] 7.3 Mark step 02 done and the feature released in `.dev-plan/current-iteration/02-image-credit-parent-guide.md`. Confirm canonical product specs match shipped behavior
