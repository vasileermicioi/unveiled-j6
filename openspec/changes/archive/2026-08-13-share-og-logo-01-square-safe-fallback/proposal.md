## Why

Pasting `https://app.unveiled.berlin/en` into Telegram shows a yellow square with a cropped Unveiled wordmark. The site-wide fallback `apps/web/public/og-default.png` is 1200×630 with a wide bordered lockup; Telegram (and similar) center-crop to 1:1 for the small preview. `buildPageMeta` also omits `og:image:width` / `height` / `type` / `alt`, so clients guess dimensions. This is the single increment of parent feature `04-share-og-logo`.

## What Changes

- Replace the fallback PNG with a **1200×630** brand-yellow (`#FAFF86`) asset whose **black** wordmark (logo SVG paths, not yellow-on-yellow and not a system font) fits entirely inside the **center 630×630** with padding so a 1:1 center crop still shows the full mark. Do not ship a tight full-width bordered lockup.
- Change the public URL so crawlers refetch: new filename (e.g. `/og-default-v2.png`) **or** `DEFAULT_OG_IMAGE_PATH` with a version query. Do not rely on in-place byte replacement.
- `buildPageMeta` emits `og:image:width` `1200`, `og:image:height` `630`, `og:image:type` `image/png`, `og:image:alt` (e.g. "Unveiled Berlin"). Keep `twitter:card` = `summary_large_image` and `twitter:image` = the same fallback when no page image.
- Unit-test default meta (new path + dimension/type/alt tags) vs event override (`ogImage` still wins).
- Update `docs/product/extras/seo-and-metadata.md`, `apps/web/DEPLOYMENT.md` assets note, and `docs/product/ui/assets-inventory.md` if the filename changes.
- Confirm the file is copied into the Workers/`public` bundle (HTTP 200 on the path used in tags).
- Out of scope: event variant pipeline; navbar logos; apple-touch-icon/PWA; Telegram API; redesigning per-event OG crops.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `static-marketing-pages`: Site-wide Open Graph fallback SHALL be a square-safe 1200×630 PNG on brand yellow (wordmark entirely inside the center 630×630). SSR HTML SHALL include `og:image`, `og:image:width` (1200), `og:image:height` (630), `og:image:type` (`image/png`), `og:image:alt`, and matching `twitter:image` with `twitter:card` = `summary_large_image`. The default image URL SHALL change when the artwork changes. Event detail SHALL continue to override with the event `og-1200x630` variant when present.

## Impact

- **Asset:** new PNG under `apps/web/public/` (new filename); `DEFAULT_OG_IMAGE_PATH` in `apps/web/app/lib/site-config.ts`. Keep or redirect `/og-default.png` only if something still links it.
- **SEO:** `apps/web/app/lib/seo.ts` `buildPageMeta` (+ renderer already emits `openGraph` keys as `<meta property>`). No raw marketing HTML besides those tags.
- **Tests:** new `apps/web/app/lib/seo.test.ts` (or equivalent) — no network.
- **Docs:** `seo-and-metadata.md` §2, `DEPLOYMENT.md` assets/verification notes, `assets-inventory.md` if the name changes.
- **Source brief:** `.dev-plan/current-iteration/04-share-og-logo-01-square-safe-fallback.md`
- **Parent:** `.dev-plan/current-iteration/04-share-og-logo-parent-guide.md`
- **Depends on:** none
- **Consumed by:** closes the feature
- **Verification:** `file` on the PNG (1200×630); `bun run typecheck`; `bun run lint`; unit test; `curl -sI` HTTP 200 `image/png`; view-source on `/en` or `/en/faq`
