## Context

Parent feature: event preview (`.dev-plan/current-iteration/event-preview-parent-guide.md`). See `proposal.md` for motivation.

Step 01 (archived 2026-08-29) shipped `/:locale/admin/events/:id/preview` (`apps/web/app/routes/[locale]/admin/events/[id]/preview.tsx`), `AdminEventPreviewChrome` (banner + Draft/Published + edit/publish + audience links; Detail label only), `adminEventPreviewPath`, table/edit Preview entry, and inert `EventDetailPage` `preview` prop.

Live card surfaces:

- Browse: `EventFeedPage` maps `toEventCardItem` into `EventCard` inside `Surface` `grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3`, viewer `{ kind: "member", subscriptionActive, saved }`, `bookmarkFormAction` + `ctaHref` → `/:locale/events/:id`. Filter/map live in `EventDiscoveryShell`.
- Discover: `DiscoverPage` uses `PageSectionHeader` with `content.livePreview.eyebrow` / `headline` from `getPageContent(locale, "discover")`, the same grid, guest `EventCard` (default viewer), `ctaHref` → public detail. Partner marquee is a separate section.

`EventCard` (`@unveiled/ui`): omit `bookmarkFormAction` → no save POST. Guest viewer hides bookmark and datetime/credits. Member + `subscriptionActive: true` shows next datetime and credit price. `ctaHref` is the image, title, and footer CTA.

HonoX today has a file `preview.tsx` and no `preview/` directory. Nested `preview/browse` / `preview/discover` need a `preview/` folder; sibling `preview.tsx` plus `preview/` is a conflict (edit/gallery already use `index.tsx` under the folder).

Constraints: HeroUI only; Tailwind layout only; no client mutation modal; FormDraft-exempt (GET-only); `guardAdminRoute`; reuse `EventCard` (do not fork); do not embed the live filter shell or partner marquee; yellow page background from the app shell.

## Goals / Non-Goals

**Goals:**

- Two ADMIN GET routes that mount the same `EventCard` + grid classes as Browse and Discover, with one event only.
- Inert card: no bookmark form; CTA → detail preview (works for drafts).
- Chrome surface switcher among Detail / Browse events / Discover.
- Discover header copy from live Discover `livePreview` tokens. Works if the event is not featured.
- `noindex`; lint/typecheck green; sitemap rows.

**Non-Goals:**

- Playwright / canonical Gherkin / i18n inventory paragraph (step 03).
- Map popup preview; partner-tile preview.
- Changing `listFeaturedEvents`, Discover, or Browse queries.
- Wrapping card frames in `AdminPageShell` / `EventDiscoveryShell` / full `DiscoverPage`.
- Audience query on card routes (browse is always member chrome; discover is always guest).
- Changing `EventCard` in `@unveiled/ui` unless a bug blocks inert preview.

## Decisions

1. **Relocate detail preview to `preview/index.tsx`**
   - **Choice:** Move `apps/web/app/routes/[locale]/admin/events/[id]/preview.tsx` → `preview/index.tsx` (same URL). Add `preview/browse.tsx` and `preview/discover.tsx`. Do not change detail behavior except passing a `surface` prop into chrome.
   - **Rationale:** Matches `edit/index.tsx`, `gallery/index.tsx`, `bookings/index.tsx`. Avoids a HonoX file-vs-folder clash.
   - **Alternatives:** Keep `preview.tsx` and use `preview-browse.tsx` (wrong URLs). Duplicate detail handler (drift).

2. **Shared load helper, not a forked card**
   - **Choice:** Extract `loadAdminEventPreview(c)` (or equivalent) used by all three preview routes: `guardAdminRoute`, parse `id`, `getEventById`, admin 404 + `noindex`. Card routes then `toEventCardItem(event, locale)` and render. Do **not** call `listFeaturedEvents`, `listEvents`, or partner lists.
   - **Rationale:** Step plan: one event; works for drafts and non-featured. Duplicating the 404/guard block three times will drift.
   - **Alternatives:** Copy-paste the detail route loader (accepted only if the helper is larger than the call sites). Hit `getPublicEventById` (drafts 404).

