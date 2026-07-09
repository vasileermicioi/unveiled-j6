## Why

Step 02 made `@unveiled/images` sip-based and runnable under Bun/Node, but the Cloudflare Workers deploy still cannot load sip’s WASM and catalog code still maps import failures to `IMAGE_PROCESSING_UNAVAILABLE` (Option B: “upload via bun run dev”). This step wires the Worker bundle so admin multipart uploads succeed end-to-end on the staging Workers URL.

## What Changes

- Bundle `@unveiled/images` **and** `@standardagents/sip` WASM into the `apps/web` Workers production build (Vite asset / Wrangler `.wasm` rules as needed); remove obsolete `sharp` externals from `vite.config.ts`.
- Prefer static `import` of `@unveiled/images` from catalog image persistence where dynamic import existed only to catch missing native modules; keep error mapping for real validation / R2 / size failures.
- **BREAKING (ops):** Delete the Option B `IMAGE_PROCESSING_UNAVAILABLE` dead-end — Workers no longer reject capable uploads with “use bun run dev”; update admin error copy accordingly.
- Ensure `await ready()` succeeds in the Worker request path (module-level sip ready from step 02 is sufficient if WASM loads).
- Light touch on `DEPLOYMENT.md` / operator-facing notes so staging docs are not wrong mid-feature (full polish stays in step 04).

**Out of scope:** Playwright Workers e2e suite; broad AGENTS.md / IMPLEMENTATION-PLAN historical rewrites; automatic migration of old `.webp` R2 objects; a separate image Worker service.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `event-catalog`: Admin partner/event image uploads SHALL succeed on the primary Cloudflare Workers host; remove the Option B local-only upload requirement for the sip pipeline.
- `platform-foundation`: `apps/web` Workers build SHALL include sip WASM (or sip’s workerd-supported loader) so `await ready()` succeeds in the isolate before transforms run.

## Impact

- **Build:** `apps/web/vite.config.ts`, possibly `apps/web/wrangler.toml` / package scripts (`build`, `deploy:workers`).
- **Catalog:** `packages/db/src/catalog/images.ts`, `packages/db/src/catalog/errors.ts` (`IMAGE_PROCESSING_UNAVAILABLE` code path).
- **Admin UX:** `apps/web/app/lib/admin-content.ts`, `apps/web/app/lib/admin-route.ts` error mapping / copy.
- **Docs:** Minimal `apps/web/DEPLOYMENT.md` correction of “sharp / local-only” staging notes.
- **Runtime:** In-request multipart processing on Workers; R2 env vars unchanged; SSR form POST only.
- **Follow-on:** Step 04 (`workers-sip-images-04-hardening`) owns e2e/docs polish.
