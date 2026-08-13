## Context

Parent feature: optional human photo credit on catalog images (`.dev-plan/current-iteration/02-image-credit-parent-guide.md`), step 02 of 02 — admin collection, public captions, Gherkin/e2e, canonical docs.

Step 01 is merged (`image-credit-01-schema-and-domain`, archived 2026-08-13):

- `images.credit` nullable text. `normalizeImageCredit` trims, empty → `NULL`, >200 → `IMAGE_CREDIT_TOO_LONG`.
- Optional `credit` on `PersistImageOptions`; persist/replace insert it on **new** rows only (replace does not copy the old row).
- `updateImageCredit` / `getImageCredit` live in `packages/db/src/catalog/images.ts` — import `@unveiled/db/catalog/images` from **server routes only** (main `@unveiled/db` barrel must not re-export `images.ts`).
- `EventGalleryImageRow.credit: string | null` already joined in `listEventGalleryImages`.

Current live surfaces (this step wires):

- `EventImageUpload` / `PartnerLogoUpload` — Pica + five WebP hidden fields; no credit input. Gallery add reuses `EventImageUpload` with `multiple` (`AdminGalleryImageVariantFields` uses `gallery[${index}].…`).
- Event/partner create/update persist via `attachImageToEvent` / `replaceEventImage` / `replacePartnerLogo` without `credit`. Keep-file / staged-id paths return the existing id and never call persist.
- Gallery add POST: `persistPrebuiltImage` per set, then `addEventGalleryImages`. Gallery manage POST: reorder `imageIds` only (`AdminEventGalleryManager`).
- Public `/:locale/events/:id` loads gallery rows + partner; `EventDetailPage` hero has no caption; `EventGallerySlider` lightbox has image + pager only; DETAILS partner logo has no caption. Compact cards omit credit (keep that).

Constraints: SSR form POST only; HeroUI-only chrome; HeroUI `TextField` for the credit **text** field (hard rule §14 — native is for choice/numeric/date/file); theme tokens for caption typography (no ad-hoc colors); i18n in `admin-content` and event-detail copy modules; Playwright titles match Gherkin verbatim; proximity selectors; R2 skip when upload is required. Product locks: column is `credit` not `source`; display stored string as-is; credit optional.

## Goals / Non-Goals

**Goals:**

- Admins can set optional credit on partner logo, event primary, and each gallery-add file.
- Keeping an existing image on partner/event edit (and staged-id retry) still updates credit via `updateImageCredit`.
- Replacing an image applies submitted credit to the **new** row only.
- Gallery manage shows credit under thumbs and saves credits on the same SSR POST as Save order.
- Public event detail captions: hero, lightbox, optional DETAILS logo; omit when empty; cards/map never show credit.
- Gherkin, Playwright, Ladle story, and canonical product docs match shipped behavior.
- Mark step 02 and the parent feature released.

**Non-Goals:**

- Credit on EventCards, map popups, admin table thumbs, OG, or JSON-LD.
- Required credit; URL validation; photographer entity.
- Changing Pica/variant pipeline, R2 layout, or `images.source` / `source_url`.
- Public partner profile page (MVP has none).
- Dedicated per-gallery-image edit page.
- Event form wizard (`03-event-form-wizard`) — inherit by putting the field on `EventImageUpload`.

## Decisions

1. **HeroUI `TextField` named `image_credit` / `image_credit_{index}`**
   - **Choice:** Optional `TextField` (not native `<input>`, not HeroUI `Select`) with `name="image_credit"` on partner logo and event primary. Gallery add: `name={`image_credit_${index}`}` aligned with `gallery[${index}].` persist order. `maxLength={200}` on the field; domain still rejects >200. Label `copy.imageCreditLabel` (DE “Bildnachweis”, EN “Image credit”); hint `copy.imageCreditHint` (DE “z. B. Foto: Name”, EN “e.g. Photo: Name”). Place immediately after the file picker / variant gallery inside `EventImageUpload` and `PartnerLogoUpload`.
   - **Rationale:** Step-plan field names; hard rule §14 allows HeroUI for text; copy matches parent guide. One component change covers event create/edit/clone **and** gallery add (`multiple`).
   - **Alternatives:** Native `<input type="text">` (allowed by the step plan, weaker chrome consistency); one credit for the whole gallery batch (rejected — parent lock is per file).

