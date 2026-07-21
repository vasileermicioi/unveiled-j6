## Context

Parent feature: Client Image Resize (Pica) (`.dev-plan/current-iteration/client-image-resize-parent-guide.md`). Steps 01–03 are done:

- Browser: `@unveiled/images/client` → `generateImageVariantsClient` (Pica + OG cover-crop)
- Server accept: `persistPrebuiltImageVariants` / `persistPrebuiltImage`
- Admin file-picker islands post six `VARIANT_FILENAMES` + `imageId` on SSR form POST

Still sip-backed today:

- Remote `image_url` → `processImageFromUrl` → `generateImageVariants` (sip)
- Legacy raw `image`/`logo` Buffer → `processImageFromBuffer` (sip fallback)
- `createSolidJpeg`, `packages/images` process tests, pagination seed buffers
- Demo seed / Abundo fetch scripts that call `processImageFromBuffer`
- `repairImageVariants` (re-fetch URL + sip)
- `apps/web/vite.config.ts` WASM aliases, `noExternal`, package `sip-*` stubs/exports
- `@standardagents/sip` dependency in `packages/images`

Constraints: no `sharp`; packages never depend on `apps/web`; do not import `@unveiled/images/client` from Workers/server route modules; keep six JPEG filenames and `buildVariantUrl` shape; SSR-only mutations for create/update/delete (proxy may be a read-only fetch helper for the island, not a mutation of catalog state); HeroUI admin UX; prefer authenticated bytes proxy over dropping the URL field (parent guide).

## Goals / Non-Goals

**Goals:**

- Remote URL path: admin island fetches bytes via authenticated proxy, runs Pica, posts prebuilt variants (same as file picker).
- Remove `@standardagents/sip` and all Workers/Vite sip wiring; `@unveiled/images` server entry is validate/store/URL helpers only.
- Seed, pagination seed, Abundo refresh, and package tests work without sip (fixtures and/or Bun-only offline client generator).
- Product + package docs match client-resize reality; parent guide marks step 04 done and feature releasable.

**Non-Goals:**

- Featured event gallery UI/schema.
- Non-admin upload surfaces / partner portal.
- Changing variant filenames, JPEG Content-Type, or public URL layout.
- Reintroducing Node-native image addons on Workers.
- Promising no-JS admin image upload (JS already required for file picker).

## Decisions

1. **Remote URL: authenticated bytes proxy + client Pica (keep XOR UX)**
   - **Choice:** Add an ADMIN-only route that accepts a remote image URL, server-fetches it (timeout, size cap, content-type checks — reuse `REMOTE_FETCH_TIMEOUT_MS` / `MAX_UPLOAD_BYTES` / `validateRemoteContentType` ideas from `@unveiled/images`), and returns raw image bytes (or a small JSON error). The admin island (`EventImageUpload`) on URL “apply”/blur/submit-prep calls the proxy, then `generateImageVariantsClient` / `processAdminImageFiles`, then posts prebuilt fields — **not** `image_url` alone for persist.
   - **Suggested shape:** `POST /:locale/admin/image-proxy` (or `/api/admin/image-proxy` if a non-locale API route is cleaner in HonoX) with form/JSON body `{ url }`, session guard same as other admin routes, response `Content-Type` of fetched image + body bytes. Prefer locale-prefixed admin path for consistent middleware/session.
   - **Form contract after this step:** Persist path is always prebuilt (file or URL-derived). `image_url` may still be posted as metadata (`sourceUrl` on `images` row / claimed remote origin) but MUST NOT trigger server resize. XOR: prebuilt set XOR empty (edit keep-current); do not accept buffer-only or URL-only server resize.
   - **Why over deprecating URL:** Parent guide prefers keeping paste-a-link UX; CORS blocks browser-direct fetch of many marketing hosts.
   - **Alternatives:** Deprecate URL field (simpler, worse UX); keep sip only for URL (rejected — defeats release criteria).

2. **Delete sip resize surface from `@unveiled/images` server entry**
   - **Choice:** Remove dependency and modules: `process.ts` sip path, `sip-*.ts`, `create-solid-jpeg.ts` (sip-based), package exports for sip stubs, Vite aliases/`noExternal` for sip. Delete or stop exporting `generateImageVariants`, `processImageFromBuffer`, `processImageFromUrl`, `repairImageVariants` from the Workers-consumed entry (or replace `repairImageVariants` with a no-op / “objects missing” log that does not resize — seed should upload complete sets so repair is unnecessary).
   - Keep: constants, validation helpers that don’t need sip, JPEG SOF dims, `prebuilt.ts`, `s3.ts`, `urls.ts`, client entry.
   - **Catalog:** `persistImageFromSource` buffer/URL sip branches go away. Attach/replace APIs accept **prebuilt only** for new image bytes (plus “no new image” on edit). Optionally keep `imageUrl` string on create inputs solely as `sourceUrl` metadata when the island supplies it with prebuilt.
   - **Alternatives:** Leave dead sip code behind a dynamic import — rejected (still risks Workers bundling / dependency retention).

