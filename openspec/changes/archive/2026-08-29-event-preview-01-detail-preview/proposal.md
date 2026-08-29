## Why

Admins can publish and unpublish catalog events, but they cannot see a draft (or a published event) as it will appear on public `/:locale/events/:id` without making it live. Publishing without a same-layout preview risks copy, image, and checkout-chrome mistakes that guests then see.

## What Changes

- Add ADMIN-only GET `/:locale/admin/events/:id/preview` that renders the existing `EventDetailPage` (no forked layout) for drafts and published events via `getEventById`.
- Optional `?audience=guest|member` (default guest). Guest chrome is the public checkout card. `audience=member` shows booking-eligible date/credit chrome. Booking, waitlist, and save mutations MUST NOT run.
- Admin preview banner (Draft vs Published) with links to edit and to publish/unpublish confirm. Surface switcher shows Detail only this step — omit Browse/Discover links until `event-preview-02-card-previews`.
- Preview action on `AdminEventsTable` and the event edit header. New `AdminTableActionIcon` `preview` + icon asset.
- DE/EN admin copy for banner, audience, and preview-only CTA. Page is `noindex`. Title from admin copy, not public SEO title. FormDraft-exempt (not a mutation form).
- Out of scope: browse/discover card frames; Playwright / canonical Gherkin (step 03); publishing; partner preview; public draft share links.

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `admin-events`: Admins can open an unpublished or published event at `/:locale/admin/events/:id/preview` and see the same `EventDetailPage` layout as public detail. The page is ADMIN-only, `noindex`, and does not create bookings, waitlist entries, or saves. Default chrome is guest; `?audience=member` is read-only eligible chrome.

## Impact

- **Routes:** `apps/web/app/routes/[locale]/admin/events/[id]/preview.tsx` — `guardAdminRoute`; `getEventById` + gallery + partner attribution matching public `events/[id].tsx`; missing id → admin 404; guest → login; USER → locale home.
- **UI:** new `AdminEventPreviewChrome` (HeroUI `Surface` / `Paragraph` / `Link` / `Chip`); `EventDetailPage` gains a `preview` flag (or equivalent inert-checkout prop) — do not fork the page. `AdminEventsTable` + `EventAdminWizardPage` edit header get Preview entry points. `AdminTableActions` + `apps/web/public/icons/admin-preview.svg`.
- **Copy:** `apps/web/app/lib/admin-content.ts` keys for banner, Draft/Published (reuse `statusDraft` / `statusPublished` where they already exist), audience links, preview-only CTA. Canonical i18n inventory paragraph can wait for step 03.
- **SEO:** `robots: "noindex"`; do not call `eventDetailPageMeta` / `buildEventJsonLd` for preview.
- **Docs this step:** optional sitemap row for the preview path. Canonical Gherkin / Playwright wait for `event-preview-03-hardening`.
- **Source brief:** `.dev-plan/current-iteration/event-preview-01-detail-preview.md`
- **Parent:** `.dev-plan/current-iteration/event-preview-parent-guide.md`
- **Depends on:** none inside this parent; prefers shipped `catalog-publish-01-schema-and-domain` (`events.published` for the Draft/Published banner — already on `Event`). Soft: preview still works if every event is treated as published.
- **Consumed by:** `event-preview-02-card-previews`
- **Verification:** `bun run lint`; `bun run typecheck`; ADMIN GET `/en/admin/events/:id/preview` 200 for a draft; guest → login; public `/en/events/:id` for that draft remains 404
