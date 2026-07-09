## 1. Setup

- [x] 1.1 Confirm step 02 sip pipeline works under `bun run dev` (admin upload or `packages/images` tests already green)
- [x] 1.2 Inspect `@standardagents/sip` package exports (`workerd` → `dist/workerd.js` + `sip.wasm`) and current `apps/web/vite.config.ts` / `wrangler.toml` sharp + `@unveiled/images` external rules

## 2. Workers bundling

- [x] 2.1 Stop externalizing `@unveiled/images` from the Cloudflare `build()` plugin and remove obsolete `sharp` from SSR `external`, `optimizeDeps.exclude`, and related Vite overrides
- [x] 2.2 Ensure the Workers build resolves sip’s `workerd` export and emits/loads `sip.wasm` (Vite asset handling and/or Wrangler `rules` as needed)
- [x] 2.3 Run `bun run build` and confirm the Worker bundle references sip/wasm without unresolved `sharp`; fix runtime import errors (`process.report`, missing wasm, wrong export condition) via `dev:workers` if needed

## 3. Remove Option B guards

- [x] 3.1 Replace `loadImagesModule()` dynamic import in `packages/db/src/catalog/images.ts` with a static `@unveiled/images` import; delete `IMAGE_PROCESSING_UNAVAILABLE` throw path
- [x] 3.2 Remove `IMAGE_PROCESSING_UNAVAILABLE` from `packages/db/src/catalog/errors.ts` and from admin error mapping/copy in `apps/web/app/lib/admin-route.ts` and `apps/web/app/lib/admin-content.ts`
- [x] 3.3 Confirm `rg -n "IMAGE_PROCESSING_UNAVAILABLE|Image processing is not available" packages apps/web` has no matches in runtime code (docs/archive only if any)

## 4. Docs and verification

- [x] 4.1 Update `apps/web/DEPLOYMENT.md` image-processing notes so Workers uploads are the happy path (no “sharp / local-only Option B” requirement); leave broad AGENTS.md polish to step 04
- [x] 4.2 Staging smoke: admin create partner **with** logo on Workers URL → 302 success; six `.jpg` objects in R2; thumbnail on admin list
- [x] 4.3 Confirm failure modes still work: file too large, below min dimensions, both upload+URL filled
- [x] 4.4 Run `bun run typecheck` and `bun run lint` at repo root
- [x] 4.5 Mark step 03 done in `.dev-plan/current-iteration/workers-sip-images-parent-guide.md` when merged
