## Context

Parent feature: one ticket per occurrence (`.dev-plan/current-iteration/one-ticket-limit-parent-guide.md`), step 02 — already-booked messaging on event detail and the book page. See `proposal.md` for motivation. Step 01 is archived/shipped: `ALREADY_BOOKED`, `listActiveBookedOccurrenceInstants`, qty steppers gone, datetime `<select>` remains for ≥2 future slots.

Current state:

- Event detail GET (`apps/web/app/routes/[locale]/events/[id].tsx`) builds `viewer` and, for `eligible` only, `occurrences` + `maxQty`. It does not load the member’s bookings. `EventDetailPage` → `resolveCheckoutActions` is SSR-only (past → sold-out/waitlist → book / guest / past-due / membership). Priority does **not** yet include already-booked.
- `EventDetailCheckoutCard` (island) already switches the selected hour client-side (`useState` + native `<select>`) and rewrites the book CTA `href` with `dateTime`. First paint uses `defaultDateTimeIso` / first occurrence.
- Book GET/POST (`book.tsx`) renders `BookEventPage` `view="form" | "past_due"`. POST maps known `BookingError` codes; `ALREADY_BOOKED` falls through to `copy.errorGeneric` and still shows the confirm form.
- `BookSlotFields` updates a hidden `date_time` POST field; it does not navigate.
- Copy: `apps/web/app/lib/booking-content.ts` has no already-booked strings. Navbar already uses `Meine Tickets` / `My Tickets` via `copy.ts` `myBookings`. My Tickets URL is `localizedPath(locale, "bookings")`.
- Helper: `listActiveBookedOccurrenceInstants(db, userId, eventId): Promise<Date[]>` exported from `@unveiled/db` (CONFIRMED + USED only).

Constraints: HeroUI-only markup (native `<select>` / form fields allowed). Tailwind layout only. Yellow page background via theme. Locale prefix on My Tickets. SSR mutations unchanged (no modal). No `FormDraftPersistence`. Do not edit canonical Gherkin (`docs/product/`) this step. Proximity-friendly accessible names: visible My Tickets text = label.

## Goals / Non-Goals

**Goals:**

- Eligible members who reopen a held hour see the locked copy and a working My Tickets link on detail and book, with no confirm/book/waitlist CTA for that hour.
- Unbooked hours on the same event stay selectable and bookable (detail: client-side select; book: GET `?dateTime=`).
- POST `ALREADY_BOOKED` renders that same view, not `errorGeneric`.
- Shared verbatim DE/EN copy; Ladle stories for booked vs bookable hour.

**Non-Goals:**

- Schema, uniqueness, or `bookEvent` changes (step 01).
- Canonical Gherkin, Playwright, i18n inventory, coverage matrix (step 03).
- Changing My Tickets list or waitlist confirmation pages.
- Querying bookings for guests / past-due / membership-required.
- New theme tokens (reuse existing checkout status/notice classes).
- Deleting unused `TicketCountSelect.tsx` (step 03).

## Decisions

1. **Load booked instants only for booking-eligible members; pass ISO strings into the island**
   - **Choice:** On event detail GET, after `viewer.kind === "eligible"`, call `listActiveBookedOccurrenceInstants(db, session.user.id, event.id)` and serialize with `.toISOString()`. Pass `bookedOccurrenceIsos: string[]` into `EventDetailPage` → `EventDetailCheckoutCard`. Guests / past-due / membership-required: omit the query and pass `[]` / undefined. Past events: still skip overlay (see 2); querying is harmless but unnecessary — skip when `isPast` to avoid extra work.
   - **Rationale:** Parent lock: already-booked is eligible-member chrome only. ISO strings match `CheckoutOccurrence.startsAtIso` (same `events.date_times` instants step 01 stores on `bookings.date_time`).
   - **Alternatives:** Query for every signed-in user (leaks booked-state into gated chrome). Pass `Date[]` into a client island (not serializable across the island boundary as cleanly as strings).

