## Context

See `proposal.md` for motivation. Parent feature: event preview (`.dev-plan/current-iteration/event-preview-parent-guide.md`), step 03 of 03 — Gherkin, Playwright, canonical docs. Canonical product behavior is `docs/product/`; OpenSpec `openspec/specs/` is a planning mirror only.

Runtime already matches parent release criteria (steps 01–02 done / archived 2026-08-29):

- Detail: `apps/web/app/routes/[locale]/admin/events/[id]/preview/index.tsx` — `loadAdminEventPreview` + `EventDetailPage` `preview` (`primaryHref` = detail preview, `primaryLabel` = `previewOnlyCta`).
- Cards: `preview/browse.tsx` (member `EventCard`, no `bookmarkFormAction`, `ctaHref` → detail preview) and `preview/discover.tsx` (guest `EventCard` + `PageSectionHeader` from `getPageContent(locale, "discover").livePreview`). Shared `AdminEventPreviewCardFrame`.
- Chrome: `AdminEventPreviewChrome` with surface links Detail / Browse events / Discover (`aria-current="page"`); audience Guest/Member on detail only; Draft/Published chip; edit + publish/unpublish links.
- Sitemap rows for all three paths already exist (step 02). `robots: "noindex"`. FormDraft-exempt.

What remains is the **verification and documentation layer**. `admin-events.feature`, `admin-events.spec.ts`, i18n inventory, UI component map, gaps-and-decisions, and coverage matrix omit preview.

Constraints: Playwright titles match Gherkin `Scenario:` verbatim (`docs/product/testing/bdd-and-e2e.md`); proximity/layout selectors only; no `data-testid`; Europe/Berlin for displayed datetimes; never `@skip-no-ui` for these MVP scenarios; no new product behavior; no new visual tokens.

## Goals / Non-Goals

**Goals:**

- Land Gherkin, Playwright, sitemap confirm, i18n inventory, UI component-map mention, gaps-and-decisions, and coverage-matrix rows for the three shipped preview surfaces.
- Close the parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- New preview surfaces, partner-tile preview, map/filter/marquee frames.
- Changing `EventDetailPage` inert preview, `EventCard` viewers, publish rules, or admin copy (unless a titled test cannot be asserted with allowed selectors — then add a visible label, do not add `data-testid`).
- Separate Playwright titles for member audience, chrome switcher, card CTA, catalog Preview entry, or USER-denied.
- Inbox harness or new env vars.

## Decisions

1. **Docs and Gherkin first, then Playwright, then matrix, then close-out**
   - **Choice:** Patch `admin-events.feature` + extras/sitemap/component-map → add titled tests → coverage-matrix rows → parent close-out.
   - **Rationale:** E2E titles must match Gherkin verbatim. Same order as `catalog-publish-03-hardening`.
   - **Alternatives:** Flip e2e before Gherkin (title drift); close parent before matrix (release criteria incomplete).

2. **File mapping stays one spec file per feature basename**
   - **Choice:** All five titles live in `admin-events.feature` → `e2e/specs/admin-events.spec.ts`. Do not add `event-preview.spec.ts` or touch `event-discovery.feature` / `booking.feature`.
   - **Rationale:** BDD hard rule 1. Public 404 for the draft is an **AND** step of **Preview draft detail**, already proven as its own titled scenario in `event-discovery.feature` (**Unpublished event public detail is not found**).
   - **Alternatives:** A new preview spec file (breaks file mapping). Duplicate the 404 title in `event-discovery.feature` (parallel).

3. **Locked `Scenario:` titles (do not invent parallels)**
   - **Choice:** Add only these five titles, matching the step plan and this change’s spec delta:

     | Title | Status |
     |---|---|
     | `Preview draft detail` | **pass** |
     | `Preview does not book` | **pass** |
     | `Preview browse card` | **pass** |
     | `Preview discover card` | **pass** |
     | `Guest cannot open event preview` | **pass** |

     Do **not** add Gherkin/Playwright titles for: `Member audience is read-only`, `Preview entry from catalog and edit`, `Card preview CTA stays in admin preview`, `Preview chrome switches surfaces`, `Non-admin cannot open event preview`, `Non-admin cannot open card previews`. Those remain planning-mirror scenarios on `openspec/specs/admin-events`; product SoT uses the five titles above. Card CTA is an **AND** on browse. USER → locale home stays existing `guardAdminRoute` coverage (same as **Sales export is admin-only** leaving USER to auth route-protection).
   - **Rationale:** Step plan Implementation lists exactly these five. Extra titles would be parallels.
   - **Alternatives:** Port every step 01–02 planning scenario into Gherkin (over-coverage; step plan said no).

