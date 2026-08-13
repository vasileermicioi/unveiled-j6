## Context

Parent feature: sharing-link logo fix (`.dev-plan/current-iteration/04-share-og-logo-parent-guide.md`), step 01 of 01 — square-safe site-wide OG fallback. Canonical product SEO is `docs/product/extras/seo-and-metadata.md`; OpenSpec capability is `static-marketing-pages` (existing “Site-wide Open Graph fallback”).

Current state:

- `apps/web/public/og-default.png` is 1200×630, brand-yellow, with a **wide** bordered “UNVEILED BERLIN” lockup that spans most of the canvas. Telegram’s link preview **center-crops to 1:1**, which clips the wordmark (`.dev-plan/shared-link-logo-bug.png`).
- `DEFAULT_OG_IMAGE_PATH = "/og-default.png"` in `apps/web/app/lib/site-config.ts`. `getDefaultOgImage()` returns `absoluteUrl` of that path (`SITE_URL` or `http://localhost:3000`).
- `buildPageMeta` (`apps/web/app/lib/seo.ts`) sets `og:image` and `twitter:image` to `ogImage ?? getDefaultOgImage()`, plus `twitter:card` = `summary_large_image`. It does **not** set `og:image:width|height|type|alt`.
- `_renderer.tsx` already emits every `openGraph` key as `<meta property>` and every `twitter` key as `<meta name>`. No new tag-emission mechanism is needed.
- Event detail passes `ogImage` from `eventDetailPageMeta` → `buildVariantUrl(..., "og-1200x630.webp")`. That path is unchanged.
- Wordmark source: `apps/web/public/logos/unveiled-logo-black.svg` (viewBox 766.1×179.9). Product UI font is Work Sans; this asset MUST use the SVG paths, not a re-typeset wordmark.
- Vite/`public/` files are served at `/` in honox dev and copied into the Workers `dist` asset directory. No extra wrangler binding.

Constraints: yellow page/brand `#FAFF86`; no event-pipeline or navbar-logo work; meta tags are already `<meta>` (allowed). Do not add a runtime image-generation dependency.

## Goals / Non-Goals

**Goals:**

- Marketing/legal (and any page using the default OG) share a legible Unveiled Berlin mark after a 1:1 center crop.
- Default OG URL changes so Telegram/Facebook refetch.
- SSR HTML includes width/height/type/alt for the fallback; Twitter card stays `summary_large_image` with the same image URL when no page image.
- Event pages keep `og-1200x630.webp`.
- Unit test + docs + HTTP 200 on the new path.

**Non-Goals:**

- Per-event `og-1200x630.webp` crop rules or the six-variant pipeline.
- Telegram-specific API / `telegram:channel` tags.
- PWA manifest / apple-touch-icon.
- Navbar `<Logo />` SVG redesign.
- Generating the PNG at request time.
- Playwright/Gherkin (parent is a single step; verification is `file` + unit test + curl + view-source).

## Decisions

1. **New filename `/og-default-v2.png`, not a query string**
   - **Choice:** Commit `apps/web/public/og-default-v2.png`. Set `DEFAULT_OG_IMAGE_PATH = "/og-default-v2.png"`. Meta tags use that path only.
   - **Rationale:** Step plan allows filename **or** `?v=`. Some crawlers ignore query strings; a new path is the reliable cache-bust. Matches “do not rely on in-place byte replacement.”
   - **Alternatives:** `?v=2` on `/og-default.png` (weaker cache-bust); content-hash filename (overkill for one static).

2. **Keep old `/og-default.png` bytes; do not reference it in meta**
   - **Choice:** Leave `og-default.png` in `public/` so historical curls and stale bookmarks still 200. Do **not** add a Workers redirect. Optionally overwrite its pixels with the new artwork so leftover shares are less cropped — **not required**; meta MUST NOT point at it.
   - **Rationale:** Step plan: keep or redirect only if something still links it. Static hosting has no first-class redirect for one file.
   - **Alternatives:** Delete the old file (breaks documented Phase 1 `curl` until docs update, and any cached URL 404s); 301 via a Hono route (unnecessary surface).

3. **Composition: black SVG wordmark inside the center 630×630, yellow fill, no full-bleed frame**
   - **Choice:**
     - Canvas: **1200×630** PNG, fill `#FAFF86` (not a nearby yellow).
     - Safe square: `x = (1200 − 630) / 2 = 285` … `915`, `y = 0` … `630`.
     - Render `unveiled-logo-black.svg` (black paths) **centered** in that square with **≥64px** padding on all sides inside the square (max mark box **502×502**). Given the SVG aspect (~4.26:1), the mark is width-limited: max width 502 → height ~118. Vertically center in 630.
     - **No** black border around the full 1200×630 canvas. **No** tight full-width lockup. A frame is allowed only if the **entire** frame + wordmark still sits inside the padded square.
     - Do not typeset “UNVEILED BERLIN” in Work Sans, EK Notice, or a system font — use the SVG paths.
   - **Rationale:** Telegram crops the center 630×630. The current bug is a wide lockup plus a canvas-edge frame. Padding avoids a tight crop on a 50px thumb.
   - **Alternatives:** 1:1 630×630 OG (breaks `summary_large_image` / Facebook recommended 1.91:1); yellow-on-yellow logo SVG (invisible); re-typeset wordmark (wrong mark).