2. **Already-booked is an overlay in `EventDetailCheckoutCard`, not a new `resolveCheckoutActions` branch for sold-out/book**
   - **Choice:** Keep SSR `resolveCheckoutActions` as the **unbooked** baseline (past / waitlist / book / guest / past-due / membership). The island overlays when `bookedOccurrenceIsos` contains the selected `startsAtIso` **and** the event is not past:
     - Hide book and waitlist primary CTAs (`type: "book"`).
     - Hide `noticeText` that implies a new purchase (eligible notice).
     - Hide credit total (not checking out).
     - Keep datetime `<select>` when `occurrences.length >= 2` (`showTicketControls` stays true from eligible non-past SSR, including sold-out waitlist).
     - Show `statusMessage` = locked already-booked sentence.
     - Show My Tickets as the primary `Link` (`button button--primary`, `href` = `localizedPath(locale, "bookings")`, visible text = `Meine Tickets` / `My Tickets`).
     - Switching the select to an unbooked ISO restores the SSR baseline (book or waitlist) and credit total without a full navigation.
   - Past still wins: if SSR returned past chrome (`showTicketControls: false`), do not overlay.
   - **Rationale:** The island already owns selected-hour state. If only SSR computed already-booked for `defaultDateTimeIso`, switching hours would keep My Tickets (or keep Book) incorrectly. Overlay + baseline actions gives both first paint (island SSR-renders with initial `selectedIso`) and client restore. Sold-out + booked hour: overlay beats waitlist (parent priority: past → already booked → sold out / waitlist → book).
   - **Alternatives:** Full navigation on every datetime change (`?dateTime=` only) — works but worse than the existing island. Duplicate the entire checkout priority matrix in both SSR and the island.

3. **Shared copy helper in `booking-content.ts`; My Tickets href via `localizedPath`**
   - **Choice:** Add to `BookPageCopy` (or a small exported helper used by detail + book):

     - DE message: `Du hast das bereits gebucht. Du kannst es unter Meine Tickets nachschauen.`
     - EN message: `You've already booked this. You can check it in My Tickets.`
     - Link label: `Meine Tickets` / `My Tickets` (same strings as `copy.ts` `myBookings` — keep them in `booking-content` so detail does not import shell copy; do not drift).

     Export `getAlreadyBookedCopy(locale)` and use `localizedPath(locale, "bookings")` at the call site (or a one-liner helper next to it). Event-detail copy modules MUST import this helper rather than duplicate strings. Add a bun unit test on the helper (verbatim DE/EN + label) under `apps/web/app/lib/` (mirror `event-detail-gallery-copy.test.ts`).
   - **Rationale:** Step plan: one helper, parent-locked verbatim copy, accessible name = visible text.
   - **Alternatives:** Reuse only `getShellCopy().myBookings` for the label (fine for the label, still need the sentence somewhere). Hard-code in two page components (drift).

4. **Book page: new `view: "already_booked"` instead of the confirm form**
   - **Choice:** Extend `BookPageView` with `"already_booked"`. GET: after resolving the selected slot (`?dateTime=` or first future occurrence), if that ISO is in the member’s active booked instants, render this view — message + My Tickets `Link` + back-to-event. **No** `Form`, **no** submit. POST: if `error.code === "ALREADY_BOOKED"`, render the same view (not `errorMessage={copy.errorGeneric}` on `view="form"`).
   - When `occurrences.length >= 2`, still show the datetime `<select>` on this view. Changing it **GETs** `/:locale/events/:id/book?dateTime=<iso>` (native select + small client `onChange` assign, or HeroUI `Form` `method="get"` submitted on change). If the new slot is unbooked, GET renders `view="form"` again. Do **not** reuse `BookSlotFields` POST hidden-field sync on this view (that would keep a POST affordance).
   - **Rationale:** Step plan: no POST when the resolved slot is held; other hours remain bookable. GET keeps book-page hour switching SSR (the book island is POST-oriented today).
   - **Alternatives:** Bounce to event detail only (spec-ok, clumsier). Keep the form with a disabled submit (still a confirm affordance). Client-only slot swap on the book form without navigation (could POST the booked hour).

