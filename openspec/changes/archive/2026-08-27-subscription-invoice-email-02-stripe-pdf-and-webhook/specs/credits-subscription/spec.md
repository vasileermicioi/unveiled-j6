## ADDED Requirements

### Requirement: Invoice PDF email after successful first subscription payment

The system SHALL, after a verified Stripe `invoice.paid` event whose `billing_reason` is `subscription_create`, download the invoice PDF from Stripe (`invoice.invoice_pdf` on a finalized invoice; always use a freshly retrieved URL) and send the subscription invoice email from `@unveiled/email` with that PDF attached. The send SHALL NOT run for `subscription_cycle` or other billing reasons. Credit ledger and subscription status updates SHALL continue to use the existing `applyStripeEvent` path unchanged. A successful send SHALL be recorded on the Stripe invoice (metadata) so webhook retries do not send a second email. Missing Resend configuration SHALL skip the email and MUST NOT fail activation. Missing `invoice_pdf` SHALL skip and log. Transient download or Resend failures MAY return a 5xx so Stripe retries. Membership Checkout SHALL store the UI locale on Stripe subscription metadata for this email.

#### Scenario: First paid subscription invoice emails the Stripe PDF

- **WHEN** Stripe delivers a verified `invoice.paid` event with `billing_reason` `subscription_create` and a finalized invoice PDF
- **AND** `RESEND_API_KEY` and `DAILY_CODES_FROM_EMAIL` are set
- **THEN** the member receives one email whose attachment is the Stripe invoice PDF
- **AND** the body uses `SITE_URL` locale links from step 01
- **AND** subscription activation / credit refill behavior is unchanged from the existing Checkout + webhook path

#### Scenario: Renewal invoices do not send this email

- **WHEN** Stripe delivers `invoice.paid` with `billing_reason` `subscription_cycle`
- **THEN** credits refill as today
- **AND** the subscription invoice email is not sent

#### Scenario: Webhook retry does not duplicate the email

- **WHEN** the same paid first invoice is delivered again after a successful send
- **THEN** the system does not send a second email

#### Scenario: Resend unset skips email without failing billing

- **WHEN** the first invoice is paid but Resend env is unset
- **THEN** the webhook does not send mail
- **AND** subscription/ledger application still succeeds

## MODIFIED Requirements

### Requirement: Real Stripe Checkout activation

The system SHALL start a Stripe Checkout Session for the Basic Berlin price when a signed-in member with a non-frozen, non-active subscription submits the membership checkout action, and SHALL activate the subscription only after a verified Stripe webhook confirms success. Checkout Session creation SHALL omit `payment_method_types` so Stripe dynamic payment methods apply. Activation SHALL set subscription status to `ACTIVE`, record a `SUBSCRIPTION_REFILL` ledger entry of +17, set the member credit balance to exactly 17 (forfeiting any prior balance via `EXPIRY` when needed), store Stripe customer/subscription identifiers, and allow the member to proceed to the events feed after Checkout return. Checkout SHALL copy the membership page locale (`de` | `en`) into `subscription_data.metadata.locale` (in addition to existing `userId` metadata) so the invoice email can be localized without a request URL.

#### Scenario: Activating a subscription via real Stripe Checkout

- **WHEN** Checkout completes successfully and `checkout.session.completed` (or an equivalent confirmed subscription event) is verified
- **THEN** subscription status becomes `ACTIVE`, a `SUBSCRIPTION_REFILL` ledger entry of +17 is recorded, and the member can proceed to the events feed

#### Scenario: Checkout stores locale for invoice email

- **WHEN** a member starts Checkout from `/{locale}/membership`
- **THEN** the Stripe subscription metadata includes `locale` equal to that route locale

#### Scenario: Checkout blocked while frozen

- **WHEN** subscription status is `UNPAID`
- **THEN** Checkout is not started and the member sees a payment-stopped message with support contact info

#### Scenario: Already-active member revisits checkout

- **WHEN** an `ACTIVE` member visits `/membership`
- **THEN** they see an already-active/success state instead of a payment form

#### Scenario: Guest visits membership

- **WHEN** a guest visits `/membership`
- **THEN** they see plan marketing content and an authentication CTA rather than a Checkout start form
