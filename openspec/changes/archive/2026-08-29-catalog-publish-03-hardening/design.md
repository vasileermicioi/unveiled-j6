## Context

See `proposal.md` for motivation. Parent feature: catalog publish / unpublish (`.dev-plan/current-iteration/catalog-publish-parent-guide.md`), step 03 of 03 — Gherkin, Playwright, canonical docs. Canonical product behavior is `docs/product/`; OpenSpec `openspec/specs/` is a planning mirror only.

Runtime already matches parent release criteria (steps 01–02 done / archived):

- `@unveiled/db`: `events.published`, `featured_events.published`, `featured_partners.published`; `setEventPublished` / `setFeaturedEventPublished` / `setFeaturedPartnerPublished`; `getPublicEventById` null when draft; member feed / saved-upcoming / sitemap / booking / waitlist / save reject unpublished; Discover `publishedOnly: true`.
- Admin: Published/Draft chips; optional events `published=yes|no`; six confirm routes; create → event publish confirm; featured-add → featured publish confirm; `featuredPublished` distinct from catalog `Event.published`.
- Demo seed explicitly publishes demo events and featured rows.

What remains is the **verification and documentation layer**. Product Gherkin and Playwright still treat create as live on Browse/public detail (`createEventViaUI` expects `/admin/events` and `Create a single event` calls `expectPublicEventDetail`). Featured-add tests expect a list redirect. `createPricedSlotEvent` raw-inserts without `published` (new rows default `false`). `ensureDemoFeaturedSplit` calls `addFeaturedEvent` (now unpublished) without `setFeaturedEventPublished`. Schema-overview / SEO / i18n / gaps-and-decisions still omit the three-flag contract.

Constraints: Playwright titles match Gherkin `Scenario:` verbatim (`docs/product/testing/bdd-and-e2e.md`); proximity/layout selectors only (`getByRole` / `getByLabel` / `getByText` / filter / nth); no `data-testid`; Europe/Berlin for displayed datetimes; never `@skip-no-ui` for these MVP scenarios; no new product behavior; no new visual tokens.

## Goals / Non-Goals

**Goals:**

- Land Gherkin, schema-overview, SEO/sitemap notes, i18n inventory, gaps-and-decisions, coverage matrix, and Playwright titles for the shipped three-flag publish contract.
- Fix e2e helpers so create/add-featured no longer assume “save = live”; publish explicitly when asserting Browse, Discover, public detail, or booking.
- Close the parent feature: mark step 03 done and walk Release Criteria.

**Non-Goals:**

- Changing `set*Published`, Discover `publishedOnly`, confirm routes, or admin copy.
- Event preview (`event-preview-*`); `partners.published`; bulk/scheduled publish; partner portal.
- Inbox harness or new env vars.
- Inventing parallel Playwright titles for existing scenarios.

## Decisions

1. **Docs and Gherkin first, then helpers, then Playwright, then matrix, then close-out**
   - **Choice:** Patch feature files + extras → fix `createEventViaUI` / catalog fixtures → add/update titled tests → coverage-matrix rows → parent close-out.
   - **Rationale:** E2E titles must match Gherkin verbatim; helpers must land before any test that creates an event. Same order as admin-event-bookings-03 / subscription-invoice-email-03.
   - **Alternatives:** Flip e2e before Gherkin (title drift); close parent before matrix (release criteria incomplete).

2. **File mapping stays one spec file per feature basename**
   - **Choice:**
     | Gherkin | Playwright |
     |---|---|
     | `admin-events.feature` | `e2e/specs/admin-events.spec.ts` |
     | `admin-partners.feature` | `e2e/specs/admin-partners.spec.ts` |
     | `event-discovery.feature` | `e2e/specs/event-discovery.spec.ts` |
     | `booking.feature` | `e2e/specs/booking.spec.ts` |
     | `waitlist.feature` | `e2e/specs/waitlist.spec.ts` |
     Shared helpers MAY live in `e2e/fixtures/`; titles stay on the mapped spec file.
   - **Rationale:** BDD hard rule 1.
   - **Alternatives:** A new `catalog-publish.spec.ts` (breaks file mapping).

