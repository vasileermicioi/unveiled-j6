## 1. Setup and mapping

- [x] 1.1 Read `admin-partners.feature` and `admin-events.feature`; map each Scenario / Outline row to admin route + form fields + assertions
- [x] 1.2 Confirm local `.env` has `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, and note which of the six R2 vars (`S3_*`, `IMAGE_PUBLIC_BASE_URL`) are present
- [x] 1.3 Run `bun run seed:demo` and note default partner/event titles/IDs useful for public `/discover` and `/events/:id` assertions
- [x] 1.4 Confirm whether admin UI exposes a seed-demo control vs CLI-only; confirm whether sold bookings exist for capacity/export scenarios

## 2. Admin fixtures

- [x] 2.1 Create `e2e/fixtures/admin.ts` with `uniqueSuffix`, `r2Configured`, `navigateAdminTab`, `createPartnerViaUI`, `createEventViaUI`, `deletePartnerViaUI` (proximity selectors; default image via remote URL)
- [x] 2.2 Optionally add `e2e/fixtures/sample-event.jpg` for the direct-upload scenario

## 3. Admin partners specs

- [x] 3.1 Create `e2e/specs/admin-partners.spec.ts` with `beforeEach` → `loginAsAdmin` and verbatim titles for create, logo upload/URL, validation outline (3 rows), edit, rename propagation, delete, QR regenerate
- [x] 3.2 Implement portal-access scenarios (create, already exists, email required, email in use) using `partner-e2e-{timestamp}@example.com`
- [x] 3.3 Wire rename-propagation assertion: after rename, event card on `/de/discover` shows updated partner name
- [x] 3.4 Gate logo image processing tests with `test.skip(!r2Configured(), 'R2 vars not configured')`

## 4. Admin events specs

- [x] 4.1 Create `e2e/specs/admin-events.spec.ts` with `beforeEach` → `loginAsAdmin` and verbatim titles for single create, image upload/URL/required, redemption validation outline (3 rows), shared generated code, defaults
- [x] 4.2 Implement series manual slots and date-range builder scenarios
- [x] 4.3 Implement capacity recalculation, edit details, delete, optional metadata; embed `/de/discover` + `/de/events/:id` public assertions after create/edit
- [x] 4.4 Implement export redemption codes (or explicit skip with Phase 6/seed reason); implement seed-demo empty vs no-op with reset/isolation strategy
- [x] 4.5 Gate image upload/URL processing tests with R2 skip; prefer remote URL in CI, keep one direct-upload test for local Node

## 5. Docs and verification

- [x] 5.1 Update `e2e/README.md` with R2 env requirement for image tests and local-only upload note (`bun run dev` + sharp, not Workers)
- [x] 5.2 Run `bun run test:e2e -- e2e/specs/admin-partners.spec.ts e2e/specs/admin-events.spec.ts` — all non-skipped tests pass
- [x] 5.3 Grep new specs for forbidden selectors (`data-testid`, class/`#id` selectors); ensure every `test.skip` has a reason string
- [x] 5.4 Run `bun run lint` and `bun run typecheck`
- [x] 5.5 Mark step 04 done in `.dev-plan/current-iteration/testing-04-parent-guide.md`
