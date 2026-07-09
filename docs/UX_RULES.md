# UX Rules

Interaction and behavior rules for Unveiled Berlin UI. Behavioral truth: `docs/migration/features/*.feature`.

---

## Core interaction principles

### 1. SSR-first

All meaningful content renders in the initial HTML response. Crawlers and no-JS users must see page content (except progressive enhancement for maps/accordion expand).

### 2. No client-only mutations

Create, update, delete **never** happen via:

- Client-side modals with `fetch`
- Optimistic UI without server round-trip
- Inline edit toggles

Always: dedicated page → form POST → redirect.

### 3. Links over buttons for navigation

Use HeroUI `Link` with button classes for navigation CTAs. Reserve `Button` for form submits and non-nav actions.

### 4. Locale in URL

Language is not a client toggle — it's a route change:

- DE/EN links use `switchLocalePath(pathname, target)`
- Never store locale only in React state or localStorage for routing

---

## Navigation UX

| Rule | Implementation |
|---|---|
| Active nav item | `aria-current="page"` via `NavLink` |
| Home has no active nav pill | Logo links home; Membership is a nav item, not a header CTA |
| Footer links on every page | `GuestFooter` in `AppShell` |
| Back actions | Secondary button link to logical parent (`localizedPath(locale, "")` for FAQ guests) |
| 404 | `NotFoundPage` with home CTA |

**Future:** signed-in FAQ back button → `/events` (Phase 2+).

---

## Accordion (FAQ)

From `static-pages.feature`:

- Exactly one item open at a time
- First item open by default
- Support email visible as mailto link
- Client island for expand/collapse only

Do not use accordion for unrelated content (legal sections use static headings, not accordion).

---

## Forms (future phases)

### Labels & validation

- Every input has a visible `<label>` — not placeholder-only
- Errors linked via `aria-describedby`
- Server-side validation on POST — re-render form with errors in SSR HTML

### Auth UI

Use `@better-auth-ui/heroui` only — **not** shadcn. Proxied at `/api/auth/*`.

- SSR route renders `AuthPageLayout` + client island; library handles form interactivity and footer links
- White form card (`variant="default"`, `.auth-form`) — never inverted `secondary` on auth pages
- Page titles localized in `auth-content.ts`; form labels via `auth-localization.ts` on `/de/*`
- Auth pages use `robots: "noindex"` in route render options

### Payment

Real Stripe Billing (Phase 6+) — no mocked checkout. Membership page Phase 1 uses disabled button.

### Image upload

Dual path: file upload or paste URL → `@unveiled/images` pipeline. See `docs/migration/extras/image-uploads.md`.

---

## Event card CTA states (Phase 4+)

From `ui-component-map.md` — **check guest state before sold-out**:

| Viewer | Event state | CTA |
|---|---|---|
| Guest | any | "See details" / "Mehr sehen" |
| Member | sold out | "Waitlist" |
| Member | subscription inactive | "Unlock event" |
| Member | active, available | "Book Now" |

Guests never see waitlist/unlock/book labels on public discover grid.

---

## Booking flow (Phase 6+)

- `/events/:id/book` — dedicated SSR page, not modal
- Atomic transaction in `@unveiled/db` — membership check inside transaction
- Confirmation page separate from booking form
- Full-bleed yellow treatment on book/confirm (intensified brand moment)

---

## Maps (Phase 5+)

- **MapLibre GL JS** + **OpenStreetMap** tiles as lazy client island — no API key
- Address always shown as plain text beside map
- Cookie consent required before loading map tile requests
- Declined consent → static placeholder + external maps link (e.g. OpenStreetMap)
- Required OSM attribution visible when map is shown

---

## Cookie consent (Phase 5+)

- Banner on first visit
- Decision persisted — not re-asked until cleared/expired
- Sentry = strictly necessary (not gated)
- Maps = non-essential (gated) — MapLibre island loading OSM tiles

---

## Accessibility

Minimum bar (see `design-tokens.md` § Accessibility):

| Requirement | Rule |
|---|---|
| Contrast | Dark text on yellow/white/grey only |
| Focus | Keep HeroUI focus rings |
| Icon buttons | `aria-label` required |
| Language | `<html lang="de|en">` per route |
| Motion | Respect `prefers-reduced-motion` |
| Accordion | Keyboard operable via HeroUI/React Aria |

---

## Loading & errors

| State | Pattern |
|---|---|
| Island not mounted | Static SSR fallback (not spinner) |
| Form submitting | Full page POST — browser native loading |
| Empty list | HeroUI `Card` + CTA (future) |
| API/DB error | SSR error page or inline `Alert` on re-render |
| Payment frozen | Blocking `Alert` on membership/billing (Phase 7) |

Avoid skeleton screens unless spec requires — SSR should ship content in first paint.

---

## Credits & membership copy

- Credits **do not roll over** — never show rollover marketing
- Perks: "17 Credits jeden Monat" / "17 fresh credits every month"
- Support email: `support@unveiled.berlin` everywhere

---

## Partner scoping (Phase 8+)

Partner UI never trusts client `partnerId`. All queries filtered by session `partnerId` from `@unveiled/auth`.

---

## Timezone

Europe/Berlin for all date/time display and business logic.

---

## What not to build (v1)

- Dark mode toggle
- Multi-city selector
- Algorithmic feed ranking
- Real-time chat
- À la carte credit purchases
- Client-side mutation modals

See `AGENTS.md` § v1 non-goals.

---

## Related docs

- [`PATTERNS.md`](PATTERNS.md) — implementation patterns
- [`examples/`](examples/) — page blueprints
- `docs/migration/features/*.feature` — Gherkin scenarios
