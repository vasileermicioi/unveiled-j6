# Assets Inventory (MVP)

Partner portal / check-in assets are out of MVP scope. Logos, Work Sans, lucide icons, and R2 JPEG pipeline remain.

## Logos

Location: `public/logos/` (copy these 3 files as-is into the new app):

| File | Fill color | Notes |
|---|---|---|
| `unveiled-logo-black.svg` | Implicit black (no explicit fill) | Default/primary wordmark |
| `unveiled-logo-white.svg` | `#ffffff` (`.st0` class) | For dark backgrounds |
| `unveiled-logo-yellow.svg` | `#faff86` (`.st0` class) | For dark backgrounds needing brand-accent emphasis |

All 3 are the same "UNVEILED" wordmark geometry (Adobe Illustrator export, viewBox `0 0 766.1 179.9`), differing only in fill.

### Logo style analysis

Confirmed by rendering the actual SVG: this is a **bespoke/hand-finished logotype, not a plain font rendering set in caps**. Characteristics:
- All-caps "UNVEILED", extremely heavy/near-monoline stroke weight, geometric sans-serif construction
- Wide, chunky proportions (not condensed) — letters are nearly as wide as they are tall
- Very tight/negative tracking — adjacent letter strokes nearly touch
- Mostly flat/squared terminals with only slight corner easing (the "U" and "D" bowls are squared-off, not fully round) — geometric but not razor-sharp either
- **Custom flourish:** the "V" is redrawn as two blocky vertical pillars joined by a shallow wave/scoop cutout at the base, instead of a normal pointed chevron — a deliberate bespoke detail (reads almost like a hidden smile/wave shape) that no off-the-shelf font will reproduce

**Implication for the rewrite:** treat the logo itself as a fixed vector asset — reuse the 3 existing SVG files as-is rather than trying to re-set the wordmark in any font. The font recommendation below is only for *headline/display type elsewhere on the site*, which should feel like it's from the same family as the logo without needing to match it exactly.

**Logo usage (`Logo.tsx` → `public/logos/`):**

| Location | Tone | Asset |
|---|---|---|
| Navbar home link | `black` | `unveiled-logo-black.svg` |
| Landing hero | `black` (display scale) | `unveiled-logo-black.svg` |
| Footer brand column | `black` | `unveiled-logo-black.svg` |
| Dark surfaces (future) | `white` or `yellow` | `unveiled-logo-white.svg` / `unveiled-logo-yellow.svg` |

Do not re-set the wordmark in a font — always use the SVG via `<Logo tone="…" />`.
- Props: `tone?: 'black' | 'white' | 'yellow'`, `className?: string`, `alt?: string` (default `"Unveiled Berlin"`).
- Paths: `LOGO_PATHS` in `Logo.tsx` maps each tone to `/logos/unveiled-logo-{tone}.svg` under `apps/web/public/logos/`.
- Rendered as an `<img>`, sized via `h-[1.1em] w-auto` so it scales with the surrounding font size.
- **Decided: keep multi-tone support** for dark/yellow full-screen overlays; use `white` or `yellow` on `brand-dark` backgrounds where a black logo would fail contrast.

## Fonts

### Decision: Work Sans only, for the whole new app

The new app uses a **single font family — Work Sans (variable, weight 100–900)** — for both body/UI text and display/headline text. `EK Notice Sans Black` is **not carried over**. Rationale and full history below.

| Font | Role in current app | Status |
|---|---|---|
| Work Sans (300/400/500/600/700) | Body/UI | ✅ Loaded via Google Fonts CDN today — carry forward as-is, load the full variable range (100–900) instead of fixed static weights |
| EK Notice Sans Black (900) | Display/headings | Font files exist at `public/fonts/EKNoticeSans-Black.{otf,woff,woff2}` and are correctly referenced by the `@font-face` rule in `index.css`, but **dropped for the rewrite** — see reasoning below |

**Why EK Notice Sans is dropped rather than carried over or replaced 1:1:**
- **Licensing risk:** it's a commercial retail typeface by the foundry Erkin Karamemet (released 2024), sold at `erkinkaramemet.com` — not a free/open font. The 3 files in `public/fonts/` are almost certainly under a standard commercial license that doesn't clearly cover redistribution into a new project/domain, and that was never confirmed.
- **The branded "display" feel comes mostly from the treatment, not the typeface:** uppercase, `letter-spacing: -0.05em`, `font-weight: 900`, `line-height: 0.9`. That treatment is trivial to keep with any font.
- **Work Sans already covers the needed weight range and is explicitly designed for it:** per Google Fonts' own description, the weights near the top of Work Sans's 100–900 variable range are "designed more for display use" — its Black (900) cut is purpose-built for exactly the headline role EK Notice Sans was playing.
- **Net effect:** one font family for the entire site, no second `@font-face`/network request, no licensing question to resolve before shipping, full DE/EN diacritic coverage, and a single variable font file is a better fit for HonoX SSR performance than loading two separate families.

