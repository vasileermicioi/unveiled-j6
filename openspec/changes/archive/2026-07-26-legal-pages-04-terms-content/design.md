## Context

Steps 01–03 shipped the legal content model (`LegalSection.body: readonly string[]`), multi-paragraph `LegalPage` rendering, complete Impressum identity, and GDPR-oriented Privacy copy. Terms still use three temporary sections (`scope`, `membership`, `booking`) with Platzhalter / Placeholder strings. Parent feature `legal-pages` needs general consumer Terms / AGB aligned with the membership rewrite — especially the product rule that **credits do not roll over** (contradicts the old unveiled-berlin.de FAQ).

Constraints: content-only edits in `apps/web/app/lib/content/legal.ts`; no Stripe/billing code changes; no formal Widerrufsbelehrung PDF flow; both locales fully filled; facts limited to `docs/product/` (charter, vision-and-domains, credits-subscription, booking at high level); operational general terms, not counsel-certified text. Contact: `support@unveiled.berlin`. Do not promise partner portal, multi-city, à la carte credits, or chat support.

## Goals / Non-Goals

**Goals:**

- Ship complete DE/EN Terms section bodies with the nine recommended section ids (titles localized).
- Cover scope, membership/subscription, credits (**explicit no rollover**), bookings/admission via partner venues and secret codes, cancellation / end of contract (access until paid period end), liability, changes to program/terms, governing law (Germany; Berlin venue if included), and contact.
- Remove all placeholder substrings from `legal.ts` (impressum/privacy already clean; terms must clear the file-wide verification).
- Keep eyebrow `Rechtliches` / `Legal` and titles `AGB` / `Terms of Service`.

**Non-Goals:**

- Stripe Checkout / webhook / Customer Portal implementation changes.
- Formal distance-selling PDF packaging or separate legal download routes (a short right-of-withdrawal note in membership/cancellation is OK if straightforward).
- Product-doc / i18n inventory / e2e body asserts (05).
- Partner portal / check-in legal flows (post-MVP).
- Claiming credits rollover, newsletter product, multi-city, or à la carte credit packs.
- Counsel-certified final legal text.

## Decisions

1. **Section set: expand from 3 temporary ids to the step-plan table**  
   - Ids: `scope`, `membership`, `credits`, `booking`, `cancellation`, `liability`, `changes`, `governing-law`, `contact`.  
   - Titles: DE — Geltungsbereich, Mitgliedschaft und Abo, Credits, Buchungen und Eintritt, Kündigung und Vertragsende, Haftung, Änderungen, Anwendbares Recht, Kontakt; EN — Scope, Membership and subscription, Credits, Bookings and admission, Cancellation and end of contract, Liability, Changes, Governing law, Contact.  
   - **Why:** Temporary stubs omit credits, cancellation, liability, and governing law; stable ids keep DE/EN aligned for counsel edits.  
   - **Alternatives:** Keep three long sections (harder to scan; weaker match to consumer AGB structure); invent more legal-jargon sections (overclaim risk).

2. **Credits wording: plan allotment + mandatory no-rollover**  
   - Prefer “the credits included in your plan” (or equivalent) so the exact default (17) stays marketing-flexible; stating 17 is acceptable if consistent with membership copy.  
   - Credits section **must** state unused credits expire at period boundary / renewal and do **not** roll over — both locales.  
   - **Why:** `credits-subscription.feature` and vision SoT; parent Non-Goals forbid rollover claims.  
   - **Alternatives:** Copy marketing FAQ rollover claim (forbidden); omit expiry mechanics (incomplete vs product).

3. **Cancellation: high-level Stripe / in-app billing, not unshipped UI detail**  
   - Member may cancel via Stripe Customer Portal / in-app billing flows; access continues until end of paid period; remaining credits forfeit at period end same as renewal.  
   - **Why:** Aligns with shipped Phase 6/7 behavior without describing unfinished screens.  
   - **Alternatives:** Promise immediate mid-period refund of unused credits (not product SoT); deep-link specific portal URLs that may change.

4. **Booking / capacity: high-level only**  
   - Bookings spend credits; admission via secret code at the venue; capacity and waitlist may apply; waitlist promotion uses the same booking path when available — do not document partner check-in portal.  
   - Event cancellations may refund credits per product rules (high level).  
   - **Why:** Booking domain is SoT; Terms should not duplicate waitlist edge cases.  
   - **Alternatives:** Full booking algorithm dump (out of scope); omit codes (understates redemption model).

5. **Optional short counsel disclaimer in `intro` only**  
   - One sentence that these are general terms pending formal legal review is allowed in intro; do not watermark every section.  
   - **Why:** Parent feature ships operational copy; matches privacy/impressum tone.  
   - **Alternatives:** No disclaimer (operators may prefer counsel note in PR only); per-section watermarks (noisy).

6. **Optional cross-links to Privacy / Impressum**  
   - One line in `scope` or `contact` pointing at `/privacy` and `/impressum` (locale-aware routes already exist).  
   - **Why:** Step plan allows it; helps visitors find related legal pages without changing footer.  
   - **Alternatives:** Omit links (still acceptable); add new footer columns (out of scope).

7. **Capability delta on `static-marketing-pages` (ADDED requirement)**  
   - **Why:** Same pattern as steps 02–03; step-plan “Spec Delta: static-pages” maps to this OpenSpec capability. New requirement for Terms content facts without rewriting generic Legal accessibility scenarios.  
   - **Alternatives:** MODIFY generic “Legal pages” requirement (would mix SEO/footer scenarios with content facts).

8. **Tone**  
   - DE slightly more formal (consumer AGB style); EN plain and natural. Keep short intros unless they still imply pending content.

## Risks / Trade-offs

- **[Risk] Operational copy may need counsel edits before production** → Mitigation: parent Non-Goals already accept this; note counsel review in PR/handoff; step 05 can reflect “pending formal legal review” in product docs.  
- **[Risk] Accidental rollover wording** → Mitigation: verification `rg` for roll-over / übertragen / rollover must only match negative phrasing; implementer double-checks Credits section in both locales.  
- **[Risk] Over-describing unshipped cancellation UI** → Mitigation: stay at “Stripe Customer Portal / in-app billing” level.  
- **[Trade-off] High-level liability / Widerruf without formal PDF** → Acceptable for operational overview; counsel can deepen later.  
- **[Trade-off] Exact credit count flexible vs fixed 17** → Prefer plan-flexible wording unless membership marketing already hard-codes 17 in nearby legal copy.

## Migration Plan

1. Rewrite `termsSections` DE/EN in `legal.ts` → lint/typecheck → manual locale smoke on `/de/terms` and `/en/terms`.  
2. Run file-wide placeholder and rollover verification commands from the step plan.  
3. No DB, env, or deploy migration.  
4. Rollback: revert `legal.ts` terms block only.

## Open Questions

- None blocking this step. If operators later want a dedicated formal Widerrufsbelehrung document, add it in a later change — do not build a download flow here.
