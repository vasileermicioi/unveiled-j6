## MODIFIED Requirements

### Requirement: Site-wide Open Graph fallback
The application SHALL provide a site-wide Open Graph/Twitter fallback image used for marketing and legal pages that have no page-specific image. The asset SHALL be PNG **1200×630** on brand yellow `#FAFF86`. The Unveiled Berlin wordmark (logo SVG paths, black on yellow) SHALL fit entirely within the **center 630×630** of that canvas, with padding, so a 1:1 center crop (Telegram and similar) still shows the full mark. The public URL SHALL change when the artwork changes so crawlers refetch (new filename such as `/og-default-v2.png`, not in-place byte replacement of `/og-default.png` alone).

The SSR HTML SHALL include `og:image` (absolute URL of that fallback), `og:image:width` (`1200`), `og:image:height` (`630`), `og:image:type` (`image/png`), `og:image:alt`, and matching `twitter:image` with `twitter:card` = `summary_large_image`. Event detail SHALL continue to override `og:image` / `twitter:image` with the event `og-1200x630` variant URL when present (and SHALL set `og:image:type` to `image/webp` for that override).

#### Scenario: Default OG image on FAQ
- **WHEN** a crawler inspects Open Graph tags on `/de/faq` (or `/en/faq`)
- **THEN** `og:image` references the site-wide fallback image URL (the cache-busted path, not the pre-fix `/og-default.png` alone)

#### Scenario: Marketing page default OG includes dimension tags
- **WHEN** I view source on `/en/faq` (or another indexable marketing page)
- **THEN** `og:image` is the absolute site-wide fallback URL
- **AND** `og:image:width` is 1200 and `og:image:height` is 630
- **AND** `og:image:type` is `image/png`
- **AND** `og:image:alt` is present
- **AND** `twitter:card` is `summary_large_image` and `twitter:image` matches `og:image`

#### Scenario: Event page keeps event OG
- **WHEN** I view source on a bookable `/events/:id`
- **THEN** `og:image` is that event's `og-1200x630.webp` variant URL, not the site-wide fallback

#### Scenario: Fallback asset is served
- **WHEN** I GET the path in `og:image` for a marketing page
- **THEN** the response is 200 with Content-Type `image/png`
