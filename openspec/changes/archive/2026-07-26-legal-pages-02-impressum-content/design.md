## Context

Step 01 shipped `LegalSection.body: readonly string[]` and multi-paragraph `LegalPage` rendering. Impressum still uses three temporary sections (`provider`, `contact`, `register`) with Platzhalter / Placeholder strings. Parent feature `legal-pages` needs real operator identity before Privacy (03) and Terms (04) can cite the controller/provider consistently.

Constraints: content-only edits in `apps/web/app/lib/content/legal.ts`; no route/footer/SEO shape changes; do not invent Handelsregister / USt-IdNr; email SoT is `support@unveiled.berlin`; HeroUI rendering already done; both locales fully filled.

Reference facts (fetched 2026-07-26 from unveiled-berlin.de/impressum): unveiled berlin; Vertreten durch Pia Sonnekalb und Sarah Michot; Luisenstraße 53, 10117 Berlin, Deutschland; Telefon (+49) 157 878 16 930; Verantwortliche für den Inhalt nach § 55 Abs. 2 RStV (same names + address); standard Haftungsausschluss, Urheberrecht, and a short Datenschutz note (full policy remains on `/privacy`).

## Goals / Non-Goals

**Goals:**

- Ship complete DE/EN Impressum section bodies with the six recommended section ids (titles localized).
- Surface provider, representatives, Berlin address, phone, support email, content-responsibility, liability, copyright, and a privacy pointer.
- Remove all placeholder substrings from impressum locale objects.
- Keep eyebrow `Rechtliches` / `Legal` and titles `Impressum` / `Imprint`.

**Non-Goals:**

- Privacy Policy and Terms full text (03–04).
- Product-doc / i18n inventory / e2e body asserts (05).
- Changing support email domain, inventing register/VAT lines, or counsel-certified final legal text.
- UI, types, or route changes.

## Decisions

1. **Section set: drop `register`, add `responsible` / `liability` / `copyright` / `privacy-note`**  
   - **Why:** Reference Impressum has no Handelsregister / USt-IdNr; parent guide says omit rather than invent. Match reference structure with stable ids from the step plan.  
   - **Alternatives:** Keep empty `register` with “keine Angaben” (implies researched absence; riskier); invent IDs (forbidden).

2. **Email: `support@unveiled.berlin` as plain text in contact body**  
   - **Why:** App SoT (footer, FAQ, AGENTS.md); parent prefers support over marketing `info@`. Plain text stays mailto-friendly without needing a new content field.  
   - **Alternatives:** Both emails (noisy); Link component in body (would need content-model change — out of scope).

3. **DE liability/copyright: adapt reference wording; EN: natural equivalents**  
   - **Why:** Step plan forbids machine-garbled EN; DE should stay close to the live imprint so operators recognize it.  
   - **Alternatives:** Full counsel rewrite (deferred); copy DE into EN (product requires bilingual quality).

4. **Privacy-note is a short pointer to `/privacy`, not a mini-policy**  
   - **Why:** Avoid duplicating step 03 GDPR copy; reference page’s Datenschutz blurb is generic and will be superseded by the full Privacy page.  
   - **Alternatives:** Paste reference Datenschutz paragraphs wholesale (conflicts with fuller Privacy later).

5. **Capability delta on `static-marketing-pages` (ADDED requirement)**  
   - **Why:** Existing OpenSpec capability owns Legal pages; step-plan “Spec Delta: static-pages” maps here. New requirement for operator identity (not a rewrite of the generic “Legal pages” accessibility scenarios).  
   - **Alternatives:** MODIFY “Legal pages” in place (would bloat SEO/footer scenarios with content facts).

6. **Intro copy**  
   - Keep short locale intros aligned with TMG / German telemedia framing; only rewrite if they still imply “pending” content. Current intros are fine as-is once sections are real.

## Risks / Trade-offs

- **[Risk] Phone or address stale vs operators’ current details** → Mitigation: re-fetch unveiled-berlin.de/impressum before writing final strings; flag drift in parent Risks if operators update after ship.  
- **[Risk] Missing register/VAT later required for TMG completeness** → Mitigation: omit now; parent Risks already track; insert in a follow-up if operators supply values.  
- **[Trade-off] Operational copy pending formal counsel** → Acceptable per parent Non-Goals; Privacy/Terms carry the larger counsel burden.  
- **[Trade-off] Privacy-note is intentionally thin** → Full GDPR narrative lands in step 03; impressum only points there.

## Migration Plan

1. Rewrite `impressumSections` DE/EN in `legal.ts` → lint/typecheck → manual locale smoke.  
2. No DB, env, or deploy migration.  
3. Rollback: revert `legal.ts` impressum block only.

## Open Questions

- None blocking this step. If operators supply Handelsregister / USt-IdNr before apply, add a `register` section; otherwise leave omitted and note in parent Risks on handoff.
