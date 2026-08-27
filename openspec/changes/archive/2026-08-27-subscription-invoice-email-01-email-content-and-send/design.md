## Context

See `proposal.md` for motivation. Parent feature: subscription invoice email (`.dev-plan/current-iteration/subscription-invoice-email-parent-guide.md`), step 01 of 03.

Current state in `@unveiled/email`:

- `sendResendEmail` posts to `https://api.resend.com/emails` with optional attachments (`filename`, base64 `content`, optional `contentType` → Resend `content_type`). HTTP errors are returned as `{ ok: false, status, error }` — never thrown.
- Booking and waitlist mail follow the same split: `build*Content({ locale, … })` → `{ subject, text, html }`, then `send*` attaches an ICS and calls `sendResendEmail`.
- HTML is simple escaped `<p>` / `<a>` / `<strong>` (not HeroUI). `escapeHtml` is a local helper duplicated in `booking-confirmation.ts` and `waitlist-promotion.ts`.
- `getSiteUrl()` in `apps/web/app/lib/site-config.ts` strips a trailing slash. This package does not read env; callers pass `siteUrl`.

Constraints: package MUST NOT import `stripe` or `@unveiled/billing`; from-address is a caller argument (`DAILY_CODES_FROM_EMAIL` at the webhook later); product docs / Gherkin wait for step 03.

## Goals / Non-Goals

**Goals:**

- Mirror the booking/waitlist module split: content builder + send helper + public exports + offline unit tests.
- Verbatim DE/EN copy from the spec delta, including no-rollover wording and absolute `{siteUrl}/{locale}/…` links.
- Attach exactly one caller-supplied PDF (`application/pdf`); do not generate or fetch the PDF here.

**Non-Goals:**

- Stripe invoice PDF download, webhook wiring, Checkout metadata, idempotency keys (step 02).
- Canonical `docs/product/` / Gherkin / `DEPLOYMENT.md` (step 03).
- Renewal (`subscription_cycle`) emails.
- Shared `EmailLocale` extraction or a shared `escapeHtml` module (duplicate the existing 4-line helper unless a tiny util already exists).
- Reading `SITE_URL` / Resend env from this package.

## Decisions

1. **Two new modules, same shape as booking mail**
   - `packages/email/src/subscription-invoice.ts` — `BuildSubscriptionInvoiceInput` (`locale: "de" | "en"`, `siteUrl: string`) and `buildSubscriptionInvoiceContent` → `{ subject, text, html }`.
   - `packages/email/src/send-subscription-invoice.ts` — `sendSubscriptionInvoice` builds content, attaches `{ filename: pdfFilename, content: pdfBase64, contentType: "application/pdf" }`, calls `sendResendEmail`.
   - **Rationale:** Booking and waitlist already split content vs send; step 02 only needs the send helper.
   - **Alternatives:** One file (harder to test content vs transport); generate HTML from the text string (fragile with anchors / mailto).

2. **Locale union is local, not `BookingLocale`**
   - Use `"de" | "en"` on `BuildSubscriptionInvoiceInput` (optionally alias `SubscriptionInvoiceLocale`). Do not import `BookingLocale` — invoice mail is not a booking.
   - **Rationale:** Avoid coupling membership receipts to booking types.
   - **Alternatives:** Extract shared `EmailLocale` (unnecessary for two values); reuse `BookingLocale` (misleading).

3. **`siteUrl` is an already-normalized origin**
   - Callers pass the public origin **without** a trailing slash (same contract as `getSiteUrl()`). Links are `` `${siteUrl}/${locale}/events` `` (and bookings, `profile/billing`, `how-it-works`, `faq`). Do not strip slashes inside the builder unless tests prove a trailing slash leaks into hrefs — the spec says callers MUST pass no trailing slash.
   - **Rationale:** Step plan + `site-config.ts`; this package must not read env.
   - **Alternatives:** Strip trailing slash defensively (harmless, but hides caller bugs); read `SITE_URL` here (rejected — package boundary).