3. **`AdminEventPreviewChrome` gains `surface`**
   - **Choice:** Add `surface: "detail" | "browse" | "discover"`. Replace the static Detail `Paragraph` with three `Link`s: Detail → `adminEventPreviewPath`, Browse events → `adminEventPreviewBrowsePath`, Discover → `adminEventPreviewDiscoverPath`. Active surface gets `aria-current="page"`. Audience guest/member links render **only** when `surface === "detail"` (card viewers are fixed). Banner, Draft/Published, edit, and publish/unpublish stay on every surface.
   - **Rationale:** Parent: SSR switcher, not a client widget. Step 01 omitted the two links so the increment was mergeable; this step adds them.
   - **Alternatives:** Keep audience on card pages (contradicts fixed member/guest viewers). Client tab island (forbidden).

4. **Path helpers + tests**
   - **Choice:** `adminEventPreviewBrowsePath(locale, eventId)` → `/:locale/admin/events/:id/preview/browse`. `adminEventPreviewDiscoverPath` → `.../preview/discover`. Extend `admin-route.test.ts` next to the existing `adminEventPreviewPath` test. `inferAdminTab` unchanged (`/admin/events` still Events).
   - **Rationale:** Same helper pattern as gallery/publish.
   - **Alternatives:** Inline `localizedPath` in chrome (easy to drift).

5. **Browse frame: member card, no shell**
   - **Choice:** `c.render` chrome + a `max-w-7xl` padded column (same horizontal padding as `EventFeedPage` / `DiscoverPage`: `mx-auto max-w-7xl px-4 … sm:px-6 lg:px-8`) containing:
     1. Optional muted one-line `Paragraph` (`previewBrowseNote`).
     2. `Surface` `className="grid items-stretch gap-6 sm:grid-cols-2 lg:grid-cols-3"` `variant="transparent"` with **one** `EventCard`.
   - Card props: `event={toEventCardItem(event, locale)}`, `locale`, `viewer={{ kind: "member", subscriptionActive: true, saved: false }}`, **omit** `bookmarkFormAction` / `onBookmarkToggle`, `ctaHref={adminEventPreviewPath(locale, event.id)}`.
   - Do **not** mount `EventDiscoveryShell`, filters, map tabs, or pagination. Bookmark button may render disabled (member viewer without a form) — that is acceptable; do not wire save POST.
   - **Rationale:** Step plan names the exact grid and viewer. A disabled bookmark is closer to member Browse than hiding it (guest card). CTA must not 404 drafts on public detail.
   - **Alternatives:** Guest card on browse (wrong chrome — no datetime/credits). Full `EventFeedPage` with one item (pulls in filters). `ctaHref` to public detail (drafts 404).

6. **Discover frame: guest card + live header copy**
   - **Choice:** Same grid + padding. Above the grid, `PageSectionHeader` with `eyebrow={content.livePreview.eyebrow}` and `headline={content.livePreview.headline}` from `getPageContent(locale, "discover")`. Guest `EventCard` (omit `viewer` or `{ kind: "guest" }`). Same `ctaHref` to detail preview. Do not render the partner marquee, Discover hero, or empty-state path (we always have one event). Do not query `listFeaturedEvents`.
   - **Rationale:** Parent: Discover-styled card + section header tokens; featured membership is not required. Reusing `DiscoverPage` would either show the marquee (other catalog data) or force an empty partners array that still changes layout vs a single-card frame.
   - **Alternatives:** Mount `DiscoverPage` with `events={[item]}` `partners={[]}` (implies empty Partner venues). Query featured and inject the event (changes live semantics / extra query).

7. **Optional shared grid helper stays in admin, not `@unveiled/ui`**
   - **Choice:** If both routes share more than ~15 duplicated lines, extract `AdminEventPreviewCardFrame` in `apps/web/app/components/admin/` (chrome is already passed by the route). Do **not** add a new `@unveiled/ui` primitive.
   - **Rationale:** Step plan cleanup: helper in admin unless the card itself changed.
   - **Alternatives:** Duplicate the grid in both routes (fine if tiny). Put the frame in `@unveiled/ui` (wrong package).