**Migration action:** change the `h1, h2, h3, .display-font` rule from `font-family: "EK Notice Sans"` to `font-family: "Work Sans"` at `font-weight: 900`, keep the existing uppercase/tracking/line-height treatment unchanged. Do not copy the EK Notice Sans font files into the new app.

**Trade-off accepted:** Work Sans Black is a moderate-width humanist grotesk, not the wide/chunky near-geometric weight of the logo wordmark (see "Logo style analysis" above) or of EK Notice Sans — headlines will read a bit calmer/less blocky than in the current app. Considered acceptable given the simplicity/licensing/performance gains.

<details>
<summary>Alternatives considered before landing on Work Sans (for reference/traceability)</summary>

If a display face closer to the logo's wide/chunky geometric character is wanted instead of the Work Sans single-font approach, in order of preference: **Archivo Black** (closest like-for-like single-heavy-weight uppercase swap, or use the full **Archivo** variable family 100–900 as an alternative single-font choice with more graphic punch than Work Sans), **Poppins (ExtraBold/Black)** or **General Sans (Black)** (rounder-cornered, closer to the logo's soft corner easing, but more generic/ubiquitous), **Big Shoulders** or **Anton** (more condensed/industrial poster feel). All free (OFL or equivalent), self-hostable, no licensing review needed.

**Rejected:** `Roboto` (even at its Black/900 weight — reads as generic/corporate "Android system font," and would flatten the contrast with Work Sans body copy) and `Plus Jakarta Sans` (tops out at 800/ExtraBold, no true Black cut; softly-rounded "modern SaaS dashboard" character rather than bold/graphic — though it would be a fine alternative to Work Sans for body/UI text specifically, just not for display).

</details>

## Icons

Single icon library: **lucide-react**. No custom icon assets. Carry the same library forward (pairs well with HeroUI); exact icon choices are a nice-to-have parity detail, not a hard requirement.

## Images

Event and partner images are all **remote URLs** (e.g. Unsplash, Wikimedia) referenced directly in seed data — there are no local image assets to migrate for content.

**Correction:** the old app does have an image-upload UI for both — `AdminPanel.tsx`'s event form ("SELECT JPEG") and partner form ("SELECT LOGO") each have a file picker alongside the plain-URL text input. But it's an anti-pattern, not a real upload: `handleFileUpload` just runs `FileReader.readAsDataURL(file)` client-side and writes the resulting **base64 data URI straight into the `imageUrl`/`logoUrl` text column** — no Firebase Storage call at all (which is why that bucket was configured but never actually used). This bloats Postgres rows with embedded images and skips any CDN/caching/resizing.

**Decided: do not carry the base64-into-DB anti-pattern forward — but keep the file-picker, and make it real.** V1 of the rewrite keeps both the file-picker and the plain-URL text field from the old UI, but both now feed one real, S3-compatible upload pipeline: every event image / partner logo is processed server-side into six generated WebP size variants (`original`, `hero-1920`, `large-1280`, `medium-640`, `small-320`, `og-1200x630`) and stored in an object storage bucket (recommended: Cloudflare R2), instead of either bloating the database with base64 or indefinitely hotlinking a third party's URL. Full spec: `extras/image-uploads.md`; schema: `database/schema-overview.md`'s new `images` table.

## Missing / gaps to fill in the new app

None of these exist in the current app — add them fresh:

- Favicon (`.ico` and/or SVG)
- Web app manifest (`manifest.json`) for PWA-style install support
- Site-wide Open Graph / social preview image — the static fallback used for pages with no natural image (marketing/legal pages); event detail pages use their own per-event `og-1200x630` variant instead (`extras/image-uploads.md`, `extras/seo-and-metadata.md`)
- Apple touch icon / other platform app icons

## Metadata

`metadata.json` in the current app only contains the app name, a short description, and a `geolocation` permission request — no design tokens. Carry the descriptive copy forward into the new app's SEO/meta tags; the geolocation permission is relevant if the map/"near me" filtering is kept.
