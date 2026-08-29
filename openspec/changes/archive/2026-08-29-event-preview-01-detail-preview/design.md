## Context

Parent feature: event preview (`.dev-plan/current-iteration/event-preview-parent-guide.md`). See `proposal.md` for motivation.

`catalog-publish-*` is shipped: `events.published`, `getPublicEventById` (published only), `getEventById` (includes drafts), and publish/unpublish confirms. Public detail is `apps/web/app/routes/[locale]/events/[id].tsx` → `getPublicEventById` → `EventDetailPage` + `eventDetailPageMeta` + JSON-LD. Drafts 404 on that route.

`EventDetailPage` owns checkout via `resolveCheckoutActions` and always mounts `EventDetailCheckoutCard`. Guest chrome is login/signup `Link`s (`type: "login"` / secondary signup). Eligible chrome is `type: "book"` whose `bookPath` is `/events/:id/book` or waitlist — those are GET links that start mutation flows, not POSTs on the detail page itself. There is no `preview` prop today.

Admin catalog: `AdminEventsTable` actions are edit, bookings, gallery, clone, delete, codes. Edit header (`EventAdminWizardPage`) has publish/unpublish + gallery + clone. `AdminTableActionIcon` has no `preview`. Confirm 404 pattern: `admin/events/[id]/delete.tsx` (`guardAdminRoute`, `getEventById`, `NotFoundPage`, `robots: "noindex"`).

Constraints: HeroUI only; Tailwind layout only; no client mutation modal; FormDraft-exempt (GET-only); `guardAdminRoute`; do not fork `EventDetailPage`; omit Browse/Discover chrome links until step 02.

## Goals / Non-Goals

**Goals:**

- One ADMIN GET route that renders the same `EventDetailPage` for drafts and published events.
- Inert checkout: no book / waitlist / login / save hrefs that start a mutation or auth flow.
- Guest default + optional member date/credit chrome via `?audience=`.
- Banner with Draft/Published, edit, and publish/unpublish links.
- Preview entry on the Events table and edit header.
- `noindex`; admin document title; lint/typecheck green.

**Non-Goals:**

- Browse/Discover card frames or chrome links to those routes (step 02).
- Playwright / canonical Gherkin / i18n inventory paragraph (step 03).
- Wrapping preview in `AdminPageShell` (would change the public detail layout).
- JSON-LD or `eventDetailPageMeta` on preview.
- Partner-tile preview; public draft share links; editing fields on preview.
- Using the signed-in admin’s real credits, subscription, or booked slots as the member audience.

## Decisions

1. **`preview` prop on `EventDetailPage`, not a second page**
   - **Choice:** Add optional `preview?: { primaryHref: string; primaryLabel: string }`. When set, skip `resolveCheckoutActions` for the CTA pair: `primaryAction` is `{ type: "link", href: primaryHref, label: primaryLabel }`, `secondaryAction` is `null`. Keep guest vs eligible *chrome* from `viewer` (`showTicketControls`, `showCreditTotal`, `occurrences`, notices/status for past/sold-out). Do not pass `bookedOccurrenceIsos` from the preview route (avoids “already booked → My tickets”). `closeHref` is the Events catalog (`adminEventsPath`).
   - **Rationale:** Step plan: reuse `EventDetailPage`; prefer a preview flag over a fork. Checkout card already uses `Link` for every primary type — replacing book/login with a link is enough if the href is not `/book`, `/waitlist`, or `/login`.
   - **Alternatives:** Fork `AdminEventDetailPreviewPage` (will drift). Extract checkout to the route only (larger refactor). Pass `primaryAction` always from every caller (touches public detail).

2. **Preview route is `c.render`, not `renderAdminPage`**
   - **Choice:** `apps/web/app/routes/[locale]/admin/events/[id]/preview.tsx` calls `guardAdminRoute`, then `c.render(chrome + EventDetailPage, { robots: "noindex", title: admin copy })`. Do **not** wrap in `AdminLayout` / `AdminPageShell` — that shell is `max-w-7xl` + tab nav and would nest inside `EventDetailPage`’s own `max-w-7xl` padding. Admin chrome is `AdminEventPreviewChrome` only (full-width banner above the detail). Missing id / missing row → same `NotFoundPage` + `noindex` as delete. No `FormDraftPersistence`. No `<script type="application/ld+json">`.
   - **Rationale:** Parent: same layout as public detail. Tab nav is still one click away via the banner’s edit/list links and the site header.
   - **Alternatives:** `renderAdminPage` (wrong visual). Break out of `AdminLayout` with negative margins (fragile).

3. **Load drafts with `getEventById`; audience is synthetic**
   - **Choice:** `getEventById` (not `getPublicEventById`). Gallery + partner attribution + hero credit copy the public route (`listEventGalleryImages`, `toPublicEventGalleryImages`, `getPartnerById`, `getImageCredit`, `buildVariantUrl`). `?audience=member` (case-sensitive; anything else, including omitted → guest). Guest: `viewer: { kind: "guest" }`, no `occurrences`. Member: `viewer: { kind: "eligible" }`, `futureOccurrences` + `maxBookableTickets` with a **synthetic** credit budget of `99` (not the admin user’s `users.credits`). Do not call `listActiveBookedOccurrenceInstants` or `getSessionIfConfigured` for viewer kind.
   - **Rationale:** Preview is “how a guest / a booking-eligible member will see this event,” not “how this admin’s membership looks.” Synthetic credits keep sold-out vs bookable chrome honest to capacity, not to the admin wallet.
   - **Alternatives:** Reuse the admin session as eligible (wrong credits/booked overlay). Hit public `getPublicEventById` (drafts 404).

