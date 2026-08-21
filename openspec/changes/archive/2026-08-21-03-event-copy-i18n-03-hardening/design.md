## Context

Parent feature: event title/description DE+EN (`.dev-plan/current-iteration/03-event-copy-i18n-parent-guide.md`), step 03 of 03 — docs, seed, and e2e. See `proposal.md` for motivation. Canonical product behavior is `docs/product/`; OpenSpec `openspec/specs/` is a planning mirror only.

Runtime already matches parent release criteria for copy (steps 01–02 done):

- Columns `title_de` / `title_en` / `description_de` / `description_en` (`text not null`); canonical `title` / `description` are DE write-time copies.
- `resolveEventCopy(event, locale)` on public detail, EventCard, map, SEO/JSON-LD, booking/waitlist chrome.
- Admin General: stacked DE then EN `TextField`s + two `EventDescriptionEditor`s (`title_de`, `title_en`, `description_de`, `description_en`). Labels in `getAdminCopy`: `titleLabelDe` = Titel (DE) / Title (DE), etc.
- Title ILIKE already ORs both locale columns.

What remains is the **verification and documentation layer**. Product Gherkin still says “a title” / “the description editor.” `schema-overview.md` still says emails/ICS “read canonical until locale UI lands.” Playwright `createEventViaUI` / `fillNewEventRequiredFields` still fill `Titel*` / `Beschreibung*` (exact), which no longer match `Titel (DE)*`. Seed still posts a single `title` (domain shim copies both locales), so `/de` and `/en` show the same string.

Constraints: Playwright titles match Gherkin `Scenario:` verbatim; proximity/layout selectors only (`docs/product/testing/bdd-and-e2e.md`); no `data-testid`; no new catalog write rules; HeroUI/theme rules unchanged; locale fixture defaults to `de`.

## Goals / Non-Goals

**Goals:**

- Bind Gherkin, schema/SEO/i18n/UI-map/gaps, coverage matrix, bilingual seed, and Playwright to the shipped locale copy.
- Keep existing demo-title e2e (`TITLES.tonight`, voucher titles, …) green by leaving those strings identical in both locales.
- Close the parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- New domain/UI behavior, extra locales, machine translation, taxonomy (series `04`), partner-name i18n.
- Locale-switching the admin Events table (canonical DE-first stays).
- Dropping the domain `title`/`description` shim for all seed rows (only the bilingual fixture must take the locale write path).
- Playwright for JSON-LD / `<title>` meta (unit tests in step 02 already cover SEO helpers); public e2e asserts the identity heading.
- Empty-locale reject e2e (Gherkin documents it; domain unit tests already cover `REQUIRED_FIELD`).

## Decisions

1. **Docs-and-Gherkin first, then helpers/seed, then Playwright, then matrix, then close-out**
   - **Choice:** Update product docs + Gherkin → fix `e2e/fixtures/admin.ts` labels/helpers → bilingual seed → new Playwright tests → coverage-matrix → parent close-out.
   - **Rationale:** E2E titles must match Gherkin verbatim; helpers must fill both fields before any create test runs; seed must exist before guest locale tests.
   - **Alternatives:** Flip e2e before Gherkin (title drift). Change seed before helpers (admin create still broken).

2. **Locked Gherkin / Playwright titles**
   - **Choice:** Product + Playwright use these titles verbatim (step brief):
     - `Guest sees English title on /en`
     - `Guest sees German title on /de`
     - `Create event with DE and EN titles`
     - `Filter by English title on /de` (**include** — cheap given the bilingual seed)
   - Keep existing `Admin authors Markdown description` and `Create a single event` bodies; add dual-locale notes there rather than renaming them.
   - **Rationale:** Step Spec Delta names the first three; optional feed filter is in-scope and the bilingual seed makes it cheap.
   - **Alternatives:** Skip the feed scenario (allowed by the brief, but then search-OR is docs-only). Rename OpenSpec step-02 scenarios (unnecessary; those stay runtime).

