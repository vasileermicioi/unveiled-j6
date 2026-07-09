## Why

Steps 01–03 delivered JPEG variants, sip processing, and Workers-native admin uploads, but operator docs, e2e guidance, seed/demo notes, and some agent/plan copy still describe Option B (sharp / local Node only). This final step aligns docs, seed, and regression coverage with the shipped Workers+sip path so the team stops following obsolete instructions and the parent feature can close.

## What Changes

- Rewrite remaining Option B / sharp / “Workers cannot upload” guidance in `AGENTS.md`, `apps/web/DEPLOYMENT.md`, `packages/images/README.md` (as needed), `e2e/README.md`, and misleading hosting lines in `.dev-plan/IMPLEMENTATION-PLAN.md`.
- Document **re-seed or re-upload** for legacy R2 `.webp` keys / DB image rows after the JPEG filename migration; no automatic migration job.
- Ensure `bun run seed:demo` uses `@unveiled/images` (sip) and writes the six `.jpg` keys.
- Add/adjust unit, catalog, and Playwright admin image coverage so Workers-unfriendly assumptions are gone and JPEG filenames are asserted; keep verification runnable without production credentials where possible.
- Confirm `docs/migration/extras/gaps-and-decisions.md` step-01 JPEG row is complete; record residual known gaps (e.g. EXIF orientation, JPEG payload size) in the parent guide or gaps log.
- Mark step 04 and the parent feature complete in `workers-sip-images-parent-guide.md` once release criteria are checked.

**Out of scope:** Cloudflare Images product; reopening WebP vs JPEG; automatic orphaned-`.webp` cleanup; new admin image-management UI.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `platform-foundation`: Operator documentation SHALL describe `@standardagents/sip` on Cloudflare Workers as the supported upload path (JPEG variants + re-seed/re-upload after WebP/sharp), not Option B local-only uploads.
- `event-catalog`: `bun run seed:demo` SHALL populate catalog images through `@unveiled/images` with six `.jpg` variant URLs viewable on Workers without a separate local upload pass.

## Impact

- **Docs:** `AGENTS.md`, `apps/web/DEPLOYMENT.md`, `e2e/README.md`, `packages/images/README.md`, `.dev-plan/IMPLEMENTATION-PLAN.md`, parent guide, optionally `docs/migration/extras/gaps-and-decisions.md`.
- **Seed:** `scripts/seed-demo.ts` and any catalog seed helpers that still assume WebP/sharp.
- **Tests:** `packages/images` unit tests; catalog integration tests; Playwright admin image specs under `e2e/`.
- **Ops:** Staging may need manual re-seed/re-upload for old `.webp` objects; staging smoke remains a checklist item.
- **Runtime code:** Prefer doc/test/seed fixes only; no new processing architecture (sip already shipped in steps 02–03).