4. **`AdminEventPreviewChrome` — Detail only this step**
   - **Choice:** New presentational component `apps/web/app/components/admin/AdminEventPreviewChrome.tsx` (HeroUI `Surface` / `Paragraph` / `Link` / `Chip`). Contents: “Preview” / “Vorschau” label; Draft vs Published chip (`statusDraft` / `statusPublished`); `Link` to edit (`/:locale/admin/events/:id/edit`); `Link` to `adminEventPublishPath` or `adminEventUnpublishPath` from `event.published`; audience pair `?audience=guest` / `?audience=member` (active audience is not a dead-end — current query may use `aria-current="page"`). Surface switcher: **Detail only**. Do **not** render Browse/Discover links (those routes 404 until step 02). Optional Ladle story; do not block on it.
   - **Rationale:** Step plan: prefer omitting the two links so this increment stays mergeable. Step 02 extends the same component.
   - **Alternatives:** Ship 404 links now (unmergeable). Client audience widget (forbidden; parent says SSR links).

5. **Path helper + table/edit entry**
   - **Choice:** `adminEventPreviewPath(locale, eventId, audience?: "guest" | "member")` on `admin-tabs.ts` (`/:locale/admin/events/:id/preview` or `...?audience=member`). `inferAdminTab` unchanged (`/admin/events` still Events) even though this route does not mount `AdminLayout`. Table: insert Preview **after edit** in `AdminEventsTable` `AdminTableActions`. New icon `"preview"` + `apps/web/public/icons/admin-preview.svg` (24 viewBox, square caps, `stroke-width="2"`, eye / view-box mark matching existing admin icons). Edit header: text `Link` (`className="link"`) to preview next to the publish/unpublish link on `EventAdminWizardPage` (edit only).
   - **Rationale:** Same helper pattern as gallery/publish. After-edit placement matches “see it before other ops.”
   - **Alternatives:** Text-only table column (inconsistent). Preview as primary button on edit (competes with Save).

6. **Inert CTA target**
   - **Choice:** Preview primary `Link` href is `adminEventPreviewPath` (same page, current audience) with label `previewOnlyCta` (“Preview only” / “Nur Vorschau”). Not `#` (avoids jump-to-top). Not edit (edit is already in the banner). Guest login/signup and eligible book/waitlist MUST NOT appear.
   - **Rationale:** Step plan allows edit or `#`; same-page href is inert and accessible. Banner already owns edit/publish.
   - **Alternatives:** `#` (scroll jump). `href` to edit (duplicates banner; looks like the live CTA).

7. **Copy keys (verbatim DE/EN)**
   - **Choice:** Add to `AdminCopy` + both locale objects. Reuse `statusDraft`, `statusPublished`, `publishAction`, `unpublishAction`, `editAction`.

     | Key | DE | EN |
     |---|---|---|
     | `previewAction` | Vorschau | Preview |
     | `previewPageTitle` | Vorschau | Preview |
     | `previewBanner` | Vorschau | Preview |
     | `previewAudienceGuest` | Gast | Guest |
     | `previewAudienceMember` | Mitglied | Member |
     | `previewSurfaceDetail` | Detail | Detail |
     | `previewOnlyCta` | Nur Vorschau | Preview only |
     | `previewDocumentTitle` | `(title) =>` `Vorschau: ${title}` | `(title) =>` `Preview: ${title}` |

   - Document title is `previewDocumentTitle(resolveEventCopy(event, locale).title)`, not `eventDetailPageMeta`. Step 03 adds i18n inventory rows.
   - **Rationale:** Hard rule 5 — lock strings here.
   - **Alternatives:** Approximate wording (rejected). Reuse public SEO title (indexable-looking; wrong).

8. **Sitemap row this step; Gherkin waits**
   - **Choice:** Add one ADMIN row for `/admin/events/:id/preview?audience=` next to publish/unpublish. Do not rewrite `admin-events.feature` or Playwright titles.
   - **Rationale:** Path exists after merge; step 03 owns scenarios. Same split as catalog-publish-02.
   - **Alternatives:** Defer sitemap entirely (step 03 invents the path).

## Risks / Trade-offs

- **[Risk] Public checkout `Link`s still point at `/book` if `preview` is forgotten** → Mitigation: route always passes `preview`; add a short unit/story note on `EventDetailPage` that `preview` replaces book/login; verification includes “no book/waitlist form POST.”
- **[Risk] Member audience uses admin wallet/bookings** → Mitigation: synthetic `eligible` + 99 credits; no `listActiveBookedOccurrenceInstants`.
- **[Risk] `AdminLayout` omitted, admins feel “lost”** → Mitigation: banner links to edit, publish/unpublish, and close on detail goes to the Events catalog.
- **[Risk] Browse/Discover omitted looks unfinished** → Mitigation: accepted; step 02 adds the two links. Do not ship 404s.
- **[Trade-off] Guest notice copy still says “log in or register”** while CTA is Preview only → Accepted for layout fidelity; do not rewrite public guest strings in this step.
- **[Trade-off] Sitemap before Gherkin** → Accepted; step 03 owns scenarios.
- **[Trade-off] No Playwright this step** → Manual ADMIN/USER/guest check in verification.

## Migration Plan

1. `preview` prop + inert checkout on `EventDetailPage` (public route unchanged — omit the prop).
2. Copy, `adminEventPreviewPath`, preview icon, `AdminTableActionIcon`.
3. `AdminEventPreviewChrome` + preview route (gallery/partner load, audience query).
4. Wire table + edit header.
5. Sitemap row; `bun run lint` / `typecheck`; mark step done in the parent guide.
6. Rollback: revert the web PR. No schema change. Public detail and publish flags are untouched.

## Open Questions

- None blocking. Step 02 extends `AdminEventPreviewChrome` with Browse/Discover links and adds those routes.
