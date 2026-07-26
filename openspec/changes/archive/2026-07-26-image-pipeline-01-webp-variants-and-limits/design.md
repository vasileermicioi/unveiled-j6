## Context

Parent feature: Image pipeline (`.dev-plan/current-iteration/image-pipeline-parent-guide.md`). This is child step 01 — first increment; no prior child dependency.

Today `@unveiled/images` accepts JPEG/PNG/WebP only, enforces **800×420** and **8 MB**, stores **six JPEGs** including near-lossless `original.jpg`, and admin forms POST those `.jpg` multipart fields. Consumers (`buildVariantUrl`, SEO, cards, seed, offline packs) hardcode `*.jpg`. Generation is browser-side Pica; server validates/stores prebuilt bytes only (no Workers resize / no `sharp` / no `@standardagents/sip`).

Constraints: business logic in `@unveiled/images` (not routes); admin mutations remain SSR multipart POST; HeroUI chrome + native `input type="file"`; SVG must be rasterized client-side and never stored raw; product SoT rewrite deferred to step 04; OpenSpec `image-uploads` is the planning contract for this increment.

## Goals / Non-Goals

**Goals:**

- Five WebP variant filenames as the sole product set; drop `original` / source master.
- Client: decode any browser-loadable image (incl. SVG) → Pica resize → WebP encode; upload only the five variants.
- Remove 800×420 and 8 MB product gates from client + prebuilt validation; document any remaining proxy abuse caps.
- Server: validate complete WebP set, Content-Type `image/webp`, OG exactly 1200×630, ladder caps + non-upscale vs claimed/source dims.
- Update admin multipart field names/`accept`, all `.jpg` URL call sites, seed/offline fixtures, package tests.
- Ship or explicitly defer R2 JPEG→WebP migration per Decision 6.

**Non-Goals:**

- Partner `logo_image_id` NOT NULL / backfill (step 02).
- Variant preview gallery UI and submit-guard UX polish / WebP-unsupported messaging (step 03).
- Canonical `docs/product/` / BDD / DEPLOYMENT narrative rewrite (step 04) — only minimal comments if implementers are blocked.
- Changing ladder width targets (1920 / 1280 / 640 / 320 / OG 1200×630).
- Worker-side resize; storing or serving raw SVG from the bucket.
- Content moderation / virus scanning.

## Decisions

1. **Variant set = five WebP files, no original**
   - **Choice:** `VARIANT_FILENAMES` = `hero-1920.webp`, `large-1280.webp`, `medium-640.webp`, `small-320.webp`, `og-1200x630.webp`. Remove `ORIGINAL_*` generation and `original.jpg` multipart field.
   - **Rationale:** Matches parent user-visible value; smaller storage; no source-format leak (esp. SVG).
   - **Alternatives:** Keep original as WebP master — rejected by parent; keep six JPEG — status quo.

2. **Source acceptance = decode-success, not MIME allowlist**
   - **Choice:** Client `accept="image/*"` plus `.svg` as needed for OS pickers. Decode via existing Image/`createImageBitmap` path (extend for SVG). Fail only on undecodable/encode failure. Server prebuilt path still requires WebP magic / RIFF WebP (or equivalent), not “any MIME.”
   - **Rationale:** Parent contract; picker UX; server never trusts claimed MIME for stored objects.
   - **Alternatives:** Fixed MIME allowlist including `image/svg+xml` — brittle across browsers; accept SVG on server — security risk.

3. **SVG security: rasterize in browser only**
   - **Choice:** Never POST or PUT raw SVG (or other source bytes) to R2. Pipeline is decode → canvas → WebP blobs → multipart prebuilt fields only.
   - **Rationale:** Parent open risk; avoids XSS if public CDN served SVG.
   - **Alternatives:** Sanitize SVG server-side — out of scope / Workers cost.

4. **Remove product min-dimension and 8 MB gates; keep practical proxy abuse guard**
   - **Choice:** Delete enforcement of `MIN_IMAGE_WIDTH` / `MIN_IMAGE_HEIGHT` / product `MAX_UPLOAD_BYTES` from client validate and `validatePrebuiltVariants`. For remote-fetch proxy, replace the product 8 MB reject with a documented abuse/DoS cap (e.g. keep a large hard ceiling such as 32 MB or existing timeout+byte accumulation — pick one constant named `REMOTE_FETCH_MAX_BYTES` distinct from product upload limits) so SSRF/proxy cannot stream unbounded bodies.
   - **Rationale:** Step brief: no product gates; proxy still needs a safety bound.
   - **Alternatives:** No proxy byte cap — DoS risk; keep 8 MB as silent product gate — violates acceptance.

