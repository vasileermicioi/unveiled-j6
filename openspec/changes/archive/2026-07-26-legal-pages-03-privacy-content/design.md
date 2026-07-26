## Context

Steps 01–02 shipped the legal content model (`LegalSection.body: readonly string[]`), multi-paragraph `LegalPage` rendering, and complete Impressum identity. Privacy still uses three temporary sections (`overview`, `processing`, `rights`) with Platzhalter / Placeholder strings. Parent feature `legal-pages` needs GDPR-oriented Privacy / Datenschutz copy that matches the membership rewrite stack and does not contradict the Impressum privacy-note pointer.

Constraints: content-only edits in `apps/web/app/lib/content/legal.ts`; no route/footer/SEO shape changes; no new CMP library or GDPR APIs; both locales fully filled; facts limited to processors documented in `docs/product/extras/integrations-and-config.md` and cookie/Sentry behavior in `static-pages.feature`; operational general information, not counsel-certified text.

Controller identity (from step 02): unveiled berlin; Luisenstraße 53, 10117 Berlin; phone (+49) 157 878 16 930; email `support@unveiled.berlin`.

## Goals / Non-Goals

**Goals:**

- Ship complete DE/EN Privacy section bodies with the nine recommended section ids (titles localized).
- Cover controller, data categories, purposes/legal bases at a high level, recipients/processors, cookies/consent (map gated; Sentry not gated), retention (incl. anonymized booking/ledger for GoBD), rights (access, rectification, erasure, restriction, portability, objection, supervisory complaint to Berliner Beauftragte für Datenschutz und Informationsfreiheit), and privacy contact.
- Remove all placeholder substrings from privacy locale objects.
- Keep eyebrow `Rechtliches` / `Legal` and titles `Datenschutz` / `Privacy Policy`.

**Non-Goals:**

- Terms of Service full text (04).
- Product-doc / i18n inventory / e2e body asserts (05).
- Cookie banner UI changes, new GDPR export/delete APIs, or formal DPA templates with each vendor.
- Claiming credits rollover, newsletter product, or unused third-party vendors.
- Counsel-certified final legal text.

## Decisions

1. **Section set: expand from 3 temporary ids to the step-plan table**  
   - **Why:** Temporary `processing` is too coarse for controller / categories / purposes / processors / cookies / retention / contact. Stable ids from the step plan keep DE/EN aligned and make future counsel edits surgical.  
   - **Alternatives:** Keep three sections with longer bodies (harder to scan; weaker match to GDPR disclosure structure); invent extra legal-jargon sections (overclaim risk).

2. **Processors list: only shipped stack vendors**  
   - Neon Auth (identity/session), Neon Postgres (profile, preferences, bookings, ledger, subscription metadata), Stripe Billing (payment/subscription; describe Stripe’s role for card data), Resend (transactional mail), Cloudflare R2 (event/partner images; usually non-PII hosting), Cloudflare Workers (hosting), Sentry (PII-free error tracking), MapLibre + OpenStreetMap tiles (loaded after non-essential consent).  
   - **Why:** Integrations doc is SoT; inventing unused vendors creates false disclosures.  
   - **Alternatives:** Vague “cloud providers” only (too thin for transparency); copy marketing-site vendors that the rewrite does not use (Firebase/Google Maps — forbidden).

3. **Cookie section mirrors shipped behavior, not a new CMP**  
   - Accept/decline non-essential; map tiles gated; declined → placeholder; Sentry strictly necessary and not consent-gated.  
   - **Why:** `static-pages.feature` already defines this; privacy copy must match product behavior.  
   - **Alternatives:** Promise a third-party CMP (out of scope); omit map/Sentry split (contradicts shipped UX).

4. **Retention + erasure: high-level GoBD note, no legal citation dump**  
   - Account deletion anonymizes PII; anonymized bookings/ledger retained for legally required financial retention — consistent with `database/schema-overview.md`.  
   - **Why:** Product already implements this model; privacy page should not invent hard-delete semantics.  
   - **Alternatives:** Promise full hard-delete of financial rows (false); omit retention (incomplete GDPR overview).

5. **Stripe wording: payment details handled by Stripe; do not overstate controller/processor role**  
   - **Why:** Stripe’s role is nuanced; operational copy should say card/payment data is processed by Stripe under Stripe’s terms without claiming we store PANs.  
   - **Alternatives:** Label Stripe solely “Auftragsverarbeiter” without nuance (may be inaccurate); omit Stripe (false for a paid membership).

6. **Capability delta on `static-marketing-pages` (ADDED requirement)**  
   - **Why:** Same pattern as step 02 Impressum; step-plan “Spec Delta: static-pages” maps to this OpenSpec capability. New requirement for privacy content facts without rewriting generic Legal accessibility scenarios.  
   - **Alternatives:** MODIFY generic “Legal pages” requirement (would mix SEO/footer scenarios with content facts).

7. **Tone and intro**  
   - DE slightly more formal (GDPR/TMG style); EN plain and natural. Keep short intros; only rewrite if they still imply pending content. Do not contradict Impressum `privacy-note` (pointer to `/privacy` remains valid).

## Risks / Trade-offs

- **[Risk] Operational copy may need counsel edits before production** → Mitigation: parent Non-Goals already accept this; note counsel review in PR/handoff; step 05 can reflect “pending formal legal review” in product docs.  
- **[Risk] Processor list drifts as Phase 6–8 integrations land** → Mitigation: describe current SoT vendors at high level; step 05 / later doc sync can refresh if a new processor ships.  
- **[Risk] Impressum privacy-note vs full Privacy page contradiction** → Mitigation: keep impressum note as a short pointer only; put all substantive GDPR narrative in privacy sections.  
- **[Trade-off] High-level legal bases (Art. 6) without per-field matrices** → Acceptable for operational overview; counsel can deepen later.  
- **[Trade-off] No formal DPAs attached** → Out of scope; mention processors without publishing contract templates.

## Migration Plan

1. Rewrite `privacySections` DE/EN in `legal.ts` → lint/typecheck → manual locale smoke on `/de/privacy` and `/en/privacy`.  
2. Confirm impressum `privacy-note` still points at `/privacy` without conflicting claims.  
3. No DB, env, or deploy migration.  
4. Rollback: revert `legal.ts` privacy block only.

## Open Questions

- None blocking this step. If operators later supply a dedicated DPO contact distinct from `support@unveiled.berlin`, add it under `contact` without inventing a role that does not exist today.
