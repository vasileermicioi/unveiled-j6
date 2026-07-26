## Why

Steps 01–03 already ship five WebP variants, required partner logos, client submit guards, and the admin variant preview gallery — but canonical product docs, Gherkin, Playwright coverage, and DEPLOYMENT still describe the old six-JPEG / optional-logo / 800×420 contract. Until those are aligned, agents and staging demos will implement or verify the wrong rules. This final Image pipeline slice closes the release loop.

## What Changes

- Rewrite `docs/product/extras/image-uploads.md` for the shipped WebP contract: five variants (no `original`), browser-decodable source acceptance (incl. SVG → rasterize), no 800×420 / 8 MB product gates, required event + partner images, client errors that block submit, admin variant preview gallery.
- Update `docs/product/database/schema-overview.md` (five WebP; `partners.logo_image_id` NOT NULL).
- Update `admin-events.feature` / `admin-partners.feature` (and discovery only if it still claims JPEG) so scenarios match required logos and five WebP variants.
- Log the cutover in `gaps-and-decisions.md`; sync new admin image strings into `content-i18n-inventory.md`; update UI component map / `docs/COMPONENTS.md` if the variant gallery is listed.
- Update `apps/web/DEPLOYMENT.md` admin image section (Pica + WebP; JS required; no sip).
- Align Playwright specs + `coverage-matrix.md` for required partner logo and WebP field/URL assertions (proximity selectors only; keep existing R2 env-skip pattern).
- Confirm residual R2 JPEG→WebP migration is finished or explicitly parked with owner; mark step 04 + parent guide release criteria done.
- Sync planning mirrors under `openspec/specs/` (`image-uploads`, `admin-events`, `partner-catalog`) so they match product SoT — prefer `docs/product/` as behavioral SoT per AGENTS.md.

## Capabilities

### New Capabilities

- _(none)_

### Modified Capabilities

- `image-uploads`: Product SoT / DEPLOYMENT / gaps MUST describe the shipped five-WebP pipeline (no original, open decode acceptance, limits removed, required partner logo, client errors + variant gallery); no remaining “six JPEG” / optional-logo / 800×420 claims as current rules.
- `admin-events`: Gherkin and e2e MUST use five WebP variants (not six JPEG) for primary + gallery image scenarios.
- `partner-catalog`: Gherkin and e2e for admin partners MUST treat logo supply as mandatory on create and assert WebP variant URLs / fields consistent with the pipeline.

## Impact

- **Product SoT:** `docs/product/extras/image-uploads.md`, `database/schema-overview.md`, `features/admin-events.feature`, `features/admin-partners.feature`, optionally `event-discovery.feature`; `extras/gaps-and-decisions.md`, `extras/content-i18n-inventory.md`; `ui/ui-component-map.md` / `docs/COMPONENTS.md` as needed.
- **Deploy docs:** `apps/web/DEPLOYMENT.md`.
- **E2E:** `e2e/specs/admin-events.spec.ts`, `e2e/specs/admin-partners.spec.ts`, fixtures/helpers that still assume JPEG or optional logo; `docs/product/testing/coverage-matrix.md`.
- **Planning mirrors:** `openspec/specs/image-uploads`, `admin-events`, `partner-catalog` (delta sync only; not product SoT).
- **Ops/migration:** residual `scripts/migrate-r2-jpeg-to-webp.ts` run-or-park decision from parent guide.
- **Unchanged this step:** new pipeline features beyond 01–03; partner portal; Phase 6+ billing/email work; variant dimensions / crop UI.
- **Source brief:** `.dev-plan/current-iteration/image-pipeline-04-hardening-and-docs.md`
- **Parent:** `.dev-plan/current-iteration/image-pipeline-parent-guide.md`
- **Depends on:** `image-pipeline-03-client-errors-and-variant-gallery` (implies 01–02) — done
- **Consumed by:** closes the Image pipeline parent feature
- **Verification:** `bun run lint`; `bun run typecheck`; `cd packages/images && bun test`; doc grep for superseded claims; targeted admin image/logo e2e when R2 env present
