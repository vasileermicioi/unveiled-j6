## Context

Parent feature `partner-opening-hours`, step 03 (final) — public event detail display + product/docs/e2e hardening after schema/domain (01) and admin form UI (02).

Current state:

- Partners store `hasOpeningHours` + `openingHours` (`OpeningHoursWeek` with `mon`…`sun`); admin create/edit can author and clear hours.
- Public event detail route already loads `getPartnerById` for logo URL and passes `{ name, logoUrl }` into `EventDetailPartnerAttribution`.
- DETAILS card renders partner label + logo + name; no hours list yet.
- Product Gherkin still says “identity area” for partner attribution and has no hours scenarios; `admin-partners.feature` has no opening-hours scenarios; schema-overview already documents the columns from step 01.

Constraints: public detail stays ungated (`AGENTS.md` §10); HeroUI-only structure (`§8`) with existing partner logo `<img>` exception; theme-owned typography (`§9`); Europe/Berlin wall times; proximity Playwright selectors; no Discover marquee / overnight / holidays (parent non-goals).

## Goals / Non-Goals

**Goals:**

- Show weekly opening hours in DETAILS partner attribution when enabled; omit when disabled/null.
- Wire route partner hours into attribution props; format Mon→Sun for active locale.
- Align product SoT (Gherkin, ui map, i18n, coverage matrix) + OpenSpec deltas + Playwright + stories.
- Mark step 03 done in parent guide (feature complete).

**Non-Goals:**

- Discover / EventCard / map popup hours.
- Partner portal self-service.
- Overnight spans, holiday exceptions, per-event hours.
- Changing domain validation or admin form behavior from steps 01–02.

## Decisions

1. **Prop shape: structured hours on attribution, format in the page component**
   - **Choice:** Extend `EventDetailPartnerAttribution` with optional `hasOpeningHours?: boolean` and `openingHours?: OpeningHoursWeek | null` (reuse `@unveiled/db` type). Route passes values from `partner` when loaded. Render helper inside `EventDetailPage` (or a tiny colocated pure formatter) produces Mon→Sun display lines for the locale.
   - **Rationale:** Keeps domain type as SoT; avoids duplicating week JSON as ad-hoc strings; stories can pass the same shape. Preformatted locale lines from the route are acceptable if preferred for thinner component props — structured is preferred for story fixtures and unit-testable formatting.
   - **Alternatives:** Preformatted `openingHoursLines: string[]` only from the route (less reusable in stories); format inside the route JSX (rejected — routes stay thin).

2. **Visibility rule**
   - **Choice:** Render the hours list only when `hasOpeningHours === true` **and** `openingHours` is a non-null week object. Otherwise omit the entire hours block; name/logo behavior unchanged. Guests and members both see hours when enabled (same ungated attribution as logo/name — not tied to booking-eligible date chrome).
   - **Rationale:** Matches parent release criteria and step-plan scenarios.
   - **Alternatives:** Gate hours behind membership (rejected — product wants public venue info).

3. **Layout: under partner name inside existing DETAILS partner column**
   - **Choice:** Below the logo + name body, list seven weekday rows (HeroUI `Paragraph` / `Surface`). Order `mon`→`sun`. Open days: locale weekday label + formatted open–close; closed days: weekday label + closed label. No nested Card; no new island.
   - **Rationale:** Step plan: under/beside logo+name; no cards-inside-cards.
   - **Alternatives:** Separate DETAILS MetaCell column (noisier); definition list with raw HTML (forbidden).

4. **Locale formatting**
   - **Choice:** Weekday labels via DE/EN copy map keyed by `mon`…`sun` (reuse admin day-label wording or a public-detail content module — keep public copy out of `admin-content.ts`). Times: format `HH:MM` for display with locale-appropriate separator if needed, or show 24h as stored (product wall times are already `HH:MM`). Closed label: “Geschlossen” / “Closed”.
   - **Rationale:** Parent requires Europe/Berlin weekday labels in DE/EN; admin already has day labels but public pages should not import admin copy.
   - **Alternatives:** `Intl.DateTimeFormat` weekday from a fixed reference date (works, but a static map is simpler and matches admin).

5. **Canonical docs live in `docs/product/`; OpenSpec deltas mirror**
   - **Choice:** Update `event-discovery.feature` (attribution + hours scenarios; fix DETAILS wording vs “identity area”), `admin-partners.feature` (enable/validate/disable), schema overview note if display rule needs a sentence, `ui-component-map.md`, `content-i18n-inventory.md`, coverage matrix. OpenSpec deltas for `event-discovery` + `partner-catalog`.
   - **Rationale:** Project convention; AGENTS.md SoT remains `docs/product/`.

6. **E2E scope**
   - **Choice:** Admin: enable hours, save a valid week, assert edit re-open (or flash success) — may share partner create/edit helpers; R2 skip only when logo upload is required for setup. Public: guest (or member) opens detail for partner with hours enabled → sees weekday hours; partner with `has_opening_hours` false → no opening-hours list. Proximity selectors only.
   - **Rationale:** Step verification + parent release criteria.

## Risks / Trade-offs

- **[Risk] Gherkin still says “identity area” while UI is DETAILS** → Mitigation: this step corrects product Gherkin + OpenSpec to DETAILS attribution (step-plan wording).
- **[Risk] Partner fetch fails / null partner** → Mitigation: keep today’s name fallback from `event.partnerName`; omit logo and hours when partner row missing.
- **[Risk] Invalid week in DB despite domain guards** → Mitigation: treat malformed week as omit hours (defensive); do not crash SSR.
- **[Risk] Admin e2e needs logo for create** → Mitigation: reuse existing R2 env-skip / fixture patterns; prefer edit of seeded partner when possible to avoid logo upload.
- **[Trade-off] No Discover card hours** → Accepted per parent non-goals.

## Migration Plan

1. Extend attribution props + render hours in DETAILS; wire event detail route.
2. Update stories, product docs, i18n inventory, coverage matrix, OpenSpec deltas.
3. Add Playwright scenarios; run lint + typecheck (+ targeted e2e when env available).
4. Mark step 03 done in parent guide.
5. Rollback: revert UI/docs/e2e PR; stored hours columns remain valid.

## Open Questions

- None blocking — display location (DETAILS attribution), omit-when-disabled, and Mon→Sun order are locked by the step plan / parent guide.
