## Context

Step 02 ships Book Now / Waitlist on every EventCard → public `/:locale/events/:id`. `EventDetailPage` still stacks a full-bleed hero, Chip/title/meta, details Card, location+map Card, and a light bottom CTA strip. Viewer kinds already exist (`guest` | `eligible` | `membership_required` | `past_due`); booking charge stays on `.../events/[id]/book.tsx` + `BookEventPage` + `TicketCountSelect`. Visual target: `.dev-plan/2-event-details-checkout.png` (yellow page, identity column, dark summary card). Constraints: HeroUI-only markup, theme-only visuals, SSR mutations only, no radios/checkboxes, public indexing + JSON-LD preserved. Product SoT (`docs/product/`) updates land in step 04.

## Goals / Non-Goals

**Goals:**

- Checkout-like two-column layout (stack on mobile): identity + larger hero; dark action card with tickets, total credits, notice, primary CTA, secure-RSVP footer.
- Close **X** Link to Discover (guests) or member feed / safe `returnTo` — not a modal.
- Preserve CTA matrix semantics; restyle into the dark card; guest primary CTA matches mockup unlock copy with `returnTo` to detail or book.
- Quantity on detail is client navigation state only; optional `?qty=` into `/book` or auth `returnTo`; no booking/ledger writes from detail.
- Theme class (e.g. `.event-detail--checkout`) for dark card / typography; yellow backdrop unchanged.
- Update Ladle stories for guest, eligible, sold-out (and ideally membership/past_due if cheap).

**Non-Goals:**

- Deleting or merging `/events/:id/book` or `/book/confirm`.
- Stripe membership checkout UI redesign.
- `docs/product/` / Gherkin SoT finalization (step 04).
- Admin event preview restyle.
- Domain changes to capacity, credits, waitlist promotion, or atomic booking.

## Decisions

1. **Layout: identity column + sticky-friendly checkout card**
   - **Choice:** CSS grid/flex (Tailwind layout only) — left: `CATEGORY // PARTNER`, title, description, rule, LOCATION + address, then larger `<img>` via `buildDetailHeroSrc(Set)`. Right: dark `Card`/`Surface` checkout block. Mobile: identity → image → card (or identity → card → image if card CTA must stay early — prefer mockup order: identity then card, image prominent within identity plane).
   - **Rationale:** Matches mockup decision hierarchy without a client modal.
   - **Alternatives:** Keep stacked marketing layout with only a restyled CTA strip (rejected; fails mockup); full-page modal overlay (rejected; SSR Link close + indexable page).

2. **Close control**
   - **Choice:** Top-right HeroUI `Link` with **X** / aria-label; guests → `localizedPath(locale)` (Discover); authenticated → `returnTo` query if safe (`parseReturnTo` / existing helpers), else `/:locale/events`.
   - **Rationale:** Parent guide + step plan; not dismissible client chrome.
   - **Alternatives:** `history.back()` only (rejected; unreliable for shared links); hide close (rejected; mockup requires it).

3. **Ticket quantity without detail POST**
   - **Choice:** Reuse `TicketCountSelect` island (or HeroUI +/- steppers) inside the checkout card. Default qty `1`, clamp 1–3. Total = `qty * event.creditPrice` displayed as yellow emphasis. Eligible book CTA href includes `?qty=N` when book page already accepts it (add minimal read on book route if missing). Guest login/signup `returnTo` encodes detail URL (or book URL) with `qty` if useful — charge still only after auth + book SSR POST.
   - **Rationale:** Mockup shows steppers before login; hard rule forbids radios/checkboxes; booking domain stays sole writer.
   - **Alternatives:** Quantity only on `/book` (rejected; mockup); merge book form onto detail (out of scope).

4. **CTA matrix (behavior preserved, chrome moved)**
   - **Choice:** Keep existing `show*` flags; move labels/messages into dark card:
     - Guest + bookable → primary login (“Einloggen zum Freischalten” / EN equivalent) + optional secondary signup; bordered notice: membership-included / log-in-or-register copy per locale.
     - Eligible + bookable → primary → `/events/:id/book` (+ qty).
     - Membership / past_due → existing membership or payment paths, styled in-card.
     - Sold out → waitlist CTAs in-card.
     - Past → message only, no book CTA.
   - **Rationale:** Step 02 deferred unlock UX to detail; do not invent new domain gates.
   - **Alternatives:** Guest secondary → `/membership` as today for “Membership” (keep if still useful; prefer signup when mockup says register).

5. **Theme CSS**
   - **Choice:** Add `.event-detail--checkout` (and BEM children for card, total, notice, close) in `globals.css` after HeroUI import — dark inverted surface, yellow total/CTA harmony, no drop shadows, flat borders. No per-route color utilities.
   - **Rationale:** AGENTS.md theme-only rule + DESIGN.md yellow backdrop.
   - **Alternatives:** Ad-hoc Tailwind color classes (rejected).

6. **Map and metadata**
   - **Choice:** Prefer address text in identity column; move map below the fold or omit if it fights checkout focus. Collapse accessibility/languages/age/type into a compact details block under the fold — do not delete the data entirely.
   - **Rationale:** Checkout focus first; step 04 can document final placement.
   - **Alternatives:** Keep map in primary viewport (rejected; competes with card).

7. **SEO / structured data**
   - **Choice:** Route keeps existing robots/meta helpers and JSON-LD `<script type="application/ld+json">`; layout change must not remove them.
   - **Rationale:** Public indexable detail is a hard product rule.
   - **Alternatives:** none.

## Risks / Trade-offs

- **[Risk] Guest login currently lacks `returnTo` on detail CTA** → Mitigation: wire `returnTo` to detail (or book) URL explicitly in this change.
- **[Risk] Book page may ignore `qty` query** → Mitigation: if absent, add minimal GET default into `TicketCountSelect` on book; do not move POST to detail.
- **[Risk] Map/cookie e2e expects EventMap on detail** → Mitigation: keep map mountable below the fold when coordinates exist so declining-consent scenarios still have a map surface; if layout omits map entirely, note for step 04 / fix e2e in hardening.
- **[Risk] Spec drift vs `docs/product/` until step 04** → Mitigation: handoff list in tasks; parent guide already owns docs lag.
- **[Trade-off] Larger image + two columns may push CTA below fold on small phones** → Stack with card soon after identity; verify mobile smoke.
- **[Trade-off] Mockup mixes DE UI chrome with EN description** → Implement full DE/EN chrome strings; event description stays CMS language.

## Migration Plan

1. Implement layout + theme + copy + stories; wire close/`returnTo`/qty.
2. `bun run lint` && `bun run typecheck`.
3. Manual smoke guest + eligible; confirm JSON-LD still present.
4. Mark step 03 done in parent guide; hand off map/docs notes to step 04.
5. No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. Secondary guest CTA: signup vs membership — prefer signup + login primary per mockup; keep membership link only if product still needs it for inactive-path education (implementer may keep secondary membership for `membership_required` only).
- Exact EN strings for unlock / membership notice — derive from mockup DE + existing i18n tone; finalize inventory in step 04.
