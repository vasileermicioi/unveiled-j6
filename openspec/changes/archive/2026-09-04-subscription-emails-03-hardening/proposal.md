## Why

Steps 01–02 wired both subscription mails (professional invoice mail + single unsubscribe mail), but canonical product docs still describe Resend as booking/waitlist/invoice-only with no unsubscribe mail, and neither mail has Resend-dashboard delivery proof on staging. Until the webhook matrix is verified once-only, docs match what ships, and staging shows both mails, operators cannot trust the release and the parent feature cannot close.

## What Changes

- Verify the full webhook mail matrix with unit coverage: `checkout.session.completed` → no invoice mail; `invoice.paid` + `subscription_create` → invoice mail once (metadata `sent` + event-id idempotency, Stripe-dashboard customer mails OFF); `customer.subscription.updated` → unsubscribe mail once on entering `CANCELLED_PENDING` (already-pending → no resend); `customer.subscription.deleted` → no mail; freeze/past-due → no cancel mail; missing env/recipient → skip 200; transient failure → 500 retry.
- Run staging proof via `stripe listen` + test Checkout/cancel: confirm Resend dashboard shows the invoice mail with `invoice-*.pdf` and the single unsubscribe mail with correct locale links; record message IDs in the handoff (no secrets).
- Sync product docs: extend `credits-subscription.feature` (subscribe/resub professional mail + single-unsubscribe scenario), `extras/content-i18n-inventory.md` (verbatim subjects/body lines for both mails), `extras/integrations-and-config.md` Resend row, `docs/product/testing/coverage-matrix.md` + `e2e/README.md`; `DEPLOYMENT.md` smoke steps for resub and cancel; keep Stripe customer-mail OFF instruction for test+live.
- E2E stays opt-in (`E2E_STRIPE_CHECKOUT=1` + `stripe listen`); default CI seeds subscription state — no new live-network hard dependency in unit tests; BDD titles verbatim where extended.
- Out of scope: further template redesign; new triggers; portal/Checkout UI.

## Capabilities

### New Capabilities

_(none)_ — no new product capability; this is hardening + docs + delivery proof for the two mails shipped in steps 01–02.

### Modified Capabilities

- `credits-subscription`: document and prove both subscription mails — invoice mail on first and repeat `subscription_create` with PDF and once-only metadata, plus exactly one unsubscribe mail on entering `CANCELLED_PENDING` (nothing on final deletion), with skip/retry semantics, locale rule, and staging Resend proof reflected in Gherkin, i18n inventory, integrations config, coverage matrix, and `DEPLOYMENT.md`.

## Impact

- **Runtime:** no intended behavior change. Steps 01–02 already send; this step verifies the matrix and closes unit-test gaps only if the audit finds missing send/skip/retry/no-mail cases.
- **Product SoT:** `docs/product/features/credits-subscription.feature`, `docs/product/extras/content-i18n-inventory.md`, `docs/product/extras/integrations-and-config.md`, `docs/product/extras/gaps-and-decisions.md` (only if a new decision needs logging), `docs/product/testing/coverage-matrix.md`, `e2e/README.md`, `apps/web/DEPLOYMENT.md`.
- **E2E:** `e2e/specs/credits-subscription.spec.ts` — resub + cancel scenarios follow the opt-in Stripe pattern (`E2E_STRIPE_CHECKOUT=1` + `stripe listen`); default CI uses seeded subscription state. Pattern: existing Checkout activation skip + `e2e/specs/booking.spec.ts` email no-harness rationale.
- **Staging/ops:** reuse existing Resend + Stripe secrets; operators must keep Stripe-hosted customer invoice/receipt emails OFF in test + live; record Resend message IDs for invoice + unsubscribe mails in the handoff.
- **Source brief:** `.dev-plan/current-iteration/12-subscription-emails-03-hardening.md`
- **Parent:** `.dev-plan/current-iteration/09-subscription-emails-parent-guide.md`
- **Depends on:** `subscription-emails-02-unsubscribe` (archived `2026-09-04-subscription-emails-02-unsubscribe`)
- **Consumed by:** closes the `subscription-emails` feature.
- **Verification:** `bun run lint`; `bun run typecheck`; `bun test packages/email packages/billing`; staging subscribe → invoice mail with PDF + cancel at period end → single unsubscribe mail + period expiry → no further mail (Resend dashboard IDs recorded).
