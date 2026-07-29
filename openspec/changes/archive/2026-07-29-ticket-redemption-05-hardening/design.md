## Context

Parent feature: Ticket Redemption (`.dev-plan/current-iteration/ticket-redemption-parent-guide.md`). Steps 01–04 are done/archived: schema + inventory, atomic allocation, admin voucher UI, member mask/reveal + PDF download. Runtime code and `openspec/specs/ticket-redemption` already describe the shipped model.

Gaps to close for release:

| Area | Current state |
|---|---|
| `docs/product/features/booking.feature` | Still outlines `SHARED_GENERATED` / `UNIQUE_PER_BOOKING` / single `VOUCHER` + `promo_code` |
| `docs/product/features/admin-events.feature` | Still requires `secret code mode`, `SHARED_GENERATED` auto-gen, `VOUCHER` + `promoCode` |
| `database/schema-overview.md` | Documents `secret_code_mode` and event-level `promo_code` as live fields |
| Sitemap / UI map | Missing PDF download route and reveal / inventory islands |
| Playwright | Booking redemption outline permanently skips removed modes; no mask/reveal or PDF auth assertions |
| Demo seed | Catalog events are `SECRET_CODE` only (e.g. TARTUFFE); no promo/PDF inventory for multi-ticket demos |
| GDPR export | `buildUserDataExport` returns booking-level `redemption_*` only — no `booking_tickets` |

Constraints:

- Product SoT remains `docs/product/` — OpenSpec deltas are the planning contract to merge into those files.
- No new product behavior beyond polish/bugfixes found while hardening.
- BDD proximity selectors per `docs/product/testing/bdd-and-e2e.md`.
- Grep guard must keep `SHARED_GENERATED` / `UNIQUE_PER_BOOKING` / `secret_code_mode` out of active app/packages (migrations/history exempt).
- Europe/Berlin for demo event dates; staging demo script in parent Release Criteria.

## Goals / Non-Goals

**Goals:**

- Canonical product docs match shipped redemption (three types only).
- Playwright covers SECRET / PROMO / PDF on My Tickets (mask/reveal + PDF download auth).
- Demo seed stocks ≥1 upcoming event per type with enough inventory for multi-ticket books.
- GDPR export includes per-ticket redemption fields.
- Parent guide marks step 05 + feature done; lint/typecheck/grep/demo verification green.

**Non-Goals:**

- Partner portal / door check-in.
- Email PDF attachments or regenerating vouchers in confirmation email.
- New ticket types or resurrecting generated secret-code modes.
- Unrelated Phase 8 marketing rewrites (only incidental copy in touched files).
- Rewriting domain allocation logic (already shipped in 02).

## Decisions

1. **Product Gherkin rewrite (source of truth)**
   - **Choice:** Replace the booking Scenario Outline “Redemption info by ticket type and secret code mode” with scenarios for:
     - `SECRET_CODE` → shared manual `secret_code` on every ticket (no mode column).
     - `VOUCHER_PROMO` → one inventory code per ticket; website link when present.
     - `VOUCHER_PDF` → one PDF per ticket; download via app route.
     - Insufficient inventory → reject (`INSUFFICIENT_VOUCHER_INVENTORY`).
     - Admin cancel → restock unused inventory.
     - Member UI: masked by default; reveal/hide; multi-ticket rows; PDF download ownership.
   - Admin-events: drop mode column and SHARED_GENERATED scenario; require promo inventory + `eventWebsiteUrl` / PDF inventory; defaults without `secretCodeMode`; keep inventory summary / export scenarios aligned with shipped UI.
   - **Rationale:** Spec Delta + parent release criteria; agents read feature files first.
   - **Alternatives:** Leave historical modes in Examples with “removed” notes (rejected — invites reimplementation).

2. **Schema overview + gaps log**
   - **Choice:** Update `schema-overview.md` to `ticket_type` ∈ {SECRET_CODE, VOUCHER_PROMO, VOUCHER_PDF}, remove `secret_code_mode`, document `event_voucher_codes`, `event_voucher_pdfs`, `booking_tickets`, and note legacy `promo_code` only as migration history if still in DB. Add a short gaps-and-decisions entry: modes removed; per-ticket inventory; in-app PDF download (not email).
   - **Rationale:** Prevents Drizzle/schema drift in future phases.
   - **Alternatives:** Only gaps log (rejected — schema overview is agent entry point).

3. **Sitemap + UI component map**
   - **Choice:** Add authenticated member route `/:locale/bookings/:bookingId/tickets/:ticketId/voucher.pdf` (`noindex`, ownership-gated). Map `RevealSecretIsland` (or equivalent), promo/PDF admin inventory islands, and `TicketRedemptionBlock` per-ticket rows in `ui-component-map.md`. Update i18n inventory only if new strings appear during polish.
   - **Rationale:** Parent guide explicitly deferred sitemap/BDD to 05.
   - **Alternatives:** Document only in DEPLOYMENT.md (insufficient for agents).