5. **Prebuilt validation without `original.jpg`**
   - **Choice:** Require `claimedWidth` / `claimedHeight` from the client (decoded source size) for ladder non-upscale checks. Parse each WebP variant’s dimensions (add WebP dimension helper; retire JPEG-only checks for the prebuilt path). Enforce: all five present; WebP; each ladder width ≤ its max; ladder width/height ≤ claimed source; OG exactly 1200×630. Persist metadata width/height from claimed source (or max ladder dims if claim missing — prefer reject if claim missing for admin path).
   - **Rationale:** Non-upscale still meaningful without storing a master; client already knows decode size.
   - **Alternatives:** Infer source from largest ladder variant — weaker (could hide upscales); keep storing original solely for validation — contradicts drop-original goal.

6. **Existing R2 JPEG migration: one-shot offline re-encode in this step**
   - **Choice:** Prefer parent’s primary option: offline script that, for each `images.id`, downloads the largest available JPEG (prefer `original.jpg` then `hero-1920.jpg` …), regenerates five WebP variants (Node/Bun offline path already used for seed bake), uploads WebP keys, deletes old `.jpg` keys. Document runbook in package README / brief note for step 04 DEPLOYMENT sync. If staging ops blocks running the script before merge, land the script + mark parent Risks “migration pending run” rather than silently choosing re-upload-on-edit.
   - **Rationale:** Avoids stale public `.jpg` URLs after consumer cutover; parent preferred approach.
   - **Alternatives:** Re-upload on next admin edit only — cheaper, leaves broken/stale URLs until edit; defer script entirely to step 04 — acceptable only if recorded in parent Risks.

7. **Quality / encode constants**
   - **Choice:** Keep ladder width/OG geometry constants; replace JPEG quality constants with WebP quality numbers in the same ballpark (hero/large/medium/small/og). Encode via `canvas.toBlob('image/webp', quality)` (or Pica to-canvas then toBlob). Fail generation if WebP encode unsupported (clear error; polished messaging in step 03).
   - **Rationale:** Minimal behavioral change beyond format; admin already JS-required.
   - **Alternatives:** Lossless WebP — larger objects; server re-encode — out of scope.

8. **Seed / offline packs**
   - **Choice:** Regenerate `*.variants` packs as five WebP files (naming/layout aligned with new `VARIANT_FILENAMES`). Update bake scripts and seed upload to post WebP. Source fixture JPEGs under `public/images/seed/**` may remain as decode inputs; stored/uploaded objects are WebP.
   - **Rationale:** Demo/staging must match production keys after cutover.
   - **Alternatives:** Generate WebP at seed time only without committing packs — slower CI/seed.

## Risks / Trade-offs

- **[Risk] Legacy R2 `.jpg` URLs break after consumer cutover** → Mitigation: Decision 6 migration script; staging run before/with deploy; note residual keys in parent Risks.
- **[Risk] SVG/scripted content if ever stored raw** → Mitigation: never upload source bytes; only WebP variants.
- **[Risk] WebP dimension parsing incomplete for exotic files** → Mitigation: use a small reliable parser or canvas/offline decode in tests; reject undecodable prebuilt variants.
- **[Risk] Undersized sources look soft at large breakpoints** → Mitigation: accepted product trade-off; non-upscale still caps ladder to source size.
- **[Risk] Remote proxy abuse without 8 MB product gate** → Mitigation: explicit `REMOTE_FETCH_MAX_BYTES` + timeout (Decision 4).
- **[Trade-off] OpenSpec delta vs product SoT** → Planning contract ships here; `docs/product/extras/image-uploads.md` and related event-catalog narrative update in step 04.
- **[Trade-off] Claimed dimensions trust on server** → Admin-only trusted path; still verify each variant is WebP and within caps; reject missing claims.

## Migration Plan

1. Land code + regenerated seed packs; deploy Workers with `.webp` URL helpers.
2. Run offline R2 migration script against staging (then production) for existing `images` rows; delete `.jpg` keys after WebP upload succeeds per id.
3. Re-seed demo if fixtures changed (`bun run seed:demo` / bake scripts as documented).
4. Rollback: revert app to `.jpg` helpers only if bucket still has JPEGs; if migration already deleted JPEGs, restore from backup or re-run generator from retained largest source — prefer migrating in a two-phase (upload WebP, flip app, then delete JPEG) when possible.

## Open Questions

- None blocking artifact authoring. Staging may still choose “defer migration run” after the script lands — record that in parent Risks during Cleanup, not as a new product decision.