2. **Keep-file and staged-id must call `updateImageCredit`; replace passes `credit` on persist options**
   - **Choice:** Add optional `imageCredit?: string | null` to `CreateEventInput` / `UpdateEventInput` and `logoCredit?: string | null` to `CreatePartnerInput` / `UpdatePartnerInput` (empty string from the form → pass through; domain normalizes to `NULL`).
     | Path | Write |
     |---|---|
     | New persist (`imagePrebuilt` / `logoPrebuilt`) | `PersistImageOptions.credit` on attach/replace |
     | Keep current id (edit, no new file) | `updateImageCredit(db, currentId, credit)` |
     | Staged id reused on create/edit retry (`stagedImageId` equals the kept id) | `updateImageCredit` on that id (persist already happened without a second insert) |
     | Replace with new prebuilt, credit omitted/blank | new row `NULL` — do **not** copy previous |
   - Parse `image_credit` in `parseEventFormBody` / `parsePartnerFormBody`; round-trip on validation-error re-render (`defaultValue={defaults?.imageCredit ?? ""}`).
   - **Rationale:** Step 01 replace never copies credit; keep-file is the explicit `updateImageCredit` call site. Staged retry would otherwise drop a typed credit.
   - **Alternatives:** Only persist on new files (fails keep-and-edit); apply credit onto `currentImageId` inside `replaceEventImage` when there is no new source (mixes two operations; step 01 forbade it).

3. **Gallery add: zip `image_credit_{index}` onto each `persistPrebuiltImage`**
   - **Choice:** In `EventImageUpload` multiple mode, render one credit `TextField` per processed file next to that file’s compact preview (`AdminImageVariantGallerySummary` loop, or a sibling list keyed by the same index). Gallery add POST reads `image_credit_${i}` in lockstep with `parsePrebuiltImageVariantSets` order and passes `credit` into `persistPrebuiltImage`. Missing/blank → omit → `NULL`.
   - **Rationale:** Parent lock: one optional credit per file, not one for the batch. Index matches existing `gallery[${index}].` fields.
   - **Alternatives:** `gallery[${index}].credit` (more consistent with variant fields, but step plan named `image_credit_{index}` — lock the step-plan name so parsers and e2e stay obvious).

4. **Gallery manage: credit under thumbs; same POST as Save order; field names keyed by image id**
   - **Choice:** Extend `AdminGalleryManagerItem` with `credit: string | null`. Show a muted credit line under each thumb (empty → omit the line, still show the input). Per-tile `TextField` `name={`image_credit_${item.imageId}`}` **inside** the save-order `<form>` (stop drag on the field like the checkbox). POST handler: `reorderEventGalleryImages` as today, then for each posted `image_credit_<uuid>` call `updateImageCredit`. Enable the submit button when **order or any credit** is dirty. Keep button copy `gallerySaveOrderAction` (it now also saves credits — document in gallery subtitle/hint, no new dedicated page).
   - **Rationale:** Step plan: same page as Save order is acceptable; UUID keys survive drag-reorder so credits do not attach to the wrong file. Dedicated per-image page is out of scope.
   - **Alternatives:** Separate “Save credits” button (two POSTs, extra chrome); index-based names (break when order changes before submit).