3. **Bilingual seed is additive; do not diverge `tonight` / voucher titles**
   - **Choice:** Add one upcoming SECRET_CODE demo event in `seed.ts` (same pattern as voucher promo/PDF: shared prebuilt image, first demo partner). Distinct titles, both non-empty:
     - DE (canonical): `Konzertabend: Unveiled-DE-Copy`
     - EN: `Concert Night: Unveiled-EN-Copy`
   - Export `DEMO_DISCOVERY_TITLES.localeCopyDe` / `localeCopyEn` from `demo-discovery-titles.ts`. Pass `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` into `createEvent` (locale write path, not the single-`title` shim). Descriptions MAY be short distinct Markdown (`"DE-Copy Beschreibung"` / `"EN-Copy description"`).
   - Leave Abundo JSON events and voucher demo titles as single `title` (shim → identical both locales) so `getEventIdByTitle(TITLES.tonight)` and heading assertions on both `/de` and `/en` keep working.
   - `getEventIdByTitle` matches canonical `event.title` after `listEvents({ q })`. Lookup the bilingual event by **DE** title.
   - **Rationale:** Existing discovery e2e hard-codes `TITLES.tonight` as the h1 on whichever `locale` the fixture uses (default `de`, but some tests `goto(/${locale}/…)`). Diverging tonight would break every heading assert that is not locale-aware.
   - **Alternatives:** Make all seed titles bilingual and teach every e2e a locale map (large blast radius). Create the bilingual event only inside Playwright via catalog API (skips demo/docs; brief asks for seed).

4. **Public locale e2e: guest, identity heading, no auth**
   - **Choice:** In `event-discovery.spec.ts`:
     - `Guest sees German title on /de`: `clearCookies`, `getEventIdByTitle(TITLES.localeCopyDe)`, `goto /de/events/:id`, `getByRole("heading", { level: 1, name: TITLES.localeCopyDe })`. Assert EN title `toHaveCount(0)` on that page.
     - `Guest sees English title on /en`: same id, `goto /en/events/:id`, heading = `TITLES.localeCopyEn`; DE title count 0.
   - Skip when `!hasDatabaseUrl()` with reason `DATABASE_URL required` (never “UI not built”).
   - Do **not** assert `<title>` / JSON-LD in Playwright (step 02 `seo.test.ts`).
   - **Rationale:** Spec Delta is identity title. Distinct strings + negative assert prove the page is not showing canonical on both URLs.
   - **Alternatives:** Create the event in-test via admin UI (needs R2 + admin). Parse JSON-LD script (brittle; unit-tested).

5. **Feed filter e2e uses the EN-only token on `/de`**
   - **Choice:** `Filter by English title on /de`: booking-eligible member (existing signup helper), `goto /de/events?title=Unveiled-EN-Copy` (plus today-floor date params if other feed tests require them). Expect the German card title `TITLES.localeCopyDe` visible. Token `Unveiled-EN-Copy` does not appear in any DE demo title.
   - **Rationale:** Step 01 already ORs ILIKE; this is the cheap proof the brief allows. Card title stays German on `/de`.
   - **Alternatives:** Admin list `title=` filter instead (also valid; public feed is the user-visible release criterion).

6. **Admin helpers fill both locales; new create scenario uses distinct strings**
   - **Choice:** Replace `adminLabels.title` / `description` with bilingual-capable names:
     - `titleDe`: `/titel \(de\)|title \(de\)/i`
     - `titleEn`: `/titel \(en\)|title \(en\)/i`
     - `descriptionDe`: `/beschreibung \(de\)|description \(de\)/i`
     - `descriptionEn`: `/beschreibung \(en\)|description \(en\)/i`
   - `fillTextbox` today requires a `string` + `exact: true`. Add `fillLabeledTextbox(page, name: string | RegExp, value)` (or overload) that uses `getByRole("textbox", { name })` **without** `exact` when the name is a RegExp. Hidden Markdown textareas remain the labeled controls (same as today).
   - `createEventViaUI` / `fillNewEventRequiredFields`: fill DE and EN titles (default: same `title` string both sides) and both descriptions (default: same description both sides). Optional overrides `titleDe` / `titleEn` / `descriptionDe` / `descriptionEn`. `CreatedEvent.title` stays the canonical/DE string for admin table + existing `expectPublicEventDetail`.
   - New test `Create event with DE and EN titles`: R2 + `E2E_ADMIN_*` skip like other creates; `titleDe = E2E DE ${suffix}`, `titleEn = E2E EN ${suffix}`; after create, `goto /de/events/:id` heading DE, `goto /en/events/:id` heading EN (guest cookies cleared).
   - **Rationale:** Exact `"Titel*"` no longer matches `"Titel (DE)*"`. Default same-string fill keeps dozens of existing tests passing. The new scenario is the only one that must diverge.
   - **Alternatives:** Keep filling `input[name=title_de]` (forbidden except documented file-input exception). Locale-specific exact strings in two helper maps (more code, same outcome).

