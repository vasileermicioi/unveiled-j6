## 1. Setup

- [x] 1.1 Read step plan `.dev-plan/current-iteration/spec-alignment-03-bdd-locators-and-skips.md`, parent guide, `docs/product/testing/bdd-and-e2e.md` §§3–5, and this change’s proposal/design/specs
- [x] 1.2 Confirm steps 01–02 are done in the parent guide (Theme Overview + DS ownership)
- [x] 1.3 Inventory `page.locator` / `@skip-no-ui` in `e2e/specs/admin-events.spec.ts`, `e2e/fixtures/admin.ts`, `e2e/fixtures/onboarding.ts`, and `e2e/specs/admin-partners.spec.ts` (baseline counts for the PR)

## 2. Admin form a11y (date/time)

- [x] 2.1 Associate accessible names on `EventAdminDatePicker` / `EventAdminTimeField` (and series slot/builder fields that reuse or duplicate the pattern) so Playwright `getByLabel` resolves them; keep SSR `name` attributes
- [x] 2.2 Verify labels match admin copy (`eventDateLabel` / `eventTimeLabel` / series labels) in both `de` and `en`

## 3. Remote URL event image UI

- [x] 3.1 Add labeled remote URL text field to `EventImageUpload` (HeroUI only; no radios/checkboxes); adjust file `required` so URL-only create can succeed client-side while server still enforces exclusive upload XOR URL
- [x] 3.2 Extend `parseEventFormBody` / `EventFormValues` to read `image_url` (or agreed field name) and pass `imageUrl` into catalog create/update paths that already call `attachImageToEvent`
- [x] 3.3 Add de/en admin copy for the URL field and hint; keep upload XOR URL validation errors user-visible on the SSR form

## 4. E2E locator remediation

- [x] 4.1 Replace `input[name=event_date|event_time|slot_*|builder_*]` locators in `e2e/specs/admin-events.spec.ts` and `e2e/fixtures/admin.ts` with `getByLabel` / proximity helpers
- [x] 4.2 Annotate remaining file-input locators (`image`, partner `logo`) with `// BDD exception: file-input`
- [x] 4.3 Replace `img[src*=".jpg"]` (and any other non-exception `page.locator`) with proximity/role assertions, or list as a named deferral
- [x] 4.4 Review `e2e/fixtures/onboarding.ts`; change only if a trivial proximity improvement is clear — do not expand onboarding scope
- [x] 4.5 Implement **Supply the event image as a remote URL** without `@skip-no-ui` (stable public URL + R2 env-skip if needed), **or** record named deferral (scenario + reason + target phase) in the parent guide
- [x] 4.6 Confirm `admin-partners` portal-access / venue QR `@skip-no-ui` stubs are unchanged

## 5. Validation

- [x] 5.1 Run `bun run lint` — exit 0
- [x] 5.2 Run `bun run typecheck` — exit 0
- [x] 5.3 Run `bun run test:e2e -- e2e/specs/admin-events.spec.ts` (or project-equivalent filter) — in-scope scenarios pass; remote-URL passes or is explicitly deferred
- [x] 5.4 Run `rg -n "page\\.locator\\(" e2e/specs/admin-events.spec.ts e2e/fixtures/admin.ts` — remaining hits are file-input exceptions or listed deferrals
- [x] 5.5 Confirm no new `data-testid`, CSS-class, or `#id` selectors were introduced in e2e

## 6. Cleanup

- [x] 6.1 Mark step 03 done in `.dev-plan/current-iteration/spec-alignment-parent-guide.md`; attach any named deferral names under Risks
- [x] 6.2 Update `docs/product/testing/bdd-and-e2e.md` Known coverage gaps only if G7 / remote-URL status text is now wrong
- [x] 6.3 Hand off remaining Discover/public-detail scenario gaps to step 04 — do not start step 04 implementation in this change
