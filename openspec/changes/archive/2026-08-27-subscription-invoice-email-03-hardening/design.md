## Context

See `proposal.md` for motivation. Parent feature: subscription invoice email (`.dev-plan/current-iteration/subscription-invoice-email-parent-guide.md`), step 03 of 03 — docs, coverage, and operator notes. Canonical product behavior is `docs/product/`; OpenSpec `openspec/specs/` is a planning mirror only.

Runtime already matches parent release criteria (steps 01–02 done / archived):

- `@unveiled/email`: `buildSubscriptionInvoiceContent` + `sendSubscriptionInvoice` (DE/EN verbatim copy, PDF attachment, optional Resend `Idempotency-Key`).
- `@unveiled/billing`: `downloadStripeInvoicePdf` (fresh `invoices.retrieve` then `invoice_pdf` fetch). Checkout stamps `subscription_data.metadata.locale`.
- `apps/web/app/lib/subscription-invoice-email.ts`: `maybeSendSubscriptionInvoiceEmail` after `applyStripeEvent`. Send only for `invoice.paid` + `billing_reason === "subscription_create"`. Skip (HTTP 200): missing Resend env, missing recipient, null `invoice_pdf`, already `unveiled_invoice_email=sent`, wrong event/reason. Retry (HTTP 500): transient PDF/Resend failure. Cycle refill stays in `applyStripeEvent` only.

What remains is the **verification and documentation layer**. Product SoT still lists Resend as booking/waitlist/daily-codes only, and `invoice.paid` as `subscription_cycle` refill only. `DEPLOYMENT.md` has no invoice-email smoke and no Stripe Dashboard customer-email overlap warning.

Constraints: Playwright titles match Gherkin `Scenario:` verbatim (`docs/product/testing/bdd-and-e2e.md`); no inbox harness / Mailosaur; no renewal emails; no new secrets or UI routes; credits do not roll over; copy MUST stay verbatim from step 01.

## Goals / Non-Goals

**Goals:**

- Bind Gherkin, integrations extras, i18n inventory, gaps-and-decisions, coverage matrix, DEPLOYMENT, and a skipped Playwright title to the shipped invoice email.
- Tell operators to disable Stripe-hosted customer invoice/receipt emails in test + live.
- Close remaining unit-test gaps if the audit finds any; otherwise leave 01–02 tests as-is.
- Close the parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- Changing send/download/webhook behavior, Checkout UX, or `applyStripeEvent` credit rules.
- Adding an inbox e2e harness, Mailosaur, or a passing Playwright inbox assertion.
- Renewal / `subscription_cycle` invoice emails.
- New env vars, R2/Postgres PDF storage, member-facing invoice list, Partner emails, HeroUI in emails.
- Adding Stripe Dashboard webhook event types (still the same five events).
- A second Gherkin scenario for operator docs (that requirement lives in `DEPLOYMENT.md`; putting it in the feature file would force a Playwright-mapped test about reading markdown).

## Decisions

1. **Docs and Gherkin first, then skipped Playwright, then matrix, then close-out**
   - **Choice:** Update `credits-subscription.feature` + extras + DEPLOYMENT → add skipped e2e title → coverage-matrix row + Phase 8 named-deferral list → unit-test audit → parent close-out.
   - **Rationale:** E2E titles must match Gherkin verbatim; avoid matrix title drift. Same order as featured-events-manager-03.
   - **Alternatives:** Flip e2e before Gherkin (title drift); close parent before matrix (release criteria incomplete).

2. **One product Gherkin scenario; operator overlap is DEPLOYMENT-only**
   - **Choice:** Feature file gets exactly **`Scenario: Subscription invoice email after first successful payment`**, placed after **Activating a subscription via real Stripe Checkout**. DECISIONS block gets a short rewrite note (Unveiled branded receipt + Stripe PDF; no renewal send; Dashboard customer invoice/receipt emails off). Do **not** add `Operator docs mention invoice email and Stripe Dashboard overlap` to the `.feature` file.
   - **Rationale:** Step deliverables name the member scenario. BDD file-mapping requires a Playwright `test("Scenario: …")` for every feature-file Scenario; an operator-docs scenario would be a fake e2e. The OpenSpec delta still includes the operator scenario as a documentation contract.
   - **Alternatives:** Two Gherkin scenarios (forces a skipped Playwright about DEPLOYMENT.md). Fold invoice email into the existing Checkout activation scenario (hides a distinct observable; matrix would not get its own skip row).