4. **Create stays draft; R2 skip unchanged**
   - **Choice:** Each create-based test uses existing `createEventViaUI` **without** `publish: true` (and without adding to featured). Reuse `createPartnerViaUI`. Keep `test.skip(!hasAdminCredentials())` from the describe `beforeEach` and `test.skip(!r2Configured(), "R2 vars not configured")` on tests that create via UI. Do not change `createEventViaUI`.
   - **Rationale:** Step plan: leave unpublished if catalog-publish shipped. Helper already lands on publish confirm and cancels to the Draft list.
   - **Alternatives:** Reuse a seeded published event (would not prove draft preview vs public 404). Raw DB insert (skips the admin create path the suite already uses).

5. **Selectors, copy, 404, guest deny**
   - **Choice:**
     - Preview banner / surface links: `getByRole('link', { name: /^(detail)$/i })`, `/events entdecken|browse events/i`, `/^entdecken$|^discover$/i`. Draft chip: `getByText(/entwurf|draft/i)` near the Preview / Vorschau banner.
     - Locale title: `getByRole('heading', { name: event.title })` on detail; `getByRole('main').getByText(event.title)` on cards.
     - Public 404 (after `clearCookies`): `goto /:locale/events/:id` → `response.status() === 404` and heading `/seite nicht gefunden|page not found/i`; `getByRole('heading', { name: event.title })` count 0. Same pattern as `event-discovery.spec.ts` **Unpublished event public detail is not found**.
     - Inert checkout: `getByRole('link', { name: /nur vorschau|preview only/i })` visible; `getByRole('button'|'link', { name: /^(buchen|book|anmelden|log in|merken|save|warteliste|waitlist)$/i })` count 0 on `main`. Do not submit any form.
     - Browse card: unique title count 1 on `main`; CTA `getByRole('link', { name: event.title })` (or the Preview-only footer if that is the visible card CTA) navigates to `/${locale}/admin/events/${id}/preview` (not `/events/${id}`). Optional: zip `10115` (default create) visible on the member card.
     - Discover card: same unique title; `getByText` Discover `livePreview` eyebrow + headline (`Mit deiner Mitgliedschaft buchbar` / `Bookable with your membership`; `Aktuelle Events in Berlin.` / `Current events in Berlin.`). After `clearCookies`, `goto /:locale/discover` → title count 0.
     - Guest deny: `context.clearCookies()` then `goto /:locale/admin/events/:id/preview` → URL `/${locale}/login?returnTo=` (same as **Sales export is admin-only**). Title heading count 0. Optionally also hit browse/discover in the same test (no extra titles).
     - Do not use `.admin-*` class selectors (existing featured tests that still do are out of scope).
   - **Rationale:** BDD hard rule 3; bilingual roles already used in this spec file.
   - **Alternatives:** `data-testid` (forbidden). Class selectors on the card grid (forbidden).

6. **One create can feed multiple preview GETs inside a test; do not share one event across the five titles**
   - **Choice:** Each titled test creates its own draft (except **Guest cannot open event preview**, which may create one draft then clear cookies). Inside **Preview browse card** / **Preview discover card**, following the card CTA or switching chrome links in the same test is allowed as extra assertions, not new titles.
   - **Rationale:** Isolation; unique titles avoid colliding with seed Discover/Browse rows.
   - **Alternatives:** One shared fixture for all five (faster, flakes if a test publishes).