4. **Playwright strategy**
   - **Choice:**
     - Delete or permanently remove tests titled for SHARED_GENERATED / UNIQUE_PER_BOOKING / legacy VOUCHER outline rows.
     - Add/replace scenarios with verbatim Gherkin titles from the rewritten feature file.
     - Assert on My Tickets and/or confirm: code not plain-text by default; reveal control shows it; multi-ticket promo has N rows; PDF download returns `application/pdf` for owner and denies guest/other user.
     - Prefer seeded demo events (stable titles/IDs helpers) over creating admin events in every test when seed is reliable; admin create path remains covered in admin-events specs for inventory upload.
     - Use proximity selectors (`getByRole`, `getByLabel`, text near ticket ordinal); file uploads keep `// BDD exception: file-input`.
     - Update `e2e/README.md` + coverage matrix rows for booking redemption.
   - **Rationale:** Parent Release Criteria; step Spec Delta “Playwright redemption smoke.”
   - **Alternatives:** Keep skipped outline tests forever (rejected — fails grep/mental model).

5. **Demo seed: three redemption types**
   - **Choice:** Extend demo catalog / `runDemoSeed` so after catalog create:
     - Keep existing SECRET_CODE events (e.g. TARTUFFE) for current e2e.
     - Add (or convert) ≥1 upcoming `VOUCHER_PROMO` event with ≥4 `AVAILABLE` `event_voucher_codes` from a small in-repo promo list.
     - Add ≥1 upcoming `VOUCHER_PDF` event with ≥4 `AVAILABLE` `event_voucher_pdfs` using minimal valid PDF bytes (generated at seed time or checked-in tiny fixtures under `public/` / package fixtures), uploaded via existing R2 helpers when bucket available; support `skipBucket` with DB rows pointing at deterministic keys if that matches other seed patterns.
     - Capacity ≥ inventory count so multi-ticket books work; document titles in DEPLOYMENT.md demo script.
   - **Rationale:** Staging walkthrough needs stocked events without manual admin for every deploy.
   - **Alternatives:** Only document manual admin stocking (fragile for CI/e2e).

6. **GDPR export per-ticket fields**
   - **Choice:** Extend `UserDataExportBooking` with `tickets: Array<{ ordinal, redemptionCode, redemptionUrl, voucherPdfId }>` (or equivalent) loaded via `booking_tickets` for each booking. Keep booking-level `redemption_*` for backward compatibility. Update `gdpr.integration.test.ts` to assert ticket rows for a multi-ticket or SECRET booking.
   - **Rationale:** Step deliverable; export currently omits per-ticket data members see in UI.
   - **Alternatives:** Document-only “verify shape” without code change if already present (it is not).

7. **Grep guard and leftover copy**
   - **Choice:** After doc/e2e updates, run ripgrep across `apps/`, `packages/`, `e2e/`, `docs/product/` for the three banned tokens; allow hits only in migrations, archive, or explicit historical decision notes. Fix incidental “generated code” / wrong marketing only in files already touched.
   - **Rationale:** Step verification item 4.
   - **Alternatives:** CI script in this step (nice-to-have; manual grep satisfies brief).

8. **Parent guide + DEPLOYMENT closeout**
   - **Choice:** Mark child 05 and the feature done in `ticket-redemption-parent-guide.md`. Add a short staging demo script (admin or seed-backed): one event each type; member books multi promo + multi PDF; reveal/hide; PDF download. Note email-PDF remains Non-Goal.
   - **Rationale:** Release Criteria checklist.

## Risks / Trade-offs

- **[Risk] E2E flakiness on reveal island / PDF binary asserts** → Mitigation: assert accessibility name + masked presentation + response headers/content-type; avoid brittle pixel checks.
- **[Risk] Seed PDF upload fails without R2 in local/CI** → Mitigation: follow existing seed `skipBucket` patterns; document `DATABASE_URL` + S3 env for full PDF e2e; allow named skip when secrets missing (step verification already allows documented skip).
- **[Risk] Large Gherkin rewrite drifts from openspec** → Mitigation: keep openspec deltas thin (docs + coverage); domain requirements already correct in `openspec/specs/`.
- **[Risk] GDPR shape change breaks clients** → Mitigation: additive `tickets` array; keep top-level booking redemption fields.
- **[Trade-off] openspec ≠ product SoT** → Implementer MUST update `docs/product/` files, not only archive this change.
- **[Trade-off] Converting an existing demo event vs adding new titles** → Prefer additive new titles so TARTUFFE SECRET e2e stays stable.

## Migration Plan

1. Rewrite product feature files + schema/sitemap/UI/gaps docs.
2. Extend demo seed (promo + PDF inventory); re-seed staging/local.
3. Fix GDPR export + integration test.
4. Replace Playwright redemption scenarios; update README/coverage matrix.
5. Grep guard; lint + typecheck; run targeted e2e (or document env skip).
6. Update DEPLOYMENT.md demo notes; mark parent guide step 05 + feature done.
7. Rollback: revert doc/seed/e2e/GDPR commits; no schema migration expected in this step.

## Open Questions

- None blocking. If staging lacks R2 for seed PDFs, record a named env skip for PDF download e2e and still ship SECRET + PROMO assertions + manual PDF check on staging with admin-uploaded inventory.