5. **Public view-model: `credit: string | null` on gallery items; hero/logo loaded in the route**
   - **Choice:**
     - `PublicEventGalleryImage.credit: string | null` from `row.credit` in `toPublicEventGalleryImages` (already on the join). Empty/null → `null`; do not emit a placeholder.
     - Event detail route: `getImageCredit(db, event.imageId)` and, if `partner?.logoImageId`, `getImageCredit(db, partner.logoImageId)` in the existing `Promise.all` (or immediately after). Pass `heroCredit` into `EventDetailPage` and `logoCredit` on `EventDetailPartnerAttribution`.
     - Render stored string **as-is** in a `Paragraph size="sm"` caption. No auto-prefix `Foto:` / `Photo:`. Theme: add `.event-detail--checkout__hero-credit`, `.event-detail-gallery__credit`, `.event-detail--checkout__partner-logo-credit` in `globals.css` using existing muted/foreground tokens only (no ad-hoc hex).
     - Hero caption: directly under the primary `<img>`, inside the hero `Surface`, only when `heroCredit` is non-empty.
     - Lightbox: caption under the full image (before the pager), only when `active.credit` is non-empty. Thumbnails do not show credit.
     - DETAILS logo: muted caption under the logo `<img>` when `partnerAttribution.logoCredit` is non-empty; omit when empty or when there is no logo URL.
     - EventCards, map popups, OG, JSON-LD: unchanged (no credit).
   - **Rationale:** Parent release criteria. `getImageCredit` is the step-01 read for hero/logo so routes do not import the schema. Gallery already has the join.
   - **Alternatives:** Join credit onto `getEventById` (wider catalog change); prefix `Photo:` when the string has no colon (step plan prefers as-is).

6. **Gherkin titles are locked so Playwright can match them verbatim**

   | File | Title | Intent |
   |---|---|---|
   | `admin-events.feature` | `Event primary credit on create` | Create event, set Bildnachweis / Image credit to `Photo: Ada`; public detail shows that string under the primary image. R2 skip. |
   | `admin-events.feature` | `Keep existing image and edit credit` | Edit that event, keep the file, change credit to `Logo: Venue`; stored primary credit is `Logo: Venue`. R2 skip (create still needs upload). |
   | `admin-partners.feature` | `Partner logo credit without replacing the file` | Edit partner, keep the logo, set credit to `Logo: Venue`; stored logo credit is `Logo: Venue`. R2 skip (create needs logo). |
   | `admin-events.feature` | `Gallery photo credit on add` | Gallery add, one file, fill per-file credit `Photo: Ada`; manage list shows it. R2 skip. |
   | `event-discovery.feature` | `Hero shows credit` | Public detail, primary `images.credit` set → caption under hero equals the stored string. |
   | `event-discovery.feature` | `Gallery photo credit in lightbox` | Gallery image credit `Photo: Ada`; open lightbox → see that caption. R2 skip (gallery URLs). |
   | `event-discovery.feature` | `Empty credit omitted` | Image `credit` NULL → no credit caption on hero / that lightbox photo. |
   | `event-discovery.feature` | `Cards omit credit` | Discover or member feed EventCards do not show image credit even when the event’s primary has credit. |

   - **Rationale:** Step-plan scenarios plus keep-and-edit / gallery-add coverage from verification. Separate titles for admin write vs public read so R2 skips stay local.
   - **Alternatives:** One mega-scenario (harder R2 skip / weaker Playwright matching).

7. **E2E helpers and R2 skip**
   - **Choice:** Add `adminLabels.imageCredit` = `"Bildnachweis"` (DE admin). `createEventViaUI` / `createPartnerViaUI` gain optional `imageCredit?: string` and fill the labeled field before submit. Public tests: prefer `getByText("Photo: Ada")` near the hero / lightbox (proximity), not `data-testid`. Skip with `r2Configured()` whenever the flow creates/uploads an image or needs gallery/hero URLs. `Empty credit omitted` and `Cards omit credit` MAY use an existing demo event without a new upload; still skip if asserting visible images requires R2.
   - **Rationale:** Same pattern as barrier-free / gallery e2e. BDD contract: proximity selectors; titles verbatim.
   - **Alternatives:** DB-only `updateImageCredit` for public tests (faster, weaker — still keep at least one UI create path).