3. **Seed / fixtures / offline generation (Bun-only, never Workers)**
   - **Choice (primary):** For demo seed images already on disk under `public/images/seed/**`, generate variants in the **seed script** using the existing client generator + `@napi-rs/canvas` test-env shim (same as step 01 tests), then `persistPrebuiltImage`. Do not import that path from `apps/web` Workers entrypoints.
   - **Pagination seed / unit fixtures:** Commit a small set of static JPEG fixtures under e.g. `packages/images/test/fixtures/` (min-size solid or photo JPEGs + optionally a full six-variant set). Replace `createSolidJpeg` callers with fixture reads; for varied pagination colors, either reuse one fixture repeatedly or a handful of committed solids generated once offline.
   - **`scripts/fetch-abundo-seed.ts`:** Stop calling `processImageFromBuffer`. Write/normalize source JPEGs with the Bun client-generator path (or store sources as-is if already valid ≥800×420 JPEGs) without uploading during fetch; upload remains seed-time prebuilt persist.
   - **Alternatives:** Hand-author six files per seed image (heavy); keep sip as a devDependency for scripts only (still fails the “remove sip” release criterion and confuses agents).

4. **Admin island URL wiring**
   - **Choice:** Extend `EventImageUpload` (and partner if/when URL exists): when the admin pastes a URL and leaves the field / clicks process, call proxy → Blob → existing `processAdminImageFiles`. Show same processing/error copy as file path. Clear conflicting file picker state (XOR). On submit, only prebuilt hidden fields matter for persist; optionally include `image_url` for `source`/`sourceUrl` metadata.
   - Strip any remaining reliance on server-side URL resize in `parseEventFormBody` / catalog.

5. **Docs alignment**
   - **Choice:** Rewrite `docs/product/extras/image-uploads.md` §2–4/§7: processing in browser (Pica); server validate+store; remote URL via admin bytes proxy; JS required for admin image supply; JPEG rationale no longer “sip only encodes JPEG” as the driver (keep JPEG contract as product choice). Update README, DEPLOYMENT (remove sip Workers notes), gaps-and-decisions, parent guide Risks (remote URL decided: proxy).

6. **Tests after sip removal**
   - **Choice:** Retire `process.test.ts` sip resize suite (or rewrite dimension helpers that don’t need sip). Keep/expand `prebuilt.test.ts` with fixtures; keep client generator tests. Catalog integration tests switch from buffer upload to `prebuilt` input or `skipUpload` prebuilt fixtures. Assert `rg` clean for `@standardagents/sip` in app/packages (historical mention OK in gaps log only).

## Risks / Trade-offs

- **[Risk] Proxy becomes an open redirect/SSRF footgun** → Mitigation: ADMIN session required; allow only `http:`/`https:`; block private/link-local/metadata IPs where practical; enforce timeout + max bytes; do not follow to file://; return opaque fetch errors to client.
- **[Risk] Seed scripts pull client/canvas into accidental Workers imports** → Mitigation: keep offline helper under `packages/images` script/test entry or `scripts/`; never export from Workers barrel; document “Bun seed only”.
- **[Risk] `repairImageVariants` callers break when sip/URL reprocess disappears** → Mitigation: if objects missing, no-op or surface admin re-upload; demo seed always writes complete sets.
- **[Risk] Large dual payload during transition** → Mitigation: same as step 03 — island strips raw file; URL path never posts raw remote bytes on the mutation POST (only six variants).
- **[Trade-off] Admin image supply requires JS for both file and URL** → Accepted (admin-only); document in product extras + DEPLOYMENT.
- **[Trade-off] Proxy adds a network hop before Pica** → Acceptable vs keeping WASM on Workers.

## Migration Plan

1. Land proxy + island URL wiring while sip still present (optional intermediate) **or** land proxy + sip deletion in one PR (preferred if tests/fixtures ready) — single PR is fine given feature is one step.
2. Switch seed/pagination/tests to fixtures / Bun client generator; delete sip modules and Vite wiring; remove dependency.
3. Update docs + parent guide release marking.
4. Verify lint/typecheck/images tests/rg/build.
5. Rollback: revert PR; sip path is not retained behind a flag after merge.

## Open Questions

- None blocking. Prefer locale admin `POST` proxy under existing admin session middleware over a separate unauthenticated API. Exact path name (`…/admin/image-proxy`) can be chosen at implement time if HonoX file routing needs a thin handler module.
