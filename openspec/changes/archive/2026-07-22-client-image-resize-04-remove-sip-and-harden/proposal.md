## Why

Steps 01–03 moved admin file-picker uploads to browser Pica + server `persistPrebuiltImage`, but Workers still ship `@standardagents/sip` WASM for remote URL, seed/demo solid JPEGs, and the leftover buffer fallback. This final slice removes sip entirely, closes the remote-URL and fixture gaps without bringing WASM resize back into Workers, and aligns product docs with the client-resize contract so the parent feature is releasable.

## What Changes

- Implement remote-URL strategy: authenticated admin **image bytes proxy** (server fetches URL → returns raw bytes to the island) → client Pica → prebuilt persist — prefer proxy over deprecating the URL field so XOR UX stays.
- **BREAKING (internal):** Remove `@standardagents/sip` dependency, sip Workers init, emscripten stubs, Vite WASM aliases / `noExternal` entries, and server `generateImageVariants` / `processImageFromBuffer` / `processImageFromUrl` sip resize path.
- Replace `createSolidJpeg` / seed image creation with static fixture JPEGs (six variants or one source processed offline) so `seed:demo` and package tests do not need sip.
- Drop legacy raw-buffer → sip fallback on admin attach paths; file and URL submissions both end as prebuilt variants.
- Update `packages/images` tests to cover prebuilt persist + validation (+ client generator) only.
- Rewrite `docs/product/extras/image-uploads.md`, refresh `packages/images/README.md` / `apps/web/DEPLOYMENT.md`, and record the decision in `docs/product/extras/gaps-and-decisions.md`.
- Grep-clear leftover sip references; mark step 04 + feature releasable in the parent guide.
- **Out of this step:** Featured event gallery UI/schema; non-admin upload surfaces; changing the six filenames or public URL shape; adding `sharp`.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `image-uploads`: Processing location SHALL be browser Pica for admin file and (via authenticated bytes proxy) remote-URL inputs; the server SHALL validate and store prebuilt variants only. Workers deployables SHALL NOT depend on `@standardagents/sip` for resize. The prior “remote URL remains server-side sip” scenario is removed. (Maps to `.dev-plan/current-iteration/client-image-resize-04-remove-sip-and-harden.md`; product SoT update in `docs/product/extras/image-uploads.md`.)

## Impact

- **Code:** `packages/images` (delete sip modules/`process` resize, fixture helpers, README, tests); `apps/web/vite.config.ts` (strip sip wiring); admin islands + optional new admin proxy route; `@unveiled/db` catalog (`persistImageFromSource` URL/buffer sip branches → prebuilt-only or thin wrappers); `scripts/seed-demo.ts` / catalog seed helpers.
- **APIs:** New authenticated admin bytes-proxy endpoint (GET/POST returning image bytes) for URL paste flow; existing SSR create/edit form POSTs stay the mutation path (still multipart prebuilt). No public API change to `buildVariantUrl`.
- **Deps:** Remove `@standardagents/sip` from `packages/images` (and any transitive Workers bundling).
- **Docs:** `docs/product/extras/image-uploads.md`, `gaps-and-decisions.md`, `packages/images/README.md`, `apps/web/DEPLOYMENT.md`, parent guide release marking.
- **Source brief:** `.dev-plan/current-iteration/client-image-resize-04-remove-sip-and-harden.md`
- **Parent:** `.dev-plan/current-iteration/client-image-resize-parent-guide.md`
- **Depends on:** `client-image-resize-03-wire-admin-uploads` (done — prebuilt file-picker path live)
- **Consumed by:** closes Client Image Resize; release prerequisite for accurate image docs ahead of `featured-event-gallery` hardening
- **Verification:** `bun run lint`, `bun run typecheck`, `cd packages/images && bun test`, `rg "@standardagents/sip" -g '!**/node_modules/**'` (no app/package dependency usages), `bun run build` when `DATABASE_URL` available
