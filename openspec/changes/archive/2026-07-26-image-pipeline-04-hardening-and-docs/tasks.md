## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/image-pipeline-04-hardening-and-docs.md`, parent guide, and this change’s proposal/design/specs
- [x] 1.2 Diff shipped runtime (five WebP, required logo, client errors, gallery) against `docs/product/extras/image-uploads.md` and admin feature files; confirm steps 01–03 stay marked done

## 2. Product SoT docs

- [x] 2.1 Rewrite `docs/product/extras/image-uploads.md` for five WebP (no original), decode-success acceptance incl. SVG rasterize, removed 800×420 / 8 MB product gates, required event + partner images, client errors that block submit, variant preview gallery, gallery photos on same pipeline
- [x] 2.2 Update `docs/product/database/schema-overview.md` image-pipeline notes and `partners.logo_image_id` to five WebP + NOT NULL required logo
- [x] 2.3 Update `docs/product/features/admin-events.feature` (and discovery only if it claims JPEG) from six JPEG → five WebP; keep primary image required
- [x] 2.4 Update `docs/product/features/admin-partners.feature` so create requires logo (drop optional-logo / omit-both happy paths)
- [x] 2.5 Log WebP cutover / required logo / client errors / gallery in `docs/product/extras/gaps-and-decisions.md` (mark six-JPEG / optional-logo rows superseded, do not erase history)
- [x] 2.6 Sync step 03 admin copy keys into `docs/product/extras/content-i18n-inventory.md`; list variant gallery in `ui-component-map.md` / `docs/COMPONENTS.md` if those inventories catalog admin islands

## 3. Deployment and migration

- [x] 3.1 Update `apps/web/DEPLOYMENT.md` current-procedure image sections: Pica → five WebP, JS required, no sip, seed/R2 layout `.webp`, remove JPEG-only / 800×420 demo instructions
- [x] 3.2 Confirm residual R2 JPEG→WebP migration: run `bun scripts/migrate-r2-jpeg-to-webp.ts` (dry-run first) when credentials allow, **or** park explicitly in parent Risks + DEPLOYMENT with owner — do not add JPEG URL fallbacks in app code

## 4. E2E and coverage

- [x] 4.1 Update `e2e/specs/admin-events.spec.ts` / fixtures for WebP assertions and five-variant contract (proximity selectors only; keep R2 env-skip)
- [x] 4.2 Update `e2e/specs/admin-partners.spec.ts` / fixtures so create happy paths require logo and assert WebP logo URLs; align coverage-matrix rows/titles
- [x] 4.3 Touch `e2e/README.md` notes only where they still claim six JPEG variants as product behavior (keep “six R2 env vars” if that means infrastructure var count)

## 5. Verification and close-out

- [x] 5.1 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.2 Run `cd packages/images && bun test` (exit 0)
- [x] 5.3 Doc grep touched SoT paths: no remaining current-rule claims for “six JPEG”, `original.jpg`, “800×420”, or “partners optional logo” (historical superseded changelog lines OK)
- [x] 5.4 Targeted e2e for admin event image required + partner logo required when R2 env present (otherwise document skip)
- [x] 5.5 Walk parent **Release Criteria**; mark step 04 + parent feature done in `image-pipeline-parent-guide.md`; resolve or park parent open questions
