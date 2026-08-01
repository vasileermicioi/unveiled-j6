## Why

Step 01 landed `country` / `city` / `zip_code` at schema and domain, but admin authoring still has a compile-shim zip field with **hidden** country/city, and seed/public copy still carry neighborhood-era leftovers. This step makes Germany/Berlin the visible fixed location context, zip the editable PLZ control, and public cards/detail show zip instead of Kiez labels.

## What Changes

- Admin create/edit/(series via shared base fields): replace shim location UI with **prefilled, non-editable** country (Germany / Deutschland) and city (Berlin) plus a **native** zip/PLZ input with helper copy that the value must be a Berlin PLZ.
- Keep SSR form POST wiring for `zip_code` (+ optional/explicit `country`/`city`); map `PostalValidationError` to admin-visible field errors (already partially present — complete copy/helpers as needed).
- Public EventCard + EventDetailPage DETAILS/LOCATION: present zip (not neighborhood); country/city MAY appear on detail only, must not dominate cards while product is Berlin-only.
- Update demo seed / story fixtures / Abundo mapping leftovers so events use `DE` / `berlin` + real Berlin zips.
- Remove dead `getEventNeighborhoodOptions` (and equivalent neighborhood option helpers) if still present/unused.
- Out of scope: onboarding/profile zip UX (step 03); Gherkin/docs/e2e polish (step 04); city/country picker; travel distance.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Admin location authoring collects Berlin PLZ under fixed Germany/Berlin (not neighborhood/Kiez select); invalid zip surfaces an admin-visible error.
- `event-discovery`: Public cards and detail show event zip instead of neighborhood/Kiez; no Bezirk labels reintroduced.

## Impact

- **Admin UI:** `EventAdminBaseFields.tsx`, `admin-event-form.ts`, `admin-content.ts` (labels/hints/errors DE+EN), series forms if they share base fields, stories.
- **Public UI:** `EventDetailPage.tsx` metadata, `@unveiled/ui` `EventCard` (already zip-capable — verify labels/fixtures), related mappers.
- **Seed / fixtures:** `packages/db` seed-data / Abundo fixtures, `apps/web` story fixtures; drop neighborhood-only helpers where unused.
- **Unchanged:** Domain `validatePostalCode` / catalog APIs from step 01; address + geocode preview; onboarding/profile UI (03); product Gherkin/schema-overview wording (04).
- **Source brief:** `.dev-plan/current-iteration/berlin-zip-code-02-admin-and-public-ui.md`
- **Parent:** `.dev-plan/current-iteration/berlin-zip-code-parent-guide.md`
- **Depends on:** `berlin-zip-code-01-schema-and-domain` (done)
- **Consumed by:** `berlin-zip-code-04-docs-and-e2e`
- **Verification:** `bun run lint`; `bun run typecheck`; manual smoke create/edit with valid/invalid Berlin PLZ + public detail shows zip
