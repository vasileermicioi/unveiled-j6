## Why

Phase 5.5 workstream **B** gap **G7**: shipped admin e2e still fills date/time/image fields with `page.locator('input[name=…]')`, and the MVP-required scenario **Supply the event image as a remote URL** is tagged `@skip-no-ui` with no named deferral. Steps 01–02 stabilized the UI DS; this step remediates locators and the skip gate so step 04 can add Discover/public-detail coverage without fighting a11y debt.

## What Changes

- Wire accessible names on admin event date/time (and related) fields so Playwright can use `getByLabel` / roles instead of bare `input[name=…]`
- Replace non-compliant locators in `e2e/specs/admin-events.spec.ts` and `e2e/fixtures/admin.ts` (review `e2e/fixtures/onboarding.ts`)
- Keep native file-input locators only with inline `// BDD exception: file-input`
- Expose remote-URL event image on admin create/edit forms (domain already accepts `imageUrl` / `processImageFromUrl`) and clear `@skip-no-ui` on that scenario — **or**, if blocked, record a named deferral (scenario + reason + target phase) in the parent guide / coverage notes
- Leave `admin-partners` portal-access and venue QR `@skip-no-ui` stubs unchanged (post-MVP)
- Record named deferrals for any remaining G7 locators that cannot be fixed in this step
- Update `docs/product/testing/bdd-and-e2e.md` Known coverage gaps only if G7 / remote-URL status text becomes wrong
- Do **not** add Discover CTA / public-detail Scenario tests (step 04) or expand the BDD exception list without a charter amendment

## Capabilities

### New Capabilities

- `bdd-and-e2e`: Proximity-selector contract for MVP Playwright (gap G7) and the Phase 5.5 `@skip-no-ui` gate for MVP-required vs post-MVP scenarios

### Modified Capabilities

- _(none)_ — product Gherkin for admin events already requires remote URL; this change enforces the testing contract and UI exposure, not a new catalog requirement

## Impact

- **Code:** `apps/web/app/components/admin/EventAdminDateFields.tsx`, `EventImageUpload.tsx`, `EventSeriesForm.tsx` (labels/a11y + remote URL field); `apps/web/app/lib/admin-event-form.ts` / admin-content (parse `imageUrl`, copy); admin event create/edit route handlers if they do not yet pass `imageUrl` through
- **E2E:** `e2e/specs/admin-events.spec.ts`, `e2e/fixtures/admin.ts`, optionally `e2e/fixtures/onboarding.ts`
- **Docs:** parent guide step 03 + any named deferrals; possibly `docs/product/testing/bdd-and-e2e.md` Known coverage gaps
- **Domain (reuse):** `@unveiled/db` catalog already supports exclusive upload vs URL via `attachImageToEvent` / `processImageFromUrl` — prefer wiring UI to that path over new image pipeline work
- **Out of scope:** Discover/public-detail Scenario tests and coverage matrix (step 04); sitemap/release (step 05); Phase 6–8 feature specs; deleting post-MVP partner portal/QR skips; partner logo remote-URL UI unless required to share the same image-field component
