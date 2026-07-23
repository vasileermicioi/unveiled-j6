## Context

Parent feature: Featured partners (`.dev-plan/current-iteration/featured-partners-parent-guide.md`). Step 01 is done: `featured_partners` schema + `@unveiled/db` helpers (`listFeaturedPartners`, `searchPartnersNotFeatured`, `addFeaturedPartner`, `removeFeaturedPartner`) and integration tests.

Current gaps:

- Admin tab for `/admin/featured` is still labeled **Featured** / **Empfohlen** while page titles already say Featured events / Empfohlene Events.
- No Featured partners admin tab or SSR mutation pages.
- Discover (`discover.tsx`) still calls `listPartners(db, { limit: 8 })` for Partner venues.
- Demo seed features events but not partners.

UX/template to mirror: `apps/web/app/routes/[locale]/admin/featured/**` + `AdminFeaturedListPage` / `Add` / `Remove` / `Table` / `AddResults`, wired through `guardAdminRoute`, `renderAdminPage`, and `admin-content.ts`.

Constraints: SSR-only form POST mutations; HeroUI-only markup; Tailwind layout only; business logic stays in `@unveiled/db`; no product-docs/e2e matrix (step 03); no drag-and-drop reorder; Discover display cap 8 without hard-reject on admin add.

## Goals / Non-Goals

**Goals:**

- Admin chrome: **Featured events** + **Featured partners** tabs with correct DE/EN labels.
- Featured partners list/add/remove SSR flows (ADMIN-guarded), mirroring featured events.
- Discover Partner venues from curated featured partners (limit 8); hide section when empty (existing UI).
- Demo seed features a small partner subset so Discover marquee is non-empty after `seed:demo`.

**Non-Goals:**

- Full `docs/product/` + Playwright/BDD matrix (step 03).
- Partner portal, public partner pages, clickable Discover partner tiles.
- Renaming `/admin/featured*` URL paths for events.
- Drag-and-drop / move-up-down reorder; hard reject when curated count exceeds 8.

## Decisions

1. **Mirror featured-events admin surfaces with partner-specific names**
   - **Choice:** Routes under `apps/web/app/routes/[locale]/admin/featured-partners/` (`index`, `add`, `[partnerId]/remove`). Components: `AdminFeaturedPartnersListPage`, `AdminFeaturedPartnersAddPage`, `AdminFeaturedPartnersRemovePage`, `AdminFeaturedPartnersTable`, `AdminFeaturedPartnersAddResults` (or equivalent `*FeaturedPartner*` names that do not collide with event `AdminFeatured*`).
   - **Rationale:** Step brief; proven SSR/form-POST pattern; keep event Featured components untouched.
   - **Alternatives:** Reuse generic parameterized Featured components (higher abstraction risk this step); nest under `/admin/partners/featured` (diverges from events URL shape).

2. **AdminTab id `featured-partners` after `featured`**
   - **Choice:** Extend `AdminTab` / `ADMIN_TAB_ORDER` with `"featured-partners"` immediately after `"featured"`. Add `adminFeaturedPartnersPath`, `adminFeaturedPartnersAddPath`, `adminFeaturedPartnersRemovePath`. Wire `AdminTabNav` + Ladle story. Copy: `tabFeaturedPartners` + list/add/remove keys parallel to `featured*` keys.
   - **Rationale:** Clear chrome next to Featured events; path helpers match existing style.
   - **Alternatives:** Nested id under partners; place tab after partners instead of after featured.

3. **`inferAdminTab` must match `featured-partners` before `featured`**
   - **Choice:** In `inferAdminTab`, check `pathname.includes("/admin/featured-partners")` **before** `pathname.includes("/admin/featured")`.
   - **Rationale:** Current check uses `includes("/admin/featured")`, which also matches `/admin/featured-partners` and would highlight the wrong tab.
   - **Alternatives:** Stricter segment parsing (`/admin/featured` exact or `/admin/featured/`); reject — easy to get wrong if order is wrong.

4. **Tab label rename only for events**
   - **Choice:** Change `tabFeatured` EN `"Featured"` → `"Featured events"`; DE `"Empfohlen"` → `"Empfohlene Events"` (align with existing `featuredTitle`). Keep routes under `/admin/featured*`.
   - **Rationale:** Parent + step brief; disambiguates chrome beside Featured partners.
   - **Alternatives:** Shorter labels if wrap becomes painful — accept wrap first; tighten in step 03 if needed.

5. **Discover: `listFeaturedPartners(db, { limit: 8 })`**
   - **Choice:** In `discover.tsx`, replace `listPartners(db, { limit: 8 })` with `listFeaturedPartners(db, { limit: 8 })`. Keep mapping via `toDiscoverPartnerTile`. Empty array → existing `DiscoverPage` hide Partner venues.
   - **Rationale:** Step brief prefer API limit; display cap only; featured events path unchanged.
   - **Alternatives:** List all featured then slice in app (worse); hard-reject 9th admin add (parent: admin may hold longer list).

6. **Demo seed: feature a subset of created partners**
   - **Choice:** While seeding catalog entries, collect created partner ids (prefer those with logos when easy). After partner/event creation loop, call `addFeaturedPartner` for a fixed small subset (e.g. first 3–6, or a named constant list) — **not** every partner. Leave ≥1 partner non-featured when catalog size allows.
   - **Rationale:** Parent risk note; non-empty Discover marquee after `seed:demo`; contrast for later e2e.
   - **Alternatives:** Feature all partners (defeats curation demo); feature none (empty marquee).

7. **Mutations and errors**
   - **Choice:** POST add/remove only on dedicated pages; on success redirect to featured-partners list. Map `CatalogValidationError` (`PARTNER_NOT_FOUND`, `ALREADY_FEATURED`) with existing admin error helpers / flash patterns used by featured events.
   - **Rationale:** AGENTS.md SSR-only mutations; consistency with featured events admin.
   - **Alternatives:** Client modals (forbidden).

8. **Docs this step**
   - **Choice:** No formal sitemap/feature/e2e updates required (step 03). Optional one-line sitemap note only if a reviewer is blocked.
   - **Rationale:** Step brief cleanup; product SoT batching in step 03.

## Risks / Trade-offs

- **[Risk] Wrong active tab on featured-partners routes** → Mitigation: match `featured-partners` before `featured` in `inferAdminTab`; add story/smoke covering both.
- **[Risk] Long EN/DE tab labels wrap in admin chrome** → Mitigation: accept wrap; polish strings in step 03 if layout breaks.
- **[Risk] Admin curates >8; Discover shows 8** → Mitigation: intentional; document in handoff; no hard-reject this step.
- **[Risk] Seed features all partners accidentally** → Mitigation: explicit subset constant + leave at least one non-featured when possible.
- **[Trade-off] openspec/specs are not product SoT** → Deltas under `admin-featured-partners` / `event-discovery`; implementers update `docs/product/` in step 03.

## Migration Plan

1. Tab rename + new tab chrome (`admin-tabs`, `AdminTabNav`, stories, `admin-content`).
2. Add Featured partners components + ADMIN routes (GET/POST).
3. Swap Discover query; update demo seed featured partners subset.
4. `bun run lint`, `bun run typecheck`; manual smoke (Featured events label, add/list/remove partners, Discover curated/empty).
5. Rollback = revert apps/web + seed changes; `featured_partners` table from step 01 can remain (empty curated list hides Partner venues).

## Open Questions

- None blocking. Display cap vs hard max-8 on add remains: Discover `limit: 8`; admin list shows all (parent default). Revisit only if product explicitly wants hard-reject in step 03.
