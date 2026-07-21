## Context

Profile and related account pages (`ProfilePage`, `PreferencesPage`, `BillingPage`, `SecurityPage`, `DataExportPage`, `DeleteAccountPage`, `BillingCancelPage`) introduce with a level-1 `Heading` plus muted `Paragraph` subtitle. Saved and My Tickets already use `PageSectionHeader` (uppercase eyebrow + headline). QA evidence: `.dev-plan/manual-test-profile.png`. Source brief: `.dev-plan/current-iteration/manual-test-ux-04-profile-page-header.md`. Step 05 will add admin-style tabs on this stack, so headers must be consistent first.

## Goals / Non-Goals

**Goals:**

- Every listed account page uses `PageSectionHeader` with localized eyebrow + headline.
- Intro matches Saved/Tickets: no muted subtitle under the title.
- Eyebrow/title strings live in existing content modules (`profile-content`, `billing-content`, `gdpr-content`) for DE/EN.
- Ladle stories still render against the new intro.
- Product UI docs mention account chrome with `PageSectionHeader` when they list member surfaces.

**Non-Goals:**

- Tab navigation / `AdminTabNav`-style chrome (step 05).
- Membership page (step 03).
- Changing form fields, POST handlers, or GDPR/billing domain behavior.
- Extending `PageSectionHeader` API (no description/subtitle prop).
- New theme tokens or ad-hoc color/typography classes.

## Decisions

1. **Reuse `PageSectionHeader` as-is**
   - **Choice:** Import from `../marketing/PageSectionHeader` (or equivalent relative path) and pass `eyebrow` + `headline` only. Default `level={1}`.
   - **Rationale:** Same component as Saved/Tickets/auth; theme already styles `.page-section-header*`.
   - **Alternatives:** Duplicate eyebrow markup per page (rejected); add optional subtitle prop to `PageSectionHeader` (rejected — brief prefers no muted under-title line).

2. **Shared “Account” eyebrow; page-specific headlines**
   - **Choice:** Use a shared account-area eyebrow on main profile and siblings that are part of the account IA, with the current page title as headline. Suggested DE/EN:
     | Page | Eyebrow DE / EN | Headline (existing title) |
     |---|---|---|
     | Profile | `Konto` / `Account` | `Dein Konto` / `Your account` |
     | Preferences | `Konto` / `Account` | `Deine Vibes` / `Your vibes` |
     | Billing | `Konto` / `Account` | `Abrechnung` / `Billing` |
     | Security | `Konto` / `Account` | `Sicherheit` / `Security` |
     | Data export | `Konto` / `Account` | existing `exportTitle` |
     | Delete account | `Konto` / `Account` | existing `deleteTitle` |
     | Billing cancel | `Konto` / `Account` | existing `cancelPageTitle` |
   - **Rationale:** Mirrors Bookings eyebrow + page title; shared eyebrow sets up step 05 tabs without rewriting headlines again.
   - **Alternatives:** Unique eyebrow per page (acceptable if implementer prefers, but shared is preferred); put former subtitle text into the eyebrow (rejected — too long / not uppercase-eyebrow style).

3. **Drop page-level muted subtitles; keep essential body copy**
   - **Choice:** Stop rendering `subtitle` / `*Subtitle` / `cancelPageSubtitle` / `exportSubtitle` / `deleteSubtitle` as the intro muted line under the header. Do not add a replacement muted line under `PageSectionHeader`.
     - Profile / preferences / billing / security marketing-style subtitles: remove from render; leave unused strings in modules unless safe to delete.
     - Export / delete / cancel: instructional meaning already covered by card body (`deleteWarning`, cancel form copy, export download CTA). If any unique sentence would be lost, move it into the existing card `Paragraph`s — not under the header.
   - **Rationale:** Brief prefers matching Saved/Tickets (eyebrow + headline only).
   - **Alternatives:** Keep short supporting line under header (rejected by prefer clause); add `description` to `PageSectionHeader` (out of scope).

4. **Content module fields**
   - **Choice:** Add `eyebrow: string` (or per-page `*Eyebrow` where the module is page-scoped — e.g. `GdprMemberCopy.exportEyebrow` / `deleteEyebrow`, `BillingCopy.eyebrow` / `cancelPageEyebrow`). Prefer one `eyebrow` on `ProfileCopy` / `BillingCopy` when the same string is reused across pages in that module.
   - **Rationale:** Locale copy stays out of JSX; types stay explicit.
   - **Alternatives:** Hardcode eyebrows in components (rejected — breaks i18n convention).

5. **Layout shell unchanged**
   - **Choice:** Keep outer `Surface` `max-w-7xl` / padding; replace only the intro `Surface` + `Heading`/`Paragraph` block with `PageSectionHeader`. Inner cards and H2 section titles stay.
   - **Rationale:** Minimal diff; step 05 can wrap header + tabs later without redoing cards.

## Risks / Trade-offs

- **[Risk] Cancel/export/delete lose a one-line warning above the card** → Mitigation: verify `deleteWarning`, cancel body, and export card copy still communicate intent; move unique subtitle text into the card if needed.
- **[Risk] Step 05 expects a different shared shell** → Mitigation: shared Account eyebrow + `PageSectionHeader` is the stated prerequisite; tabs land in 05 without reworking the header component.
- **[Risk] Unused subtitle fields linger in content modules** → Mitigation: acceptable; delete only if unused after grep (including stories/tests).
- **[Trade-off] openspec/specs are historical for product behavior** → Delta lives here; update `docs/product/ui/` when account chrome is documented.

## Migration Plan

1. Add eyebrow fields to content modules (DE/EN).
2. Swap intros on all seven pages to `PageSectionHeader`; stop rendering muted page subtitles under the title.
3. Relocate any unique instructional subtitle into card body if still needed.
4. Update Ladle stories; lint/typecheck; manual `/en/profile` vs `/en/saved` / `/en/bookings`.
5. Touch product UI docs if they list account routes without `PageSectionHeader`; mark step 04 done in parent guide on merge.
6. No DB/env migration. Rollback = revert PR.

## Open Questions

- None blocking. Optional: use page-specific eyebrows instead of shared `Account`/`Konto` — only if visual QA prefers; default to shared.
