## Context

See `proposal.md` (Why) for motivation. Current state: `buildSubscriptionInvoiceContent` in `packages/email/src/subscription-invoice.ts` returns plain `<p>`-paragraph HTML plus a plain-text twin; `sendSubscriptionInvoice` (`packages/email/src/send-subscription-invoice.ts`) passes that content plus one caller-supplied PDF through the Resend client; `maybeSendSubscriptionInvoiceEmail` (`apps/web/app/lib/subscription-invoice-email.ts`) fires it post-`applyStripeEvent` only for `invoice.paid` / `subscription_create`, with metadata `unveiled_invoice_email=sent` and `Idempotency-Key` = invoice id. Constraints shaping the approach: mail-client-safe HTML only (tables + inline styles, absolute URLs, no external CSS/JS/webfonts); app look (yellow accent `#FAFF86`, dark ink, Work Sans with system fallback); subjects, 5 locale links, PDF contract, trigger, and skip+log / retry+never-duplicate send policy all stay unchanged; `@unveiled/email` MUST NOT import Stripe/`@unveiled/billing`. See `specs/credits-subscription/spec.md` for the normative content contract.

## Goals / Non-Goals

**Goals:**
- Give the subscribe/resub invoice mail a branded, mail-client-safe structure (preheader, header, summary, PDF note, next steps, footer) with a plain-text mirror, in DE + EN.
- Lock the resub-reuse contract (same neutral-active template, no fork) so step 02 can reuse the layout/locale/idempotency conventions.
- Keep the change content-only: no trigger, signature, idempotency, or billing-lifecycle edits.

**Non-Goals:**
- Unsubscribe mail (step 02), subject changes, Checkout/portal/lifecycle edits, renewal-send behavior, dashboard/ops docs (step 03).

## Decisions

- **Hand-rolled table layout (600px, inline styles) over MJML / react-email.** Rationale: zero new dependencies in `@unveiled/email`, full control over Outlook-safe output, matches the parent guide's client-safety rule. Alternative (MJML build step) rejected: heavier toolchain for one transactional mail.
- **Hidden preheader div + visible header block.** Rationale: inbox preview text improves open context without changing subjects; header block (brand name + membership-active headline on ink/yellow) gives hierarchy while staying flat/bordered per the app theme. Alternative (subject-line change) rejected: out of scope, breaks existing assertions.
- **Summary block with 4 fixed lines (plan, price, credits, no-rollover) above the PDF note.** Rationale: the operative facts survive skimming; copy semantics stay byte-identical to the current DE/EN strings so existing locale assertions keep passing. Alternative (richer order table with line items) rejected: Stripe PDF already itemizes; duplication risks drift.
- **Next steps as a numbered list reusing the exact 5 `invoiceLinks` URLs.** Rationale: preserves the `SITE_URL`-no-trailing-slash contract and locale prefixing; anchors in HTML, bare URLs in text. Alternative (button CTAs) rejected: buttons render inconsistently in Outlook; links are safer.
- **Plain-text mirror kept in lockstep by construction (same builder, same link/summary constants).** Rationale: text/HTML parity is a spec scenario; sharing constants prevents drift. Alternative (HTML-only) rejected: plain-text fallback is required for deliverability.
- **Resub = same template, neutral "active" wording; no welcome / welcome-back fork.** Rationale: avoids prior-status plumbing through the webhook orchestrator (which only sees the current invoice). Alternative (forked copy) rejected per parent-guide decision: would need `INACTIVE`-history lookup in the send path.
- **Escape all interpolated values (`escapeHtml` on URLs/site strings; text path needs no markup).** Rationale: `siteUrl` is caller-supplied; current `linkHtml` helper already escapes — extend the discipline to every new interpolation point.

## Risks / Trade-offs

- [Risk] Outlook/Gmail strip `<style>` / modern CSS → Mitigation: tables + inline styles only, max-width 600, system-font stack (`Work Sans, -apple-system, "Segoe UI", Arial, sans-serif`), no external assets; verify by reading rendered HTML, not a live send.
- [Risk] Text/HTML parity drift as blocks are added → Mitigation: single builder emits both; unit tests assert summary lines, all 5 links, support address, and no-rollover wording in both parts and both locales.
- [Risk] Preheader leaks into visible body in some clients → Mitigation: standard hidden-preheader pattern (`display:none;max-height:0;overflow:hidden;mso-hide:all`) with preview-only copy.
- [Risk] Dark-mode clients invert yellow/ink → Mitigation: acceptable tradeoff; keep high-contrast ink-on-yellow header and plain body so inversion stays legible; no background images.
- [Risk] Temptation to "fix" trigger/idempotency while in the file → Mitigation: explicitly out of scope; orchestrator file untouched.

## Migration Plan

Content-only additive change: update the builder + tests, run `bun run lint`, `bun run typecheck`, `bun test packages/email`. No data migration, no env changes, no deploy-order constraints. Rollback = revert the builder file; subjects, trigger, and idempotency are untouched so rollback is safe at any point.
