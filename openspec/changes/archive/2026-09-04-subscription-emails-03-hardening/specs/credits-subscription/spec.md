## ADDED Requirements

### Requirement: Subscription email release coverage

The system SHALL document and prove both subscription mails: the invoice mail on first and repeat `subscription_create` with the Stripe PDF and once-only metadata, plus exactly one unsubscribe mail on entering `CANCELLED_PENDING` (nothing on final deletion), with skip/retry semantics, locale rule, and staging Resend proof reflected in Gherkin, i18n inventory, integrations config, coverage matrix, and `DEPLOYMENT.md`.

#### Scenario: Email release is provable

- **WHEN** the staging subscribe/cancel/expiry flow runs with Resend configured and Stripe customer mails off
- **THEN** the dashboard shows one invoice mail with PDF plus one unsubscribe mail at cancel time and no mail at final expiry, and docs describe both sends
