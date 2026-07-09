## Context

Steps 01–02 locked the six JPEG contract and rewrote `@unveiled/images` on `@standardagents/sip` (module-level `sipReady = ready()`). Catalog persistence still dynamically imports `@unveiled/images` and maps any load failure to `IMAGE_PROCESSING_UNAVAILABLE` (“upload using bun run dev”). `apps/web/vite.config.ts` still treats `sharp` as an SSR/build external and lists `@unveiled/images` as external in the Cloudflare `build()` plugin — so the Worker never ships the sip pipeline.

sip `1.0.1` exposes a `workerd` export (`dist/workerd.js`) that `import`s `./sip.wasm` and instantiates it via `WebAssembly.instantiate`. The Workers build must resolve that condition export and emit the WASM asset so cold-start uploads can `await ready()` inside the isolate.

Parent sequence: this step proves deployed WASM + removes Option B guards; step 04 owns e2e/docs polish.

## Goals / Non-Goals

**Goals:**

- Production Worker bundle includes `@unveiled/images` + sip WASM with no unresolved `sharp`.
- Admin partner/event multipart uploads succeed on the Workers URL (R2 + DB) without a Node-only side path.
- Remove `IMAGE_PROCESSING_UNAVAILABLE` from runtime catalog/admin code; keep clear errors for validation, size, and R2/config failures.
- `await ready()` succeeds on the first upload in a fresh isolate (module-level ready from step 02 is enough once WASM loads).

**Non-Goals:**

- Playwright Workers e2e suite or full DEPLOYMENT/AGENTS historical rewrite (step 04).
- Separate image Worker / queue / Durable Object for processing.
- Changing R2 env vars, variant filenames, or validation rules.
- Migrating legacy `.webp` R2 objects.

## Decisions

### 1. Bundle `@unveiled/images` into the Worker (stop externalizing it)

- **Choice:** Remove `@unveiled/images` (and `sharp`) from Cloudflare `build({ external: [...] })` and from SSR `external` / `optimizeDeps.exclude`. Keep `@unveiled/images` on Vite’s transform path (`ssr.noExternal`) so workspace TS + sip resolve into the Worker graph.
- **Rationale:** Externalizing the package was an Option B workaround so Workers would not try to load sharp; with sip, the package **must** be in the bundle for uploads to work.
- **Alternatives:** Keep dynamic import + external and only ship a thin WASM stub — fails because processing code would be missing at runtime.

### 2. Prefer sip’s `workerd` export + Vite/Wrangler WASM asset rules

- **Choice:** Ensure the Workers build resolves `@standardagents/sip` via the package `"workerd"` export condition (`dist/workerd.js` + `sip.wasm`). Add Vite/Wrangler support for `.wasm` as needed (asset import or `rules` / bundler WASM handling) until `bun run build` emits a Worker that can instantiate sip without Node filesystem reads.
- **Rationale:** sip already ships the correct loader for workerd; reinventing WASM init in `@unveiled/images` is unnecessary if the bundler honors the condition and asset.
- **Alternatives:** Force Node `dist/index.js` and pass wasm bytes manually — more app code, fights sip’s designed entry; Cloudflare Images product — out of scope.

### 3. Static import in catalog image persistence

- **Choice:** Replace `loadImagesModule()` try/catch dynamic import in `packages/db/src/catalog/images.ts` with a normal static `import * as imagesModule from "@unveiled/images"` (or named imports). Delete `IMAGE_PROCESSING_UNAVAILABLE` from `CatalogValidationError` codes and admin copy/mapping.
- **Rationale:** Dynamic import existed only to catch missing native sharp; with sip bundled, import failure is a deploy bug, not an operator “use local dev” path. Validation/R2 errors still surface via existing `ImageValidationError` / storage config mapping.
- **Alternatives:** Keep dynamic import but map failures to generic 500 — worse DX; feature-flag Option B — rejected (plan removes the dead-end).

### 4. Module-level `ready()` is the Worker init path

- **Choice:** Do not add a separate apps/web `ready()` call site unless bundling proves module init never runs. Rely on `@unveiled/images` `sip-ready.ts` already awaited by validation/process entry points.
- **Rationale:** Step 02 already centralized init; step 03’s job is making WASM load, not re-plumbing call sites.
- **Alternatives:** Eager `await ready()` in Worker middleware on every request — unnecessary latency if unused.

### 5. Minimal operator-doc correction only

- **Choice:** Strike or rewrite the DEPLOYMENT.md lines that say sharp/local-only uploads on Workers; leave broader AGENTS.md / IMPLEMENTATION-PLAN polish to step 04.
- **Rationale:** Avoid mid-feature doc thrash while preventing staging operators from following obsolete instructions.
- **Alternatives:** Full doc sweep now — deferred by parent guide.

## Risks / Trade-offs

- **[WASM not emitted / wrong export condition]** Worker cold start fails on `ready()` or missing module → Iterate Vite conditions (`workerd`/`worker`/`browser`), Wrangler `rules`, and inspect `dist/` for `sip.wasm`; smoke with `dev:workers` before staging deploy.
- **[CPU/memory on large uploads]** In-request processing of up to 8 MB sources on Workers → Accept within existing product caps; prefer JPEG sources; no queue in this step.
- **[Cold-start latency]** First upload pays WASM instantiate cost → Accept; module-level ready caches for the isolate lifetime.
- **[Bundle size]** Shipping sip + jsquash deps increases Worker size → Accept for single-app architecture; monitor Wrangler size limits.
- **[Residual sharp references]** Leftover externals or docs confuse operators → Verification `rg` for `IMAGE_PROCESSING_UNAVAILABLE` / sharp externals in runtime paths; step 04 cleans historical docs.

## Migration Plan

1. Fix Vite/Wrangler bundling; confirm `bun run build` includes sip/wasm and no sharp.
2. Remove Option B guards + admin copy; switch catalog to static import.
3. Smoke on `dev:workers` or staging: admin create partner with logo → 302, six `.jpg` in R2, thumbnail on list.
4. Minimal DEPLOYMENT.md note; mark step 03 done in parent guide when merged.
5. Rollback: revert bundling + restore guards (ops-only; no DB/R2 schema change). Existing `.jpg` objects remain valid.

## Open Questions

- None blocking apply: exact Vite plugin / Wrangler `rules` snippet may need one implementation pass against sip’s workerd entry; resolve by inspecting build output and fixing until `ready()` succeeds in the isolate.
