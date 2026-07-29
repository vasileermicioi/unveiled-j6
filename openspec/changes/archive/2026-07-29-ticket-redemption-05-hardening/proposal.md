## Why

Steps 01–04 shipped the redemption vertical slice (schema, allocation, admin stocking, member reveal/download), but canonical `docs/product/` Gherkin, schema overview, sitemap/UI map, Playwright, and demo seed still describe removed modes (`SHARED_GENERATED` / `UNIQUE_PER_BOOKING` / single `VOUCHER` `promo_code`). Without hardening, future agents will reintroduce dead behavior and the feature cannot meet parent release criteria.

## What Changes

- Rewrite Gherkin in `booking.feature` and `admin-events.feature`: only `SECRET_CODE` (manual), `VOUCHER_PROMO` (line-file inventory), `VOUCHER_PDF` (split-PDF inventory); add masked reveal, PDF download, cancel restock, inventory capacity scenarios.
- Align Playwright (`e2e/specs/booking.spec.ts`, admin event specs as needed) with proximity selectors per `docs/product/testing/bdd-and-e2e.md`; remove obsolete generated-mode tests; cover mask/reveal + authorized PDF download for all three types.
- Update product docs: `database/schema-overview.md`, `extras/gaps-and-decisions.md`, `sitemap/sitemap.md` (PDF route), `ui/ui-component-map.md` (inventory islands, reveal control), i18n inventory if new strings.
- Extend `bun run seed:demo` so at least one upcoming event exists per redemption type with enough inventory for multi-ticket books (promo file + sample/minimal PDFs).
- Confirm GDPR export includes per-ticket redemption fields; fix if booking-level-only today.
- Grep guard: zero hits for `SHARED_GENERATED`, `UNIQUE_PER_BOOKING`, or `secret_code_mode` in active app/packages code (migrations/history exempt).
- Mark step 05 and the feature done in the parent guide; note staging demo walkthrough in `apps/web/DEPLOYMENT.md` if needed.
- Out of scope: partner check-in; Stripe/email PDF attachments; new ticket types; unrelated Phase 8 marketing copy (fix “credits roll over” / generated-code copy only if touched incidentally).

## Capabilities

### New Capabilities

- _(none)_ — hardening closes `ticket-redemption` and keeps product SoT / e2e in sync; no new domain capability.

### Modified Capabilities

- `ticket-redemption`: Canonical product docs MUST match shipped redemption; automated coverage MUST exercise all three redemption types (mask/reveal + PDF download auth).
- `booking`: Product-facing redemption scenarios and My Tickets / confirm e2e align with per-ticket inventory model (no secret-code modes; no single shared promo).
- `admin-events`: Admin Gherkin / e2e drop secret-code modes and single `promo_code`; document inventory upload/export paths already implemented.
- `bdd-and-e2e`: Booking redemption Playwright scenarios are live (not permanently skipped for removed modes) and use proximity/layout selectors.

## Impact

- **Product SoT:** `docs/product/features/booking.feature`, `admin-events.feature`, `database/schema-overview.md`, `extras/gaps-and-decisions.md`, `sitemap/sitemap.md`, `ui/ui-component-map.md`, optionally `extras/content-i18n-inventory.md`.
- **E2E:** `e2e/specs/booking.spec.ts`, related fixtures (`e2e/fixtures/admin.ts`), `e2e/README.md` notes.
- **Seed:** demo seed under `@unveiled/db` / `scripts/seed-demo.ts` — one event each of SECRET / PROMO / PDF + inventory.
- **GDPR:** `packages/db/src/gdpr/build-user-data-export.ts` (+ tests) if per-ticket fields missing.
- **Polish:** in-scope bugfixes found while hardening; no new product behavior beyond release polish.
- **Source brief:** `.dev-plan/current-iteration/ticket-redemption-05-hardening.md`
- **Parent:** `.dev-plan/current-iteration/ticket-redemption-parent-guide.md`
- **Depends on:** `ticket-redemption-04-member-bookings-ui` (and 01–03; archived / done)
- **Consumed by:** closes the Ticket Redemption feature
- **Verification:** `bun run lint`; `bun run typecheck`; targeted Playwright redemption scenarios; grep guard; staging demo from parent Release Criteria
