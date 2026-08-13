## 1. Setup

- [x] 1.1 Read `.dev-plan/current-iteration/04-share-og-logo-01-square-safe-fallback.md`, parent guide (cache-bust, non-goals), and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Open `.dev-plan/shared-link-logo-bug.png` and current `apps/web/public/og-default.png` to confirm the 1:1 crop clips the wide lockup
- [x] 1.3 Confirm `DEFAULT_OG_IMAGE_PATH`, `buildPageMeta`, and `_renderer.tsx` Open Graph emission as described in design.md

## 2. Square-safe fallback asset

- [x] 2.1 Compose `apps/web/public/og-default-v2.png`: 1200×630, fill `#FAFF86`, black wordmark from `unveiled-logo-black.svg` (SVG paths, not a re-typeset font) entirely inside the center 630×630 with ≥64px padding; no full-canvas border or tight full-width lockup
- [x] 2.2 Verify `file apps/web/public/og-default-v2.png` reports `PNG image data, 1200 x 630`. Optionally center-crop 630×630 and confirm the full mark is visible
- [x] 2.3 Set `DEFAULT_OG_IMAGE_PATH` to `/og-default-v2.png`. Leave `/og-default.png` in `public/` unreferenced by meta (do not add a redirect)

## 3. Meta tags

- [x] 3.1 In `buildPageMeta`, always set `og:image:width` `1200`, `og:image:height` `630`, `og:image:alt` `Unveiled Berlin`
- [x] 3.2 Set `og:image:type` to `image/png` for the default fallback and `image/webp` when `ogImage` is passed. Keep `twitter:card` = `summary_large_image` and `twitter:image` = the same URL as `og:image`
- [x] 3.3 Confirm `_renderer.tsx` still emits all `openGraph` keys as `<meta property>` — no renderer rewrite unless a key is dropped

## 4. Tests and docs

- [x] 4.1 Add `apps/web/app/lib/seo.test.ts`: default meta uses `/og-default-v2.png` plus width/height/type/alt; `ogImage` override wins and uses `image/webp`. No network. Use `setRuntimeEnv` for a stable `SITE_URL`
- [x] 4.2 Update `docs/product/extras/seo-and-metadata.md` §2 (square-safe fallback, tags, cache-bust URL)
- [x] 4.3 Update `apps/web/DEPLOYMENT.md` Phase 1 view-source/curl paths and the assets note (filename, 1200×630, square-safe)
- [x] 4.4 Update `docs/product/ui/assets-inventory.md` fallback bullet if the filename/geometry changed

## 5. Verification and cleanup

- [x] 5.1 Run `bun run typecheck` and `bun run lint` — exit 0. `cd apps/web && bun test app/lib/seo.test.ts` — exits 0
- [x] 5.2 `bun run dev` then `curl -sI http://localhost:3000/og-default-v2.png` — HTTP 200, `content-type: image/png`
- [x] 5.3 View-source on `/en` or `/en/faq` — `og:image` is the absolute v2 URL with width 1200 and height 630
- [x] 5.4 Mark step 01 done in `.dev-plan/current-iteration/04-share-og-logo-parent-guide.md`. No new AGENTS.md convention. Optional: note Facebook Sharing Debugger / Telegram re-paste after staging in the PR (cache-bust URL required)
