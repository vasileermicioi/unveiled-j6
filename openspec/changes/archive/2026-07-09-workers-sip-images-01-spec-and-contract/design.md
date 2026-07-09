## Context

Parent feature: Workers-native image processing with `@standardagents/sip` (see `.dev-plan/current-iteration/workers-sip-images-parent-guide.md`). Today `@unveiled/images` uses `sharp` to emit six WebP files (`VARIANT_FILENAMES` + `ContentType: image/webp`). Sip only encodes JPEG, so the public contract must flip to six `.jpg` objects **before** the processor swap. This step is contract + docs + call-site strings; processing may still use sharp temporarily.

Canonical product behavior lives in `docs/migration/` (especially `extras/image-uploads.md`). OpenSpec deltas here are the planning contract for archive sync.

## Goals / Non-Goals

**Goals:**

- One agreed JPEG variant contract: filenames, MIME type, dimensions/quality ladder unchanged.
- Migration docs and gaps log no longer describe WebP-only or “sharp requires Node / Option B” as the target architecture.
- `@unveiled/images` public constants and consumers (`apps/web`, `packages/ui`) use `.jpg` filenames.
- Local `bun run dev` uploads remain usable by encoding JPEG via sharp if that is a small change.

**Non-Goals:**

- Introducing `@standardagents/sip` or WASM bundling (step 02–03).
- Removing `IMAGE_PROCESSING_UNAVAILABLE` Workers upload guards (step 03).
- Full `DEPLOYMENT.md` / e2e / seed rewrite (step 04).
- Cloudflare Images product; dual WebP+JPEG forever; changing the six-slot ladder or 800×420 / 8 MB rules.

## Decisions

### 1. JPEG filenames as the universal convention

- **Choice:** `original.jpg`, `hero-1920.jpg`, `large-1280.jpg`, `medium-640.jpg`, `small-320.jpg`, `og-1200x630.jpg`; Content-Type `image/jpeg`.
- **Rationale:** Sip cannot emit WebP; filenames stay a fixed convention (never stored per row); URL shape remains `{IMAGE_PUBLIC_BASE_URL}/images/{imageId}/{filename}`.
- **Alternatives:** Keep WebP and abandon sip / use Cloudflare Images — rejected by parent guide.

### 2. Docs first, then constants, then call sites

- **Choice:** Rewrite `image-uploads.md` §1–2 and §7 hosting note; append gaps-and-decisions row; update `constants.ts` + README; grep-fix hard-coded `.webp` variant strings in app/packages/tests.
- **Rationale:** Product source of truth is `docs/migration/`; code must match so step 02 implements against one surface.
- **Alternatives:** Constants-only without migration docs — rejected (agents would reopen WebP).

### 3. Temporary sharp JPEG encode (preferred)

- **Choice:** Switch `process.ts` from `.webp({ quality })` to `.jpeg({ quality })` and set S3 `ContentType` to `image/jpeg` in this step; do **not** add sip.
- **Rationale:** Keeps main usable between PRs; unit tests assert dimensions by filename keys.
- **Alternatives:** Constants-only leaving generation broken until step 02 — acceptable fallback if encode change is risky; prefer JPEG sharp path.

### 4. Light hosting doc touch only

- **Choice:** Update `image-uploads.md` runtime note to name `@standardagents/sip` on Workers + local Node; only light wording in `AGENTS.md` / `DEPLOYMENT.md` if needed; full Option B removal in step 04.
- **Rationale:** Avoid scope creep into release hardening while still killing “WebP-only / Node-only sharp” as the documented target.

### 5. No dual-format serving

- **Choice:** After constants land, code only builds `.jpg` URLs; existing staging WebP objects are broken until re-seed/re-upload (step 04 documents this).
- **Rationale:** Parent release criteria forbid dual WebP/JPEG forever.

## Risks / Trade-offs

- **[Broken staging thumbnails]** Existing `.webp` objects no longer match URLs → Mitigate: note in gaps/DEPLOYMENT light touch; step 04 owns re-seed guidance.
- **[JPEG payload size]** Larger than WebP at similar quality → Accept for now; quality tweak deferred to step 04 if needed.
- **[Partial sharp→JPEG without sip]** Temporary dual-story (sharp still in tree, docs say sip target) → Accept; step 02 removes sharp.
- **[Missed hard-coded `.webp`]** SEO/admin/ui strings left behind → Mitigate: verification `rg` in tasks; update unit tests.

## Migration Plan

1. Land docs + constants + call sites + optional sharp JPEG encode on a feature branch.
2. Run `bun run typecheck`, `bun run lint`, `cd packages/images && bun test`.
3. After merge: new uploads write `.jpg`; old objects need re-seed/re-upload before demos (step 04).
4. Rollback: revert PR (constants + docs); staging may already have mixed objects — prefer forward re-seed.

## Open Questions

- None blocking this step. EXIF orientation and OG cover-crop via sip are owned by step 02.
