## Context

Parent feature: Ticket Redemption (`.dev-plan/current-iteration/ticket-redemption-parent-guide.md`). Steps 01–03 shipped schema, atomic allocation into `booking_tickets`, and admin inventory stocking. `listUserBookings` already returns `tickets: BookingTicket[]` per item, but `MyTicketsPage` / `BookingTicketCard` / `TicketRedemptionBlock` / `BookConfirmPage` still render only booking-level `redemptionInfo` as plain text. Confirm loads the booking row without `listBookingTickets`. `@unveiled/images` has `uploadObject` but no GetObject helper yet.

Constraints:

- HeroUI chrome; Tailwind layout-only; theme-only visuals (AGENTS.md §8–9).
- Client islands only where unavoidable (reveal/hide; existing copy button) — SSR initial state masked (AGENTS.md §1/islands).
- Native-first controls OK; Lucide eye / eye-off allowed (already used elsewhere).
- No mutation modals; bookings stay `robots: noindex`.
- Prefer app-proxied PDF download over raw public R2 URLs (auth + ownership).
- Product Gherkin / sitemap finalize deferred to step 05 (note route if useful).

## Goals / Non-Goals

**Goals:**

- Per-ticket redemption UI on My Tickets + booking confirm.
- Masked codes + eye toggle island; copy works while masked.
- Auth-gated PDF download route with attachment disposition.
- DE/EN copy for show/hide, download, Ticket N labels.
- Lint + typecheck green; manual smoke from the step brief.

**Non-Goals:**

- Admin inventory UI changes (03 done).
- Email PDF attachments.
- Partner check-in / USED flows.
- Full BDD / product-doc rewrite (05).
- Dropping booking-level `redemption_*` columns (keep as summary; UI reads tickets).

## Decisions

1. **UI data shape**
   - **Choice:** Pass `tickets: BookingTicket[]` (and booking `redemptionType`) into `TicketRedemptionBlock` / compact variants. Prefer tickets when present; for edge cases with empty tickets on legacy rows, fall back to booking-level `redemption_*` as a single synthetic row so old data does not blank out.
   - **Rationale:** Domain already attaches tickets on list; confirm needs one `listBookingTickets` call.
   - **Alternatives:** Keep booking-level only (rejected — multi-ticket broken).

2. **Confirm loader**
   - **Choice:** After ownership check in `book/confirm.tsx`, call `listBookingTickets(db, booking.id)` and pass tickets into `BookConfirmPage` → `TicketRedemptionBlock`. Keep existing ICS download query behavior.
   - **Rationale:** Matches step 02 reader requirement; no new package API required beyond existing export.
   - **Alternatives:** Join in a new `getUserBookingDetail` helper (nice-to-have; optional if confirm stays thin).

3. **My Tickets wiring**
   - **Choice:** `MyTicketsPage` already receives `UserBookingListItem[]` with `tickets`; stop discarding them — pass `tickets` into `BookingTicketCard` → compact redemption block.
   - **Rationale:** Zero domain work; UI-only gap.
   - **Alternatives:** N+1 fetch per card (rejected).

4. **Reveal island**
   - **Choice:** New `RevealSecretIsland` (or combine with copy into one `RedemptionCodeControls` island) that:
     - SSR/props receive the real `value` and labels (`show` / `hide` / `copy` / `copied`).
     - Renders a password-style field or masked text (`••••••••` / `type="password"` pattern) + HeroUI Button with Lucide `Eye` / `EyeOff`.
     - Default `revealed = false`.
     - Keeps or embeds `CopyRedemptionButton` behavior so clipboard always gets `value`.
   - **Important:** Masking is UX shoulder-surfing protection, not a security boundary — the value is still in the client props/DOM. Do not claim server-side secrecy for codes shown to the owner.
   - **Rationale:** Ticket brief; island required for toggle; copy-while-masked preferred.
   - **Alternatives:** CSS-only blur without island (weaker a11y); require reveal before copy (worse UX).

