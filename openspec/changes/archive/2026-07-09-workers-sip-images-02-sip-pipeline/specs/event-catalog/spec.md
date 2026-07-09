## ADDED Requirements

### Requirement: Server-side image processor

The `@unveiled/images` package SHALL generate the six JPEG variants using `@standardagents/sip` (WASM/scanline processing). The package SHALL NOT depend on `sharp` or other Node-native image addons.

#### Scenario: Unit test generates variants without sharp

- **WHEN** `bun test` runs in `packages/images`
- **THEN** variant generation succeeds using sip and asserts JPEG outputs and correct dimensions

#### Scenario: OG cover-crop

- **WHEN** a source image is processed
- **THEN** `og-1200x630.jpg` is exactly 1200×630 pixels (center cover-crop; upscale allowed only for this variant)