4. **Copy is verbatim; HTML is paragraph-equivalent with anchors**
   - Text: implement the exact DE/EN blocks from the spec (one sentence per line, blank line between blocks). Subjects: EN `Your Unveiled Berlin invoice` / DE `Deine Unveiled Berlin Rechnung`.
   - HTML: same facts in `<p>` blocks; wrap each URL in `<a href="…">` (visible href = same absolute URL); support is `<a href="mailto:support@unveiled.berlin">support@unveiled.berlin</a>`. Escape interpolated `siteUrl` (and any other interpolation) with the same `escapeHtml` pattern as booking mail. Allowed tags: `<p>`, `<a>`, `<strong>`, `<br/>` if needed for the plan/credits lines.
   - Plan name **Basic Berlin**, **29€/month** / **29€/Monat**, **17 credits** / **17 Credits**, no-rollover (`unused credits do not roll over` / `ungenutzte Credits verfallen`) are literals, not inputs — MVP is a single plan.
   - **Rationale:** Spec delta is the copy contract; HeroUI is forbidden in emails.
   - **Alternatives:** i18n JSON files (overkill for one template); parameterize plan/price (out of scope — single Basic Berlin plan).

5. **Send helper signature matches the step plan**
   - `sendSubscriptionInvoice({ apiKey, from, toEmail, locale, siteUrl, pdfBase64, pdfFilename, fetchImpl? })` → `SendResendEmailResult`.
   - `to` is `toEmail`; one attachment; optional `fetchImpl` for tests (same as booking).
   - Do **not** throw on Resend HTTP errors. Do **not** add Resend `Idempotency-Key` here (step 02 owns webhook retries).
   - **Rationale:** Same post-commit policy as booking mail; PDF bytes are opaque.
   - **Alternatives:** Fetch PDF inside the helper (rejected — Stripe stays out of this package); accept `Uint8Array` (step plan says base64, matching `ResendAttachment.content`).

6. **Tests stay in `email.test.ts` with mock `fetchImpl`**
   - Content: fake `siteUrl` `https://example.test`; assert exact subjects; assert text **and** HTML contain required phrases and the five absolute locale-prefixed links plus `support@unveiled.berlin`; EN/DE no-rollover wording.
   - Send: `pdfFilename` `invoice-in_test.pdf`, known base64; parse the Resend JSON body; assert `attachments[0].filename`, `.content`, and `content_type` `application/pdf`; assert a single POST to `https://api.resend.com/emails`; no live network.
   - **Rationale:** Mirrors `sendBookingConfirmation` tests; Resend wire format uses `content_type`.
   - **Alternatives:** Separate `subscription-invoice.test.ts` (fine if the file grows; default is extend the existing file per the step plan).

7. **Exports**
   - From `packages/email/src/index.ts`: `buildSubscriptionInvoiceContent`, `sendSubscriptionInvoice`, and input/content types (`BuildSubscriptionInvoiceInput`, `SubscriptionInvoiceContent` or reuse a small `{ subject, text, html }` type — either a dedicated type or the same shape as `BookingConfirmationContent` without importing that name).
   - **Rationale:** Step 02 imports from `@unveiled/email` only.

## Risks / Trade-offs

- **[Risk] HTML diverges from text (missed link or unescaped href)** → Mitigation: tests assert both text and HTML contain the same absolute URLs; escape `siteUrl` in `href` and link text.
- **[Risk] Caller passes `siteUrl` with a trailing slash → `https://x.test//en/events`** → Mitigation: document the no-trailing-slash contract; do not silently “fix” it unless a one-line `replace(/\/$/, "")` is clearly cheaper than a bad email. Prefer documenting + tests with a slash-free URL.
- **[Trade-off] Hard-coded Basic Berlin / 29€ / 17 credits** → Correct for MVP; step 02 still does not need plan inputs. Changing the plan later means editing this template (and step 03 copy inventory).
- **[Trade-off] Duplicate `escapeHtml`** → Matches waitlist; extracting a util is optional and not required for apply.
- **[Risk] Helpers exist but no webhook sends them until step 02** → Mitigation: parent guide; do not claim members receive invoices in this PR.

## Migration Plan

1. Land package-only files + tests; no production caller yet — runtime email behavior unchanged until step 02.
2. Run `cd packages/email && bun test`, then repo `bun run lint` and `bun run typecheck`.
3. Mark this step done in the parent guide (do not edit `docs/product/`).
4. Rollback: revert the package commit; no schema or env migration.

## Open Questions

- None blocking. Whether to defensively strip a trailing slash on `siteUrl` is an apply-time preference (default: trust the caller, test the slash-free case).
