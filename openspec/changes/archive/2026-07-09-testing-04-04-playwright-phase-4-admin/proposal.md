## Why

Phase 4 shipped admin partner/event CRUD and public catalog surfaces (`/discover`, `/events/:id`), but none of the Gherkin scenarios in `admin-partners.feature` or `admin-events.feature` have Playwright coverage. This step closes that gap so the admin catalog loop — including image upload/URL paths and public-page propagation — is browser-verified before CI wiring in step 05.

## What Changes

- Add `e2e/specs/admin-partners.spec.ts` — one Playwright test per scenario in `admin-partners.feature` (~13 tests including outline rows): create, logo upload/URL, validation outline (3 rows), edit, rename propagation, delete, QR regenerate, portal access create/exists/email-required/email-in-use.
- Add `e2e/specs/admin-events.spec.ts` — one Playwright test per scenario in `admin-events.feature` (~17 tests including outline rows): single create, image upload/URL/required, redemption validation outline (3 rows), shared generated code, defaults, series manual/date-range, capacity update, edit, delete, optional metadata, export codes, seed-demo empty/no-op.
- Add `e2e/fixtures/admin.ts` — UI helpers (`createPartnerViaUI`, `createEventViaUI`, `deletePartnerViaUI`, `navigateAdminTab`) with unique timestamp suffixes.
- Optional `e2e/fixtures/sample-event.jpg` for the direct-upload path.
- Update `e2e/README.md` — R2 env requirement for image tests; local-only upload note (`bun run dev` + `sharp`, not Workers).
- Embed public catalog assertions in create/edit flows: event title on `/de/discover`, hero/partner/guest CTA on `/de/events/:id`.

**Out of scope:** partner self-service portal (Phase 8), member `/events` feed (Phase 5), Workers-deployed admin uploads, Ladle stories (step 02), CI workflow (step 05).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `event-catalog`: Add requirement that each Gherkin scenario in `admin-partners.feature` and `admin-events.feature` has a matching Playwright test, including public `/discover` and `/events/:id` assertions after admin publish, and clear skip behavior when R2 vars are missing.

## Impact

- **New files:** `e2e/specs/admin-partners.spec.ts`, `e2e/specs/admin-events.spec.ts`, `e2e/fixtures/admin.ts`, optional `e2e/fixtures/sample-event.jpg`.
- **Touched:** `e2e/README.md` (R2 / local-dev image notes).
- **Env:** `E2E_ADMIN_*` required; all six R2 vars (`S3_*`, `IMAGE_PUBLIC_BASE_URL`) required for image tests — otherwise `test.skip('R2 vars not configured')`.
- **Runtime app:** No production code changes expected; proximity selectors only. Prefer remote URL image path in CI; keep one direct-upload test for local Node.
- **Depends on:** `testing-04-01-test-harness` (ADMIN login fixtures).
- **Downstream:** Consumed by `testing-04-05-ci-and-release`; parallel with steps 02–03.