3. **Locked new `Scenario:` titles (do not invent parallels)**
   - **Choice:** Add only these titles. Update steps of existing titles in place.

     `admin-events.feature`:
     - `Publish confirm goes live on Browse` — **pass**
     - `Unpublish confirm hides from Browse` — **pass**
     - `Create does not appear on Browse` — **pass**
     - `Event list shows Published or Draft status` — **pass**
     - `Event list filters by published` — **pass**
     - `Unpublish does not delete or drop featured membership` — **pass**

     `admin-partners.feature`:
     - `Add featured partner stays off Discover until publish` — **pass**
     - `Publish featured partner shows on Discover` — **pass**
     - `Unpublish featured partner keeps venue` — **pass**

     `event-discovery.feature`:
     - `Unpublished featured event stays off Discover` — **pass**
     - `Unpublished featured partner stays off Discover` — **pass**
     - `Unpublished events are hidden from Browse events` — **pass** (assert `/events` and `/events/map` in one test)
     - `Published featured event with unpublished catalog stays off Discover` — **pass**
     - `Unpublished event public detail is not found` — **pass**
     - `Saved list hides unpublished events` — **pass** (save a published event, unpublish, `/saved` omits it)

     `booking.feature`:
     - `Book unpublished fails` — **pass** (direct `/:locale/events/:id/book` on a draft)
     - `Existing booking remains after unpublish` — **pass**

     `waitlist.feature`:
     - `Join unpublished fails` — **skip** pointing at `packages/db` unpublished `joinWaitlist` test (no honest waitlist CTA on 404 detail)

     Existing titles whose **steps** change (same Playwright title):
     - `Create a single event` — admin catalog Draft; **do not** call `expectPublicEventDetail` / Discover.
     - `Create event with DE and EN titles` / `Admin sets Berlin zip on create` / any other create that opens public detail — publish first.
     - `Add by searching existing events` / `Add by searching existing partners` — land on publish confirm; featured row Draft; Discover still empty.
     - `Admin remove from featured keeps catalog event` / `Admin remove from featured partners keeps venue` — Discover omit still holds (row was never published, or was unpublished).
   - **Rationale:** Step brief + parent product-decision table. Combine Browse+map in one title as the step plan wrote it.
   - **Alternatives:** Separate map-only title (parallel). Force waitlist UI on a 404 page (not honest).

4. **`createEventViaUI` handles publish-confirm redirect; publish is opt-in**
   - **Choice:** After Anlegen/Create, expect `/${locale}/admin/events/:id/publish` (not the list). Parse `eventId` from that URL. Default: click cancel (`copy.cancel` / Abbrechen) or `goto` the events list so admin-only callers still see the Draft row. Add `overrides.publish?: boolean` (default `false`). When true, submit the confirm (`Veröffentlichen` / `Publish`) and land on the list `?ok=publish`. Add `publishEventViaUI(page, locale, eventId)` for tests that create then later publish. Do **not** auto-publish inside the helper unless asked — that would hide the create-as-draft contract.
   - **Rationale:** Step 02 create redirect is the source of helper breakage. Opt-in publish keeps draft tests honest.
   - **Alternatives:** Always publish (hides draft). Leave callers to confirm (every admin test would break on the URL expect).

5. **DB fixtures used for member/public surfaces must set `published: true`**
   - **Choice:** `createPricedSlotEvent` and any other raw `events` insert in `e2e/fixtures/` SHALL set `published: true` (or call `setEventPublished` after insert) so discovery/booking tests that clone seed rows keep working. `ensureDemoFeaturedSplit` / `ensureDemoFeaturedPartnersSplit`: after `addFeatured*`, call `setFeaturedEventPublished` / `setFeaturedPartnerPublished` true (and `setEventPublished` true if the catalog row could be draft). Seeded demo rows are already published; re-add paths must not leave unpublished featured membership.
   - **Rationale:** Column default is `false`. Silent draft inserts would fail half the discovery suite.
   - **Alternatives:** Publish only in each spec (easy to miss). Change the DB default for tests (lies about production).

6. **Featured UI helpers for add → confirm**
   - **Choice:** After featured-add submit, expect the matching publish confirm URL (`/admin/featured/:eventId/publish` or `/admin/featured-partners/:partnerId/publish`). Tests that only need a featured **membership** (reorder, remove) cancel back to the list (Draft row stays). Tests that assert Discover submit publish (and, for events, ensure catalog `published`). Add `publishFeaturedEventViaUI` / `publishFeaturedPartnerViaUI`.
   - **Rationale:** Step 02 featured-add pointer. Reorder/remove do not need Discover.
   - **Alternatives:** Always publish featured-add (would put unique e2e titles on Discover and flake guest tests).

7. **Selectors, copy, timezone, 404**
   - **Choice:** Bilingual roles: `/veröffentlichen|publish/i`, `/veröffentlichung aufheben|unpublish/i`, `/entwurf|draft/i`, `/veröffentlicht|published/i`. Filter: native `<select>` via `getByLabel(/^status$/i)` (`eventsPublishedFilter`). Confirm submit: `getByRole('button', { name: /veröffentlichen|publish/i })` (not the nav). Public unpublished: `goto /:locale/events/:id` → `NotFoundPage` heading (`/nicht gefunden|not found/i`) and HTTP 404 (`response.status()`). Do not assert the draft title in `<title>` or h1. Browse: booking-eligible member, filter `{ hasText: draftTitle }` count 0 on `main`. Discover: guest, same. Datetimes: assert visible Berlin-formatted text already on the page.
   - **Rationale:** BDD hard rule 3; step-02 copy table is locked.
   - **Alternatives:** `data-testid` (forbidden). Class selectors on chips (forbidden).

8. **Existing create tests that open public detail must publish**
   - **Choice:** Grep `e2e/specs` for `expectPublicEventDetail`, `goto(\`/${locale}/events/`, and `expectEventOnDiscover` after `createEventViaUI`. Any assertion on public detail or member Browse requires `publish: true` (or `publishEventViaUI`). `expectEventOnDiscover` SHALL stop falling back to the admin catalog — Discover assertions must be real Discover, or the caller should assert the admin row instead. Seed-demo Discover assertion stays (seed publishes).
   - **Rationale:** Parent risk: “e2e that assume a new event is immediately browsable must be updated.”
   - **Alternatives:** Leave the fallback (hides regressions).