8. **Canonical docs and Ladle in this step**
   - **Choice:**
     - `docs/product/extras/image-uploads.md`: optional `images.credit`; admin fields; keep-vs-replace; public caption rules; not on cards/OG.
     - `schema-overview.md`: confirm the step-01 `credit` row (already present); no extra columns.
     - `ui-component-map.md`: Event detail hero/lightbox/optional logo captions; Events/Partners admin credit fields; gallery manage save includes credits.
     - `coverage-matrix.md`: rows for the eight titles above.
     - Ladle: extend `WithGallery` (or add `WithImageCredit`) so hero + one gallery item have `credit: "Photo: Ada"`; partner attribution MAY include `logoCredit`. `public-event-gallery.test.ts` maps `row.credit` through.
   - **Rationale:** Parent release criteria. Wizard inherit is automatic once `EventImageUpload` has the field.

9. **Over-length credit on admin POST**
   - **Choice:** `maxLength={200}` on the `TextField`. If a crafted POST still exceeds 200, `mapCatalogError` surfaces `IMAGE_CREDIT_TOO_LONG` on the same SSR error form (existing catalog-error mapping; add a copy key if the generic fallback is opaque). Do not add a new client-only validator beyond maxlength.
   - **Rationale:** Domain already rejects; HTML maxlength covers honest users.
   - **Alternatives:** Client JS block (duplication); ignore over-length (would 500).

## Risks / Trade-offs

- **[Risk] Staged-id retry drops credit** → Mitigation: always `updateImageCredit` when the resolved image id is reused (create staged or edit keep). Tests in `admin-event-form.test.ts` / route helpers round-trip `imageCredit`.
- **[Risk] Gallery manage credit fields outside the save form** → Mitigation: put `TextField`s inside the existing POST form; stop drag on pointerdown like the checkbox.
- **[Risk] Save-order button stays disabled when only credit changed** → Mitigation: dirty flag includes credit string comparison vs `initialItems`.
- **[Risk] Shared image ids (clone reuses `image_id`)** → Pre-existing. Updating credit on a cloned event’s primary also updates the source event’s caption. Out of scope to copy-on-clone; do not mention clone as a way to get independent credits.
- **[Risk] `getImageCredit` imports `@unveiled/db/catalog/images` on the public event route** → Acceptable: that route is already server-only. Do **not** import it from islands or `@unveiled/db` barrel.
- **[Risk] Auto-prefix temptation (`Foto:`)** → Mitigation: render as-is; hint tells admins to type the full line.
- **[Trade-off] Partner-logo caption is DETAILS-only** → Parent non-goal: no public partner profile. Empty logo credit → no caption (no “Credit:” placeholder).
- **[Trade-off] Keep Save-order button label** → Slightly dishonest once it also saves credits; cheaper than new i18n. Hint/subtitle clarifies.

## Migration Plan

1. Confirm step 01 APIs: `normalizeImageCredit`, `updateImageCredit`, `getImageCredit`, `PersistImageOptions.credit`, `EventGalleryImageRow.credit`.
2. Admin fields + copy on `EventImageUpload` / `PartnerLogoUpload`; parsers; create/update/gallery-add write paths (persist vs update).
3. Gallery manage display + save-order POST credits.
4. Public view-model + `EventDetailPage` / `EventGallerySlider` captions + theme classes.
5. Gherkin, Playwright, ui-component-map, image-uploads.md, coverage matrix, Ladle/fixtures.
6. `bun run typecheck`; `bun run lint`; `cd packages/db && bun test`; Playwright titles (R2 skip when applicable).
7. Mark step 02 done and the feature released in the parent guide.
8. **Rollback:** revert the PR. No migration. `images.credit` stays (step 01); captions and fields disappear.

## Open Questions

- None blocking. Whether to rename `gallerySaveOrderAction` to a generic “Save changes” is optional polish — default keep the existing label and document dual-save in the hint.