7. **Sitemap, i18n, component map, gaps — confirm and fill gaps, do not invent routes**
   - **Choice:**
     - Sitemap: confirm the three existing rows stay ADMIN, `noindex`, GET, FormDraft-exempt. Do not add query-only rows for `?audience=member`.
     - `content-i18n-inventory.md`: new bullet under admin-content for preview keys — `previewAction` Vorschau / Preview; `previewBanner`; `previewSurfaceDetail` Detail / Detail; `previewSurfaceBrowse` Events entdecken / Browse events; `previewSurfaceDiscover` Entdecken / Discover; `previewAudienceGuest` Gast / Guest; `previewAudienceMember` Mitglied / Member; `previewBrowseNote`; `previewOnlyCta` Nur Vorschau / Preview only; `previewDocumentTitle` `Vorschau: {title}` / `Preview: {title}`. Discover header tokens already live in the Discover inventory; mention they are reused on discover preview.
     - `ui-component-map.md` Events row: add that Preview is `AdminEventPreviewChrome` + three GET routes (`/:id/preview`, `.../preview/browse`, `.../preview/discover`); detail reuses `EventDetailPage` (inert); cards reuse `EventCard` + `AdminEventPreviewCardFrame`; FormDraft-exempt; `noindex`.
     - `gaps-and-decisions.md`: one row — admin-only preview (guest → login; USER → locale home); three GET surfaces reuse live `EventDetailPage` / `EventCard` with inert CTAs; Discover preview does not require featured membership or `featured_events.published`; drafts previewable while public `/events/:id` stays 404. Refs: `admin-events.feature`, sitemap, this parent guide.
   - **Rationale:** Step plan deliverables. Sitemap already written in step 02.
   - **Alternatives:** Defer i18n (parent Release Criteria requires inventory). Rewrite sitemap paths (they are already correct).

8. **Coverage matrix and env skips**
   - **Choice:** Five new rows under `admin-events.feature`. Status `pass`. Notes: `E2E_ADMIN_*` + R2 for create-based tests; guest-deny needs create (R2) then `clearCookies` (no extra admin creds after clear). Never `@skip-no-ui`.
   - **Rationale:** Matrix vocabulary already distinguishes env skip vs hard skip.
   - **Alternatives:** Mark `unshipped` (wrong — UI shipped in 01–02).

9. **OpenSpec mirror vs product SoT**
   - **Choice:** This change’s delta is the planning contract. Apply updates `docs/product/` as SoT. Do not treat `openspec/specs/` as behavioral SoT. After apply, mark the parent step done. Existing `Admin preview of event detail` / `Admin preview of Browse and Discover cards` requirements stay; this step **adds** the documentation-and-test requirement.
   - **Rationale:** AGENTS.md / step Cleanup.
   - **Alternatives:** Sync OpenSpec only — agents would still follow stale Gherkin.

## Risks / Trade-offs

- **[Risk] Draft title collides with seed Discover/Browse rows** → Mitigation: `uniqueSuffix()` titles (existing helper); assert count 1 on preview `main`; Discover live assert uses that unique title.
- **[Risk] Card CTA accessible name is the image/title, not "Preview only"** → Mitigation: follow the title link; assert resulting URL is the admin detail preview. Detail inert CTA uses `previewOnlyCta`.
- **[Risk] Guest deny without creating an event still 302s to login** → Accepted as sufficient for the URL assert; still create a draft first so the test proves the event body is not shown (title count 0) rather than only "admin is gated".
- **[Risk] Public 404 assertion needs cookies cleared while still on an admin session** → Mitigation: same `page.context().clearCookies()` pattern as **Create event with DE and EN titles**.
- **[Risk] `@skip-no-ui` folklore** → Mitigation: env skips only.
- **[Trade-off] USER-denied is not a titled scenario** → Existing admin-route-protection; step plan asked for guest denied.
- **[Trade-off] Sitemap is confirm-only** → Step 02 already registered the paths.

## Migration Plan

1. Land docs + Playwright + matrix together. No schema/API migration, no new secrets.
2. After deploy: no operator Dashboard change. Optional staging smoke: create draft → three preview URLs 200 → public `/events/:id` 404.
3. Rollback: revert the docs/e2e commit; runtime from steps 01–02 remains.
4. After merge: mark step 03 + parent guide done (feature released); archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — runtime is shipped; the five titles are locked.)_
