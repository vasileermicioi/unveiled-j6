## 1. Inventory & staging contract

- [x] 1.1 Trace primary-image lifecycle on failed create/edit/series: parse → persist/attach → insert/update → delete-on-error → catch → `formValuesToDefaults` / edit overwrite of `currentImageId`
- [x] 1.2 Define staging contract: complete prebuilt set → persist early (route or catalog); thread `imageId`; create/series accept existing staged id without five File fields; do not delete staged image on unrelated insert/validation failure
- [x] 1.3 Confirm exclusive-source rules when both a new complete prebuilt set and a staged `imageId` are present (new prebuilt wins / creates new id)

## 2. Catalog & form defaults

- [x] 2.1 Adjust `createEvent` / `createEventSeries` (and helpers) so retry-friendly staging does not delete a usable staged primary on unrelated failure; accept attach-by-existing-`imageId` on create/series
- [x] 2.2 Ensure edit/update path stages replacement on failure without deleting the new image; previous-image cleanup remains on successful replace only
- [x] 2.3 Extend `EventFormValues` / parsers / `toCreateEventInput` (and series/update) so staged `imageId` without variant Files is accepted
- [x] 2.4 Update `formValuesToDefaults` to pass `currentImageId` (+ `imagePublicBaseUrl`) from staged/prebuilt id instead of hard-nulling
- [x] 2.5 Fix create/edit/series POST catch blocks: create/series use staged defaults; edit prefers newly staged replacement over previous DB `currentImageId`

## 3. EventImageUpload island

- [x] 3.1 Show variant gallery on create/series when `currentImageId` is set and no new processed blobs (same preview path as edit existing)
- [x] 3.2 Emit hidden `imageId` (staged) on resubmit when showing staged gallery; treat staged id as satisfying required-image client checks on create
- [x] 3.3 Keep “choose new file → re-process → replace staged preview” behavior intact

## 4. Tests & product docs

- [x] 4.1 Add/adjust R2-free unit/integration tests for defaults/staging wiring and createEvent not deleting staged image / accepting staged id on retry
- [x] 4.2 Update `docs/product/extras/image-uploads.md` with retention-across-failed-submit behavior (orphan note unchanged / non-blocking)
- [x] 4.3 Add Gherkin scenarios to `docs/product/features/admin-events.feature` for create/edit (and series if covered) image retention on error
- [x] 4.4 Update `docs/product/extras/gaps-and-decisions.md` only if orphan-rate callout needs a decision row

## 5. Verification & handoff

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run focused staging/defaults (and related catalog) tests (exit 0)
- [ ] 5.3 Manual smoke: `/admin/events/new` → process image → deliberate validation error → error + five-variant preview → fix field → submit succeeds without re-choosing file; spot-check edit replacement and series if practical
- [x] 5.4 Mark step 03 done and feature releasable in `.dev-plan/current-iteration/event-form-polish-parent-guide.md`; prepare PR/handoff linking `event-form-polish-03-retain-images-on-error`