5. **PDF download route**
   - **Choice:** Add GET `/:locale/bookings/:bookingId/tickets/:ticketId/voucher.pdf` (HonoX route under `apps/web/app/routes/`). Flow:
     1. Require session (member guard / redirect login with returnTo).
     2. Load booking by id; 404 if missing or `userId !== session.user.id`.
     3. Load ticket; 404 if not on that booking or `voucherPdfId` null.
     4. Load `event_voucher_pdfs` by id; 404 if missing.
     5. `getObject` from R2; respond `application/pdf` with `Content-Disposition: attachment; filename="voucher-{ordinal}.pdf"` (or inventory `originalFilename` when safe).
   - Put ownership + resolve helper in `@unveiled/db` booking package (e.g. `getOwnedBookingTicketPdf(db, { userId, bookingId, ticketId })`) so the route stays thin.
   - **Rationale:** Auth-gated proxy; consistent even if bucket is public-read; matches ticket path suggestion.
   - **Alternatives:** Presigned R2 URLs (short-lived OK later; more infra); public IMAGE_PUBLIC_BASE_URL links (weaker ownership story).

6. **R2 read helper**
   - **Choice:** Add `getObject({ objectKey })` next to `uploadObject` in `packages/images/src/s3.ts` using `GetObjectCommand`; return `Uint8Array` (or stream if Workers-friendly). Export from package index.
   - **Rationale:** Upload already exists; download needs the pair.
   - **Alternatives:** Inline AWS SDK in the route (rejected — keep I/O in package).

7. **Per-ticket row chrome**
   - **Choice:** Inside redemption blocks, map tickets to rows:
     - Textual code → `RevealSecretIsland` + optional website link (promo URL from ticket or booking).
     - PDF → HeroUI `Link`/`Button` styled as secondary pointing at the download route (no island needed for download).
     - Shared helper copy: `ticketOrdinalLabel(n)`, `showCode`, `hideCode`, `downloadPdf`.
   - Compact list variant uses the same row model with tighter spacing.
   - **Rationale:** One component family for confirm + list.
   - **Alternatives:** Separate PDF-only component (unnecessary).

8. **Cancelled / missing redemption**
   - **Choice:** For `CANCELLED` bookings after restock, tickets may have cleared codes — show status via existing chip; omit empty redemption rows or show a muted “no longer available” string only if copy already fits. Do not invent codes. CONFIRMED without tickets is a data bug — log/omit gracefully; no crash.
   - **Rationale:** Step 02 clears payloads on cancel; UI must tolerate nulls.
   - **Alternatives:** Hide entire card redemption section when all empty (acceptable).

9. **Sitemap / robots**
   - **Choice:** Keep bookings + confirm `noindex`. Note the PDF route in parent guide / handoff for step 05 sitemap update; do not rewrite `docs/product/sitemap` in this step unless already editing nearby.
   - **Rationale:** Ticket cleanup defers finalize to 05.

10. **Stories / fixtures**
    - **Choice:** Update `BookingTicketCard.stories` / fixtures to include multi-ticket `tickets` arrays for SECRET / PROMO / PDF so Ladle reflects new UI.
    - **Rationale:** Low cost; catches prop wiring mistakes.

## Risks / Trade-offs

- **[Risk] Codes still present in HTML/JS props while “masked”** → Mitigation: document as UX-only; owner is allowed to see their codes; shoulder-surfing is the threat model.
- **[Risk] Large PDF proxy memory on Workers** → Mitigation: stream GetObject body when possible; ticket PDFs are already sliced per ticket (small).
- **[Risk] Orphan / missing R2 object after DB row** → Mitigation: 404 with generic not-found; no stack leak.
- **[Risk] Confirm email still shows plain booking-level code** → Mitigation: out of scope (05 / email polish); in-app surfaces are the deliverable.
- **[Trade-off] openspec ≠ product SoT** → Deltas here; `docs/product/` Gherkin in step 05.
- **[Trade-off] Fallback to booking-level summary** → Helps legacy rows; remove only if step 05 proves all bookings have tickets.

## Migration Plan

1. Add `getObject` in `@unveiled/images`; add booking helper for owned ticket PDF resolve.
2. Add PDF download route; smoke auth denial.
3. Extend copy modules; build reveal island; refactor `TicketRedemptionBlock` (+ compact) to per-ticket rows.
4. Wire tickets through My Tickets + confirm; update stories/fixtures.
5. `bun run lint`, `bun run typecheck`; manual smoke (SECRET, PROMO×2, PDF×2).
6. Mark step 04 done in parent guide; hand PDF route to 05 for sitemap/BDD.
7. Rollback: revert deploy; no schema migration in this step.

## Open Questions

- None blocking. If product later wants reveal-before-copy, flip Decision 4 in a follow-up; default remains copy-while-masked.
