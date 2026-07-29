## 1. Setup

- [x] 1.1 Read step brief `.dev-plan/current-iteration/ticket-redemption-05-hardening.md`, parent guide Release Criteria / Non-Goals, and this change’s `proposal.md` / `design.md` / specs
- [x] 1.2 Confirm prerequisites: steps 01–04 done; locate `booking.feature`, `admin-events.feature`, schema overview, sitemap, UI map, `e2e/specs/booking.spec.ts`, demo seed (`packages/db/src/catalog/seed.ts` + fixtures), `build-user-data-export.ts`

## 2. Product docs sync

- [x] 2.1 Rewrite `docs/product/features/booking.feature` redemption scenarios (three types; mask/reveal; PDF download; insufficient inventory; cancel restock; remove SHARED_GENERATED / UNIQUE_PER_BOOKING / single VOUCHER promo)
- [x] 2.2 Rewrite `docs/product/features/admin-events.feature` redemption validation/defaults (no secret-code mode; VOUCHER_PROMO inventory + website; VOUCHER_PDF inventory; drop SHARED_GENERATED scenario)
- [x] 2.3 Update `docs/product/database/schema-overview.md` for ticket types, inventory tables, `booking_tickets`; remove live `secret_code_mode` / single-promo-as-source docs
- [x] 2.4 Update `docs/product/extras/gaps-and-decisions.md` with shipped decisions (modes removed; per-ticket inventory; in-app PDF download)
- [x] 2.5 Add PDF download route to `docs/product/sitemap/sitemap.md`; document reveal control + inventory islands in `docs/product/ui/ui-component-map.md`; refresh i18n inventory only if new strings appear

## 3. Demo seed and GDPR

- [x] 3.1 Extend demo seed so ≥1 upcoming event exists for SECRET_CODE, VOUCHER_PROMO, and VOUCHER_PDF with ≥4 available inventory rows for voucher types (promo list + minimal PDFs / R2 upload; respect `skipBucket`)
- [x] 3.2 Document seed event titles / demo walkthrough notes in `apps/web/DEPLOYMENT.md` if staging script changes
- [x] 3.3 Extend `buildUserDataExport` with per-ticket redemption fields from `booking_tickets`; update GDPR integration test

## 4. Playwright and coverage

- [x] 4.1 Remove obsolete booking e2e tests for SHARED_GENERATED / UNIQUE_PER_BOOKING / legacy VOUCHER outline
- [x] 4.2 Add/replace Playwright scenarios for the three redemption types: mask/reveal on My Tickets or confirm; multi-ticket promo rows; owner PDF download + guest/other denial (named env skip only if R2 missing)
- [x] 4.3 Align selectors with proximity rules; update `e2e/README.md` and `docs/product/testing/coverage-matrix.md` rows

## 5. Polish, verify, closeout

- [x] 5.1 Fix in-scope polish bugs found while hardening (no new product behavior; no partner check-in / email-PDF)
- [x] 5.2 Grep guard: zero hits for `SHARED_GENERATED`, `UNIQUE_PER_BOOKING`, `secret_code_mode` in active `apps/` / `packages/` / `e2e/` / `docs/product/` (migrations/history/decision notes exempt)
- [x] 5.3 Run `bun run lint` and `bun run typecheck` (exit 0)
- [x] 5.4 Run targeted Playwright booking redemption scenarios (exit 0 or documented env skip)
- [x] 5.5 Mark step 05 and the feature done in `.dev-plan/current-iteration/ticket-redemption-parent-guide.md`; confirm Non-Goals still call out email-PDF if asked during QA