3. **Playwright skip mirrors booking confirmation — no inbox harness**
   - **Choice:** In `e2e/specs/credits-subscription.spec.ts`:

     ```ts
     test("Scenario: Subscription invoice email after first successful payment", async () => {
       test.skip(
         true,
         "No email capture harness in Playwright; assert via Resend dashboard on staging smoke (DEPLOYMENT.md Phase 6)",
       );
     });
     ```

     Place it immediately after `Scenario: Activating a subscription via real Stripe Checkout`. Do not call Stripe Checkout or Resend from this test.
   - **Rationale:** Step brief: same skip rationale as booking confirmation; file-mapping rule; no Mailosaur.
   - **Alternatives:** Opt-in `E2E_STRIPE_CHECKOUT=1` plus inbox poll (out of scope). Document-only (no spec test) — violates BDD rule 2.

4. **Coverage matrix: `skip` + named close-out row; unit tests are the proof**
   - **Choice:** New matrix row under `credits-subscription.feature`:

     | Feature | Scenario | Spec | Status | Notes |
     |---|---|---|---|---|
     | `credits-subscription.feature` | Subscription invoice email after first successful payment | `e2e/specs/credits-subscription.spec.ts` · `Scenario: Subscription invoice email after first successful payment` | `skip` | No inbox harness; staging Resend checklist; unit tests in `@unveiled/email`, `@unveiled/billing`, `apps/web/app/lib/subscription-invoice-email.test.ts` |

     Also add a named-deferral line in the Phase 8 close-out table next to Booking confirmation email.
   - **Rationale:** Step allows skip **or** pass-via-unit-tests; skip + matrix note is the booking-email pattern and keeps CI green without pretending inbox e2e exists.
   - **Alternatives:** Matrix `pass` with “unit tests only” and no Playwright test (breaks file-mapping). New e2e harness (forbidden).

5. **`invoice.paid` docs: split purpose, do not add events**
   - **Choice:** Keep the five Dashboard events. Change the `invoice.paid` purpose cell (both `integrations-and-config.md` and `DEPLOYMENT.md`) to state:
     - `billing_reason === "subscription_cycle"` → monthly credit refill (unchanged).
     - `billing_reason === "subscription_create"` → send Unveiled invoice email with Stripe PDF; **no** second `SUBSCRIPTION_REFILL` (activation refill stays on `checkout.session.completed`).
   - **Rationale:** Step scope; webhook list is already correct; the lie is the purpose text.
   - **Alternatives:** Add a second table row for the same event (confusing). Document a new event type (wrong).

6. **Resend extras + i18n: transactional invoice section, verbatim step-01 copy**
   - **Choice:** `integrations-and-config.md` Resend row: also first-paid-subscription invoice email (`features/credits-subscription.feature`) with Stripe invoice PDF. `DAILY_CODES_FROM_EMAIL` remains the From address (no new secret). `content-i18n-inventory.md`: new section **Transactional emails — subscription invoice** (not a `translations.ts` key table) with EN/DE subjects and body lines copied verbatim from step 01 (`Your Unveiled Berlin invoice` / `Deine Unveiled Berlin Rechnung`, no-rollover wording, locale-prefixed `{SITE_URL}/…` links, `support@unveiled.berlin`). Point at `packages/email/src/subscription-invoice.ts`.
   - **Rationale:** Step 01 copy is locked; inventory is the structured catalog for agents; emails are not HeroUI/`translations.ts`.
   - **Alternatives:** Invent i18n keys (`invoiceEmailSubject`) without matching runtime keys (misleading). Only mention “see email package” without strings (step requires verbatim inventory).

