## 1. Setup

- [x] 1.1 Read `workers-sip-images-parent-guide.md` and this change’s proposal/design/specs end-to-end
- [x] 1.2 Confirm current `VARIANT_FILENAMES` and `docs/migration/extras/image-uploads.md` §1–2 still describe WebP

## 2. Migration docs

- [x] 2.1 Rewrite `docs/migration/extras/image-uploads.md` for six JPEG variants (`*.jpg`, `image/jpeg`), keep dimensions/quality ladder and validation rules, replace §7 sharp/Node note with `@standardagents/sip` on Cloudflare Workers (and local Node)
- [x] 2.2 Append a decision row to `docs/migration/extras/gaps-and-decisions.md` recording the WebP→JPEG reopen (sip Workers constraint)
- [x] 2.3 Light-touch only: if `AGENTS.md` or `apps/web/DEPLOYMENT.md` still claim WebP-only as the target contract, adjust wording without doing the full step-04 rewrite

## 3. `@unveiled/images` contract

- [x] 3.1 Change `packages/images/src/constants.ts` `VARIANT_FILENAMES` to `*.jpg`
- [x] 3.2 Update `packages/images/README.md` storage layout and variant table for JPEG
- [x] 3.3 Prefer switching sharp encode in `process.ts` from `.webp()` to `.jpeg({ quality })` and S3 `ContentType` to `image/jpeg` so local uploads match new filenames (do **not** add `@standardagents/sip`)
- [x] 3.4 Fix `packages/images` unit tests for JPEG output / `.jpg` filename keys

## 4. Call-site string updates

- [x] 4.1 Update hard-coded `.webp` variant filenames in `apps/web` (admin routes, catalog mappers, SEO)
- [x] 4.2 Update `@unveiled/ui` image URL helpers to `.jpg` variants
- [x] 4.3 Grep `packages/db`, e2e, and seed docs for remaining variant `.webp` references and update (allow historical `openspec/changes/archive/` mentions)

## 5. Validation

- [x] 5.1 Run `rg -n "\\.webp|original\\.webp|hero-1920\\.webp" packages/images apps/web packages/ui packages/db docs/migration/extras/image-uploads.md` — no remaining variant filename references (archive/openspec history OK)
- [x] 5.2 Run `bun run typecheck` and `bun run lint`
- [x] 5.3 Run `cd packages/images && bun test`
- [x] 5.4 Spot-check `buildVariantUrl(..., "small-320.jpg")` (and siblings) in admin list/edit routes

## 6. Cleanup

- [x] 6.1 Mark step 01 done in `workers-sip-images-parent-guide.md` when this change is merged