4. **Commit the PNG; generate once with a local one-shot, no new runtime dep**
   - **Choice:** Check in the PNG. Generate with a one-off (ImageMagick `magick` + `rsvg-convert`, or a throwaway Bun script that is **not** added to `package.json` / Workers bundle). Do not add `sharp` / `@resvg/core` as an app dependency. Do not rasterize in `buildPageMeta`.
   - **Rationale:** Static asset; Workers must not pull native image libs for one file. Verify with `file` → `PNG image data, 1200 x 630`.
   - **Alternatives:** Illustrator export from the same source as the logo SVGs (also fine if the geometry constraints are met); runtime SVG→PNG (rejected).

5. **OG dimension tags always; `type` follows the resolved image**
   - **Choice:** `buildPageMeta` always sets:
     - `og:image:width` = `1200`
     - `og:image:height` = `630`
     - `og:image:alt` = `Unveiled Berlin`
     - `og:image:type` = `image/png` when using the default fallback, **`image/webp` when `ogImage` is passed** (event variant is `.webp`)
     - `twitter:card` stays `summary_large_image`; `twitter:image` stays the same URL as `og:image`
   - Renderer needs **no** change (it already loops `meta.openGraph`).
   - **Rationale:** Step plan requires png type on the **fallback**. Claiming `image/png` for event WebP would be a lie. Both assets are 1200×630 so width/height apply to both. Alt is the site name; per-event alt is out of scope.
   - **Alternatives:** Dimension tags only on the default (clients still guess for events); omit type on override (weaker); `og:image:alt` = event title (needs a new `buildPageMeta` input — skip).

6. **Unit test `buildPageMeta` only (no network, no Playwright)**
   - **Choice:** Add `apps/web/app/lib/seo.test.ts`. Assert:
     1. Default (no `ogImage`): `og:image` / `twitter:image` contain `DEFAULT_OG_IMAGE_PATH` (`/og-default-v2.png`); width `1200`; height `630`; type `image/png`; alt present; `twitter:card` = `summary_large_image`.
     2. With `ogImage` (fake event variant URL): `og:image` is that URL, **not** the fallback path; type `image/webp`; width/height still 1200/630.
   - Use `setRuntimeEnv({ SITE_URL: "https://example.test" })` like `runtime-env.test.ts` so URLs are stable. Do not hit R2 or Telegram.
   - **Rationale:** Step plan: unit test, no network. Event override already lives in `eventDetailPageMeta`; testing `buildPageMeta`’s `ogImage` argument is enough for this increment.
   - **Alternatives:** Snapshot the renderer HTML (heavier); e2e view-source (parent non-goal for this single step).

7. **Canonical docs match the new filename and square-safe rule**
   - **Choice:** Update `docs/product/extras/seo-and-metadata.md` §2 (fallback is square-safe 1200×630 PNG; tags listed). `DEPLOYMENT.md` Phase 1 view-source + curl + assets note. `docs/product/ui/assets-inventory.md` fallback bullet: new filename + center-630 constraint. Mark the parent guide step done after verification.
   - **Rationale:** Parent release criteria. Product SoT is `docs/product/`, not OpenSpec main specs (those update on archive/sync).
   - **Alternatives:** Docs-only in DEPLOYMENT (leaves seo-and-metadata stale).

## Risks / Trade-offs

- **[Risk] Telegram/Facebook still show the old crop after deploy** → Mitigation: new filename (decision 1). PR notes optional Sharing Debugger / Telegram re-paste after staging. Cache-bust is required; in-place replace is not enough.
- **[Risk] Wordmark still clips if padding is too small or a full-width frame is added** → Mitigation: decision 3 geometry; visually inspect a 630×630 center crop before merge (`magick og-default-v2.png -gravity center -crop 630x630+0+0`).
- **[Risk] Yellow-on-yellow if the yellow logo SVG is used** → Mitigation: black SVG only.
- **[Risk] `og:image:type` `image/png` on event pages** → Mitigation: decision 5 — type follows override.
- **[Risk] New PNG not copied into Workers `dist`** → Mitigation: Vite `public/` copy; verify `curl -sI` 200 `image/png` in dev; staging check after deploy.
- **[Trade-off] Old `/og-default.png` remains** → Stale clients may still crop until they recrawl the **HTML**. Acceptable; HTML points at v2.
- **[Trade-off] No Playwright** → Unit test + curl + view-source are the contract. Optional debugger check is documented, not gated.

## Migration Plan

1. Compose and commit `apps/web/public/og-default-v2.png` (1200×630, square-safe).
2. Point `DEFAULT_OG_IMAGE_PATH` at `/og-default-v2.png`.
3. Extend `buildPageMeta` with width/height/type/alt (type png vs webp).
4. Add `seo.test.ts`.
5. Update seo-and-metadata.md, DEPLOYMENT.md, assets-inventory.md; mark parent guide done.
6. `file` the PNG; `bun run typecheck`; `bun run lint`; `cd apps/web && bun test app/lib/seo.test.ts`; `curl -sI` the new path; view-source `/en` or `/en/faq`.
7. **Rollback:** revert the PR. Crawlers that already fetched v2 keep v2 until recrawl; old `/og-default.png` is unchanged.

## Open Questions

- None blocking. Overwriting `og-default.png` pixels with the new artwork (while meta still uses v2) is implementer preference — default **leave the old file as-is**.