9. **Save unpublished: save-then-unpublish, not save-on-404**
   - **Choice:** `Saved list hides unpublished events` — activate member, save a **published** event from public detail, admin-unpublish, `/saved` omits the title. Do not try to click Save on a 404 page. Domain `saveEvent` reject stays a package test; no extra Gherkin title for “save rejects unpublished” unless we later add an honest UI path.
   - **Rationale:** Public detail 404 has no Save CTA. Step plan allows save coverage via the saved list hide.
   - **Alternatives:** Direct POST from Playwright (not an SSR user path). Skip the saved-list scenario (weaker).

10. **Sitemap, schema, SEO, i18n, gaps, UI map**
    - **Choice:**
      - Sitemap: confirm the six publish/unpublish rows and `published=` on the events list (already added in step 02). Do not invent new paths.
      - `schema-overview.md`: add `published` boolean NOT NULL to `events`, `featured_events`, `featured_partners` (backfill true / default false / independent; index `events (published, date_time)`). Note public readers use `getPublicEventById`; admin lists stay unfiltered.
      - `seo-and-metadata.md`: unpublished `/events/:id` is **404** (same as missing) — **not** `noindex` 200. Not in `sitemap.xml`. Sold-out/past published events stay 200 + `noindex`.
      - `content-i18n-inventory.md`: bullet for step-02 keys (`statusPublished`, `statusDraft`, publish/unpublish actions + confirm titles/bodies, filter labels, `okPublish` / `okUnpublish`, `featuredCatalogDraftNote`).
      - `gaps-and-decisions.md`: new row — three independent flags; Discover events need both; no `partners.published`; unpublish does not cancel bookings or drop featured membership.
      - `ui-component-map.md` / `app-shell.md`: only if a sentence still says create/add-featured is immediately live. Grep `docs/product` for “create = live” / “add to featured” implying Discover.
    - **Rationale:** Step scope list. SEO must not treat draft 404 as sold-out 200.
    - **Alternatives:** Document unpublished as `noindex` 200 (contradicts `getPublicEventById` null).

11. **Coverage matrix and env skips**
    - **Choice:** New rows under the matching feature files. UI scenarios `pass` with notes `E2E_ADMIN_*` + R2 when they create via UI. Waitlist unpublished `skip` with domain-test pointer. Never `@skip-no-ui`.
    - **Rationale:** Matrix vocabulary already distinguishes env skip vs hard skip.
    - **Alternatives:** Mark UI scenarios `unshipped` (wrong — UI shipped in 02).

12. **OpenSpec mirror vs product SoT**
    - **Choice:** This change’s deltas are the planning contract. Apply updates `docs/product/` as SoT. Do not treat `openspec/specs/` as behavioral SoT. After apply, mark the parent step done.
    - **Rationale:** AGENTS.md / step Cleanup.
    - **Alternatives:** Sync OpenSpec only — agents would still follow stale Gherkin.

## Risks / Trade-offs

- **[Risk] `createEventViaUI` URL change breaks every admin-events/admin-partners test** → Mitigation: land the helper first; parse id from publish URL; cancel to list by default; run the full admin-events + admin-partners specs.
- **[Risk] `createPricedSlotEvent` inserts drafts and flakes discovery/booking** → Mitigation: set `published: true` on those inserts; grep other raw `events` inserts in `e2e/`.
- **[Risk] `ensureDemoFeaturedSplit` re-adds unpublished featured rows** → Mitigation: `setFeatured*Published(true)` after add.
- **[Risk] Unique e2e titles leak onto Discover and collide with guest featured tests** → Mitigation: leave featured-add unpublished unless the test asserts Discover; unique titles stay off Discover.
- **[Risk] Stale “create = live” / “add = Discover” survives in an unlisted doc** → Mitigation: grep `docs/product` after edits.
- **[Risk] `@skip-no-ui` folklore** → Mitigation: env skips and domain-test skips only.
- **[Trade-off] Waitlist unpublished is skip in e2e** → Domain integration already covers it; no waitlist CTA on 404.
- **[Trade-off] `Create a single event` no longer asserts public detail** → Locale titles + zip keep public-detail coverage after they publish.

## Migration Plan

1. Land docs + helper fixes + Playwright + matrix together. No schema/API migration, no new secrets.
2. After deploy: no operator Dashboard change. Optional staging smoke: create event (stays draft) → publish → appears on Browse; add featured (stays off Discover) → publish both flags → appears on Discover.
3. Rollback: revert the docs/e2e commit; runtime from steps 01–02 remains.
4. After merge: mark step 03 + parent guide done (feature released); archive this OpenSpec change when applying `/opsx:archive`.

## Open Questions

_(none blocking — runtime is shipped; waitlist unpublished e2e is explicitly skipped per decision 3.)_