7. **DEPLOYMENT smoke + Stripe customer-email overlap**
   - **Choice:**
     - Staging smoke: after successful test Checkout (`4242…`), confirm in Resend that the member got the invoice email with a PDF named `invoice-*.pdf` (when `RESEND_*` set). Keep the existing booking `.ics` smoke separate.
     - New operator note (Stripe + Resend subsection): in **test and live** Stripe Dashboards, turn **off** customer-facing invoice and receipt emails (Settings → Billing emails / Customer emails — invoices, receipts, successful payments). Unveiled Resend is the product receipt. Do not change webhook event selection. Exact Dashboard labels may shift; the intent is “no Stripe-hosted invoice/receipt to the member.”
     - Update `DAILY_CODES_FROM_EMAIL` one-liner so it also covers the invoice From address.
     - Do **not** rewrite the Phase 6 line about event **voucher** PDF attachments remaining in-app download (that is a different PDF).
   - **Rationale:** Parent-guide risk; members otherwise get Stripe’s PDF email plus Unveiled’s.
   - **Alternatives:** Leave Stripe emails on (duplicate receipts). Document a Dashboard API toggle in code (out of scope; no new integration).

8. **Unit-test audit, not a new suite**
   - **Choice:** Do not rewrite existing tests. After docs land, grep/read:
     - `packages/email/src/email.test.ts` — DE/EN copy + PDF attach + Idempotency-Key (already present).
     - `packages/billing` — PDF download + Checkout locale + `subscription_create` ignored for refill (already present).
     - `apps/web/app/lib/subscription-invoice-email.test.ts` — create send, cycle skip, already-sent, missing env, missing PDF, retry on download/send (already present).
     - **Likely gap:** `missing_recipient` skip (orchestrator returns it; no test as of step 02). Add that one case if still missing. Add nothing else unless the audit finds a hole in copy / skip / idempotency / cycle-does-not-send.
   - **Rationale:** Step says fill remaining gaps, not re-prove the feature.
   - **Alternatives:** Duplicate OpenSpec scenarios as new e2e (forbidden harness). Skip the audit (release criteria want tests green and complete).

9. **OpenSpec mirror vs product SoT**
   - **Choice:** This change’s `credits-subscription` delta is the planning contract. Apply updates `docs/product/` as SoT. Do not treat `openspec/specs/` as behavioral SoT. After apply, mark the parent step done. Archive will merge the delta into `openspec/specs/credits-subscription/spec.md`; that is enough — do not hand-edit the main OpenSpec spec during apply unless archive is not used.
   - **Rationale:** AGENTS.md / step Cleanup.
   - **Alternatives:** Sync OpenSpec only — agents would still follow stale Gherkin.

## Risks / Trade-offs

- **[Risk] Operators leave Stripe customer emails on → members get two invoices** → Mitigation: explicit DEPLOYMENT checklist in test + live; gaps-and-decisions row; smoke step checks Resend, not Stripe’s inbox.
- **[Risk] Stale “Resend = booking/waitlist only” or “`invoice.paid` = refill only” survives in an unlisted file** → Mitigation: grep `docs/product` and `DEPLOYMENT.md` after edits (see tasks).
- **[Risk] Confusing invoice PDF with event voucher PDF copy in DEPLOYMENT** → Mitigation: add invoice smoke without deleting the voucher “in-app download” note.
- **[Risk] Matrix/`@skip-no-ui` folklore** → Mitigation: skip reason is “no inbox harness,” never “UI not built”; named in Phase 8 close-out table.
- **[Trade-off] Playwright never asserts the email** → Acceptable; same as booking confirmation; unit tests + staging Resend checklist are the proof.
- **[Trade-off] Operator scenario is not Gherkin** → Operators follow DEPLOYMENT; BDD file-mapping stays honest.

## Migration Plan

1. Land docs + skipped e2e title + matrix + optional `missing_recipient` test together. No schema/API migration, no new secrets, no Dashboard webhook-event change.
2. After deploy: operators disable Stripe customer invoice/receipt emails in **test** (staging) and **live** (production) Dashboards; run one test Checkout and confirm Resend + PDF.
3. Existing subscriptions already emailed in step 02 keep `unveiled_invoice_email=sent`; docs-only change does not re-send.
4. Rollback: revert the docs/e2e/test commit; runtime send path from step 02 remains.
5. After merge: mark step 03 + parent guide done (feature released); archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — runtime is shipped; Dashboard email-setting labels can be described by intent if Stripe renames the page.)_