5. **Instant matching helper next to checkout-slot**
   - **Choice:** Add `occurrenceIsBooked(startsAtIso: string, bookedOccurrenceIsos: string[]): boolean` (exact ISO string match) in `checkout-slot.ts`, tested in `checkout-slot.test.ts`. Use it in the island and when choosing book `view`.
   - **Rationale:** One comparison rule; avoids `Date` vs string mistakes. Instants already canonical from `date_times` / `bookEvent` slot resolve.
   - **Alternatives:** Compare `getTime()` after `new Date` (also fine; more conversion). Fuzzy match (unnecessary).

6. **HeroUI chrome; no new tokens; FormDraft does not apply**
   - **Choice:** Message = `Paragraph` (existing checkout status or book-page body). My Tickets = `Link` with `button button--primary button--md` (only CTA in this state). Book page already-booked layout reuses `Surface` / `PageSectionHeader` / `Paragraph` like `past_due`. Native datetime `<select>` + `Label`. Do not add theme tokens unless an existing status/notice class already covers it (`event-detail--checkout__status` is enough). No `FormDraftPersistence`.
   - **Rationale:** Hard rules §8–9, §15 exemption list (search/delete/confirm-style; this is not an add/edit draft form).
   - **Alternatives:** Secondary button style (step allows primary **or** secondary; primary matches book/waitlist as the single action). Raw `<p>`/`<a>` (forbidden).

7. **Ladle: booked hour vs unbooked hour on a multi-slot event**
   - **Choice:** `EventDetailPage.stories.tsx`: eligible + `bookedOccurrenceIsos` containing the first (morning) ISO; second evening slot unbooked — story name includes already-booked. Optional `defaultDateTimeIso` morning. Existing `Eligible` story stays unbooked. `BookEventPage.stories.tsx`: `view="already_booked"` plus existing Form / Past due. If checkout is only reachable via `EventDetailPage`, do not invent a separate file unless the card is exported and stories already target it (today they do not).
   - **Rationale:** Step verification: selected booked hour shows the sentence and a link named `Meine Tickets` / `My Tickets`. `storyLocale` is EN in fixtures — assert EN copy in the already-booked story; add a DE story or locale switch only if fixtures already support it without new i18n infra.
   - **Alternatives:** Only a BookEventPage story (misses detail overlay + hour switch).

## Risks / Trade-offs

- **[Risk] ISO string mismatch (ms / Z vs offset) hides already-booked or false-positives** → Mitigation: serialize booked `Date`s with `.toISOString()`; occurrences already use that; exact match helper + unit test.
- **[Risk] First paint flash of Book then My Tickets** → Mitigation: island SSR-renders with initial `selectedIso`; booked overlay runs on that first render. Do not wait for `useEffect`.
- **[Risk] Overlay hides waitlist globally instead of per selected hour** → Mitigation: overlay is per `selectedIso`; unbooked hour on a sold-out event restores waitlist from SSR baseline.
- **[Risk] Book GET hour picker still posts** → Mitigation: already-booked view has no POST `Form`; datetime change is GET only.
- **[Trade-off] Book page uses GET navigation for hour switch; detail uses client state** → Acceptable: book was never a slot-state island for CTAs; detail already is.
- **[Trade-off] Credit total hidden while already booked** → Parent only requires message + My Tickets; hiding purchase chrome avoids implying another charge. Restored when the select moves to an unbooked hour.
- **[Trade-off] Canonical Gherkin still describes multi-qty / no already-booked** → Step 03; do not edit `docs/product/features/` here.

## Migration Plan

1. Add copy helper + `occurrenceIsBooked`; unit-test copy and ISO match.
2. Event detail GET: query booked instants for eligible (non-past) members; thread props to the checkout island; implement overlay.
3. Book GET/POST: already-booked view; map `ALREADY_BOOKED`; GET datetime switch.
4. Update Ladle stories (detail + book).
5. `bun run lint`, `bun run typecheck`, `cd apps/web && bun test app/lib/checkout-slot.test.ts app/lib/booking-content.ts` (or the new copy test file).
6. Rollback: revert UI/copy/route wiring; domain uniqueness from step 01 stays.

## Open Questions

- None blocking. Admin uniqueness override remains **no** (parent). Playwright / Gherkin / `TicketCountSelect` deletion wait for step 03.
