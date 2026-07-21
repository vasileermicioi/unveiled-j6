## 1. Setup

- [x] 1.1 Confirm prerequisites: step 03 prebuilt file-picker path live (`EventImageUpload` / `PartnerLogoUpload`, `persistPrebuiltImage`), sip still present in `packages/images` + `apps/web/vite.config.ts`, seed uses buffers/`createSolidJpeg`, parent guide release criteria
- [x] 1.2 Record remote-URL decision in parent guide Risks: authenticated admin bytes proxy → client Pica → prebuilt (not URL-field deprecation)

## 2. Admin bytes proxy + URL island wiring

- [x] 2.1 Add ADMIN-guarded proxy route (e.g. `POST /:locale/admin/image-proxy`) that fetches a remote URL with timeout/size/content-type checks and returns raw image bytes (SSRF-aware: https/http only, reject obvious private targets where practical)
- [x] 2.2 Wire `EventImageUpload` URL field to proxy → `processAdminImageFiles` / Pica → prebuilt hidden fields; keep XOR with file picker; optional `image_url` only as metadata/`sourceUrl`
- [x] 2.3 Update admin form parse + catalog attach so new images persist **prebuilt only** (drop server URL/buffer sip resize); map proxy/client errors through DE/EN admin copy
- [x] 2.4 Add/adjust unit tests for proxy validation helpers and form parse (URL alone without prebuilt must not create an image via sip)

## 3. Fixtures, seed, and offline generation

- [x] 3.1 Add static JPEG fixtures under `packages/images` (and/or reuse `public/images/seed`) replacing `createSolidJpeg` for tests
- [x] 3.2 Add Bun-only offline helper (client generator + `@napi-rs/canvas` test-env) for seed/demo and `scripts/fetch-abundo-seed.ts` — never imported from Workers routes
- [x] 3.3 Switch `seed-demo` / `seed-pagination` / catalog integration tests from buffer→sip to prebuilt persist (or fixture buffers → offline generate → prebuilt)
- [x] 3.4 Replace or no-op `repairImageVariants` so it does not require sip resize

## 4. Remove sip from package and Workers build

- [x] 4.1 Delete sip modules (`sip-*.ts`, sip-based `process.ts` / `create-solid-jpeg.ts` as applicable), remove `@standardagents/sip` dependency and package exports/aliases
- [x] 4.2 Strip `apps/web/vite.config.ts` sip WASM aliases, `noExternal`, and related Workers bundling comments/config
- [x] 4.3 Slim `@unveiled/images` server barrel to validate/store/URL helpers + prebuilt API; update `@unveiled/db` catalog imports accordingly
- [x] 4.4 Rewrite/retire `process.test.ts` and any tests still calling sip `generateImageVariants`; keep client + prebuilt coverage green

## 5. Docs & release marking

- [x] 5.1 Rewrite `docs/product/extras/image-uploads.md` for client Pica + server validate/store + proxy URL path; JS required for admin image supply
- [x] 5.2 Update `packages/images/README.md`, `apps/web/DEPLOYMENT.md`, and `docs/product/extras/gaps-and-decisions.md` for sip removal / proxy decision
- [x] 5.3 Mark step 04 done and feature releasable in `.dev-plan/current-iteration/client-image-resize-parent-guide.md`

## 6. Verification

- [x] 6.1 Run `bun run lint` — exit 0
- [x] 6.2 Run `bun run typecheck` — exit 0
- [x] 6.3 Run `cd packages/images && bun test` — exit 0
- [x] 6.4 Run `rg "@standardagents/sip" -g '!**/node_modules/**'` — no dependency usages in app/packages (historical gaps-log mention OK)
- [x] 6.5 Run `bun run build` when `DATABASE_URL` available — Workers bundle succeeds without sip WASM (`bun --filter @unveiled/web build`; full `bun run build` migrate step needs live Neon DNS)
