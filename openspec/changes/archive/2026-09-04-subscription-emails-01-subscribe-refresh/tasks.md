## 1. Setup

- [x] 1.1 Read the step plan, parent guide, and prerequisite files (`packages/email/src/subscription-invoice.ts`, `send-subscription-invoice.ts`, `apps/web/app/lib/subscription-invoice-email.ts`, `email.test.ts` invoice cases) and verify all prerequisite files exist.
- [x] 1.2 Run the baseline `bun test packages/email` and verify it exits 0 before making changes.

## 2. Branded subscribe/resub invoice content

- [x] 2.1 Rework `buildSubscriptionInvoiceContent` DE+EN with preheader, branded header block, greeting, membership summary (Basic Berlin, 29 €, 17/month, no-rollover), PDF-attached note, next-steps list reusing the 5 existing locale links, and support footer using table-based layout with inline styles (max-width 600, escaped interpolations, subjects unchanged), and verify text/HTML render with the expected blocks for both locales.
- [x] 2.2 Keep `sendSubscriptionInvoice` signature and the `subscription_create`-only trigger unchanged while documenting the resub-reuse contract (new `subscription_create` after `INACTIVE` reuses the same neutral-active template, no copy fork), and verify `git diff --stat` shows no orchestrator/billing-lifecycle changes.
- [x] 2.3 Extend `email.test.ts` invoice cases to assert preheader, summary lines, all 5 locale links, text/HTML parity, escaping, and no-rollover wording in both locales with mocked `fetchImpl` (no live network), and verify `bun test packages/email` exits 0.

## 3. Verification

- [x] 3.1 Run `bun run lint` and verify it exits 0.
- [x] 3.2 Run `bun run typecheck` and verify it exits 0.
- [x] 3.3 Run `bun test packages/email` and verify the updated subscribe/resub content cases are green with exit 0.

## 4. Handoff

- [x] 4.1 Prepare a PR or handoff linking change ID `subscription-emails-01-subscribe-refresh` and parent guide `09-subscription-emails-parent-guide.md`, and verify the diff touches only the invoice content builder plus tests.