7. **Gherkin body updates (keep old scenario names)**
   - **Choice:**
     - `Create a single event`: “titles and descriptions for German and English” (not a single title).
     - `Admin authors Markdown description`: two editors (`description_de` / `description_en`); public detail renders the locale-resolved Markdown.
     - `Edit event details`: both locale titles/descriptions.
     - New scenarios listed in decision 2.
     - Empty-locale reject: a Then/And on the new create scenario **or** a short additional scenario in the feature file (Gherkin-only; no new Playwright — domain unit tests exist). Prefer a comment/And on `Create event with DE and EN titles` plus one `Scenario: Create rejects empty English title` **without** e2e if that would duplicate `REQUIRED_FIELD` coverage — **include the Gherkin scenario, leave matrix as Gherkin-only / no Playwright row required** (document in coverage-matrix notes: covered by `event-copy.unit.test.ts`).
   - **Rationale:** Brief: reject when either locale is empty. E2e for the empty path needs a full wizard + R2 image and is low value vs unit tests.
   - **Alternatives:** Full Playwright empty-submit (slow, R2). Skip Gherkin reject (fails the Spec Delta).

8. **Docs touch list (stale wording in scope)**
   - **Choice:**
     - `schema-overview.md`: keep four-column rows; rewrite canonical note — public/member copy uses `resolveEventCopy`; ICS / admin list / ledger MAY still read canonical `title`. Drop “until locale UI lands.”
     - `seo-and-metadata.md`: event `<title>` = `{resolved title} at {partner} — Unveiled Berlin`; meta + JSON-LD from resolved description/title for that locale URL.
     - `content-i18n-inventory.md`: `titleLabelDe` / `titleLabelEn` / `descriptionLabelDe` / `descriptionLabelEn` + `fieldErrors.titleDe` / `titleEn` / `descriptionDe` / `descriptionEn`.
     - `ui-component-map.md`: Event detail identity title + Markdown; EventCard title — locale-resolved.
     - `gaps-and-decisions.md`: current-state row — both locales required; canonical DE; search OR; public `/:locale` resolves copy.
   - **Rationale:** Step scope. Leaving the “until locale UI lands” sentence would keep a greppable lie.
   - **Alternatives:** Only files named in the task bullets — still leaves schema-overview stale.

9. **OpenSpec mirror vs product SoT**
   - **Choice:** This change’s `event-discovery` / `admin-events` ADDED deltas are the planning contract. Apply updates `docs/product/` as SoT. Do not treat archived OpenSpec specs as behavioral SoT. After apply, mark the parent step done.
   - **Rationale:** AGENTS.md / step Cleanup.
   - **Alternatives:** Sync `openspec/specs/` only.

## Risks / Trade-offs

- **[Risk] `fillTextbox(..., "Titel*", exact)` leftovers** → Mitigation: grep `adminLabels.title` / `"Titel*"` / `"Beschreibung*"` in `e2e/`; switch every event-form fill to the new regex labels.
- **[Risk] MDXEditor is not `role=textbox` named Beschreibung (DE)** → Mitigation: same hidden-textarea association as the old single editor; if fill fails, use `getByLabel` / labeled textarea, not `data-testid`. Confirm against `EventDescriptionEditor` `aria-labelledby`.
- **[Risk] `getEventIdByTitle(EN)` fails because it equality-checks canonical `title`** → Mitigation: always look up the bilingual event by DE title; never pass `localeCopyEn` into `getEventIdByTitle`.
- **[Risk] Shared DB has no bilingual seed yet (staging not reseeded)** → Mitigation: tests skip only on missing `DATABASE_URL`; if the event is missing, fail with `Event not found` (forces `seed:demo` / deploy note in DEPLOYMENT if the demo script lists events). Add a one-line DEPLOYMENT demo note: bilingual Konzertabend / Concert Night.
- **[Risk] Feed filter `Unveiled-EN-Copy` matches another event** → Mitigation: unique suffix reserved to this seed row; ILIKE is substring — keep the token unique in `DEMO_DISCOVERY_TITLES`.
- **[Trade-off] Empty-locale reject is Gherkin + unit test, not Playwright** → Acceptable; wizard+R2 cost is high; Spec Delta “reject submit” is documented.
- **[Trade-off] Most seed titles stay identical DE/EN** → Demo catalog is not fully bilingual; one fixture is enough for e2e and staging smoke.

## Migration Plan

1. Land docs + helpers + seed + e2e together (no schema migration).
2. Reseed staging (`bun run seed:demo`) so the bilingual event exists before the new discovery tests run against staging.
3. No rollback beyond reverting the docs/e2e/seed commit; steps 01–02 UI/domain remain correct.
4. After merge: mark step 03 + parent guide done; archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — step 02 UI is the source of labels; bilingual seed titles are locked above.)_
