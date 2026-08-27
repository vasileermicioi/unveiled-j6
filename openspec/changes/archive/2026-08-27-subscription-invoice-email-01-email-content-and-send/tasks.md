## 1. Setup

- [x] 1.1 Confirm prerequisites exist: `packages/email/src/resend-client.ts` (`sendResendEmail`, `ResendAttachment`), `booking-confirmation.ts` (locale + escaped HTML), `send-booking-confirmation.ts` (attach + send), `email.test.ts`, `getSiteUrl()` with no trailing slash
- [x] 1.2 Skim parent guide release criteria and non-goals (no Stripe in this package, no webhook, no `docs/product/`, no renewal emails)

## 2. Content builder

- [x] 2.1 Add `packages/email/src/subscription-invoice.ts` with `BuildSubscriptionInvoiceInput` (`locale: "de" | "en"`, `siteUrl: string`) and `buildSubscriptionInvoiceContent` → `{ subject, text, html }`
- [x] 2.2 Implement verbatim EN/DE copy from the spec (subjects, no-rollover wording, Basic Berlin / 29€ / 17 credits); build absolute links `{siteUrl}/{locale}/events|bookings|profile/billing|how-it-works|faq` plus `mailto:support@unveiled.berlin`
- [x] 2.3 HTML is paragraph-equivalent with `<p>` / `<a>` / `<strong>` only; escape interpolated `siteUrl` (and any other interpolation) the same way as booking confirmation

## 3. Send helper and exports

- [x] 3.1 Add `packages/email/src/send-subscription-invoice.ts`: `sendSubscriptionInvoice({ apiKey, from, toEmail, locale, siteUrl, pdfBase64, pdfFilename, fetchImpl? })` builds content, attaches one `{ filename, content: pdfBase64, contentType: "application/pdf" }`, calls `sendResendEmail`, returns the Resend result without throwing on HTTP errors
- [x] 3.2 Export builders, send helper, and types from `packages/email/src/index.ts`; do not import `stripe` or `@unveiled/billing`

## 4. Tests

- [x] 4.1 Extend `packages/email/src/email.test.ts`: DE + EN subjects/bodies contain required phrases and absolute links from fake `siteUrl` `https://example.test` (text and HTML)
- [x] 4.2 Mock `fetchImpl` for `sendSubscriptionInvoice` with filename `invoice-in_test.pdf` and known base64; assert one Resend POST with `attachments[0].filename`, `.content`, and `content_type` `application/pdf`; no live network
- [x] 4.3 Run `cd packages/email && bun test` after the new files land

## 5. Cleanup and verification

- [x] 5.1 Run `bun run lint` — exits 0
- [x] 5.2 Run `bun run typecheck` — exits 0
- [x] 5.3 Confirm `cd packages/email && bun test` still passes
- [x] 5.4 Mark `subscription-invoice-email-01-email-content-and-send` done in `.dev-plan/current-iteration/subscription-invoice-email-parent-guide.md`
- [x] 5.5 Do not edit `docs/product/` or AGENTS.md (canonical specs wait for step 03)