8. **Copy keys (verbatim DE/EN)**
   - **Choice:** Add to `AdminCopy` + both locale objects. Reuse `previewBanner`, `previewSurfaceDetail`, `previewDocumentTitle`, `previewAction`, audience keys (detail only).

     | Key | DE | EN |
     |---|---|---|
     | `previewSurfaceBrowse` | Events entdecken | Browse events |
     | `previewSurfaceDiscover` | Entdecken | Discover |
     | `previewBrowseNote` | Filter und Karte sind nicht Teil dieser Vorschau. | Filters and map are not part of this preview. |

   - Document title stays `previewDocumentTitle(resolveEventCopy(event, locale).title)` on all three surfaces. Step 03 adds i18n inventory rows.
   - **Rationale:** Hard rule 5; surface labels match app-shell `browseEvents` / `nav.discover`.
   - **Alternatives:** “Browse” / “Discover” only (weaker scan vs the live nav words).

9. **Sitemap this step; Gherkin waits; Featured Preview optional**
   - **Choice:** Add two ADMIN rows next to the existing `/admin/events/:id/preview?audience=` row. Do not rewrite `admin-events.feature` or Playwright. Optional: Featured events manager row / `AdminFeaturedListPage` gets a Preview `Link` to `adminEventPreviewPath` (detail). Do not block on it; event id is already on the row.
   - **Rationale:** Same split as step 01 / catalog-publish-02. Featured Preview is listed as optional in the step plan.
   - **Alternatives:** Defer sitemap (step 03 invents the paths).

10. **Render path matches detail preview**
    - **Choice:** `c.render(chrome + frame, { robots: "noindex", title: copy.previewDocumentTitle(...) })`. No `renderAdminPage` / `AdminLayout`. No JSON-LD. No `FormDraftPersistence`.
    - **Rationale:** Card frames should sit on the same yellow shell as public Browse/Discover, not inside the admin tab `max-w-7xl` chrome.
    - **Alternatives:** `renderAdminPage` (wrong visual; competes with the feed grid).

## Risks / Trade-offs

- **[Risk] `preview.tsx` + `preview/` folder clash** → Mitigation: move to `preview/index.tsx` first; verify detail URL still 200 before adding card routes.
- **[Risk] Card CTA hits public `/events/:id` and 404s drafts** → Mitigation: `ctaHref` is always `adminEventPreviewPath`; never `resolveEventFeedCtaHref`.
- **[Risk] Bookmark form posts a save from a draft** → Mitigation: omit `bookmarkFormAction`; do not pass `eventSavePath`.
- **[Risk] Discover preview queries featured/partners and looks like live Discover** → Mitigation: no `listFeaturedEvents` / partner query; no marquee.
- **[Risk] Member browse card shows a disabled bookmark** → Accepted; closer to member Browse than guest chrome. Do not invent a new `EventCard` viewer kind this step.
- **[Trade-off] Single card in a 3-column grid looks sparse on desktop** → Accepted; same grid classes as live pages is the point.
- **[Trade-off] Sitemap before Gherkin** → Accepted; step 03 owns scenarios.
- **[Trade-off] No Playwright this step** → Manual ADMIN/USER/guest check in verification.

## Migration Plan

1. Move `preview.tsx` → `preview/index.tsx`; pass `surface="detail"`; confirm detail URL unchanged.
2. Copy keys + browse/discover path helpers + chrome surface links.
3. Browse route, then Discover route (shared loader if extracted).
4. Optional Featured Preview link.
5. Sitemap rows; `bun run lint` / `typecheck`; mark step done in the parent guide.
6. Rollback: revert the web PR. No schema change. Public Discover/Browse queries are untouched.

## Open Questions

- None blocking. Step 03 owns Gherkin, Playwright, i18n inventory, and coverage-matrix rows for the three preview surfaces.
