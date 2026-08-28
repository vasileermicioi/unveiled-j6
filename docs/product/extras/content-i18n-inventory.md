# Content / i18n Inventory (MVP)

Structured DE/EN catalog from the old `translations.ts`, plus pointers to marketing copy in `ui/static-pages-content.md`. **Partner** namespace strings are **post-MVP**. Credits do **not** roll over — correct any checkout perk copy that claims otherwise.

Full, exact DE/EN copy catalog from `translations.ts`, reproduced verbatim as a starting content inventory for the new app. The tone is consistently casual/bold/uppercase-heavy in German and English alike ("YOU'RE IN!", "DU BIST DABEI!") — worth preserving as a brand voice guideline alongside the visual design tokens.

This is a smaller catalog than the full app surface — many pages (Discover home, how-it-works, FAQ answers, onboarding option labels, admin page microcopy) have their copy hardcoded inline in components rather than in `translations.ts`. Treat this file as the **structured i18n catalog** and the Gherkin features / UI component map as pointers to where additional inline copy lives that should also be extracted into whatever i18n system the new app uses.

## Top-level keys

| Key | DE | EN |
|---|---|---|
| `paymentStop` | ZAHLUNGS-STOPP. | PAYMENT STOPPED. |
| `paymentStopDesc` | Deine Credits sind eingefroren. Bitte aktualisiere deine Zahlungsmethode. | Your credits are frozen. Please update your payment method to continue. |
| `gateMessage` | ABO ERFORDERLICH FÜR BUCHUNGEN. | SUBSCRIPTION REQUIRED TO BOOK. |
| `mySaves` | Gemerkt | Saved |
| `myBookings` | Meine Tickets | My Tickets |
| `credits` | Credits | Credits |
| `available` | Verfügbar | Available |
| `saveThis` | Merken | Save |
| `savedThis` | Gemerkt | Saved |
| `bookNow` | Entdecken | Discover |
| `waitlist` | Warteliste | Waitlist |
| `tickets` | Tickets | Tickets |
| `total` | Gesamt | Total |
| `processing` | Wird verarbeitet... | Processing... |
| `joinWaitlist` | Auf die Warteliste | Join Waitlist |
| `confirmBooking` | Jetzt buchen | Confirm Booking |
| `bookingSuccess` | DU BIST DABEI! | YOU'RE IN! |
| `waitlistSuccess` | DU STEHST DRAUF! | YOU'RE ON THE LIST! |
| `onboardingTitle` | DEIN KULTUR-PROFIL. | YOUR CULTURE PROFILE. |
| `onboardingSubtitle` | Wir finden die Events, die wirklich zu dir passen. | Let's find the events that actually vibe with you. |
| `ageLabel` | WIE ALT BIST DU? | HOW OLD ARE YOU? |
| `ageSubtitle` | Keine Sorge, nur für die Statistik (und Altersbeschränkungen). | Don't worry, just for stats (and age restrictions). |
| `interestLabel` | WAS INTERESSIERT DICH? | WHAT INTERESTS YOU? |
| `interestsOtherLabel` | Beschreibe dein Interesse | Describe your interest |
| `interestsOtherPlaceholder` | z. B. Spoken Word | e.g. Spoken word |
| `moodLabel` | WELCHE VIBES SUCHST DU? | WHAT VIBES ARE YOU AFTER? |
| `locationLabel` | DEIN STANDORT | YOUR LOCATION |
| `countryLabel` | Land | Country |
| `countryDisplay` | Deutschland | Germany |
| `cityLabel` | Stadt | City |
| `cityDisplay` | Berlin | Berlin |
| `zipCodeLabel` | PLZ | Zip code |
| `zipCodeHint` | Unveiled ist aktuell in Berlin verfügbar. Eine Berliner PLZ ist optional — du kannst das Feld auch leer lassen. | Unveiled currently serves Berlin. A Berlin zip code is optional — you can leave this blank. |
| ~~`districtLabel`~~ / ~~`districtSubtitle`~~ | _(removed — location is zip under Germany/Berlin)_ | _(removed — location is zip under Germany/Berlin)_ |
| `timingLabel` | WANN HAST DU ZEIT? | WHEN DO YOU HAVE TIME? |
| `daysLabel` | WELCHE TAGE? | WHICH DAYS? |
| `languagePrefLabel` | SPRACHEN? | LANGUAGES? |
| `languageSearchPlaceholder` | Sprachen suchen | Search languages |
| `languageSearchHint` | Nur häufige Sprachen sind angezeigt. Nutze die Suche, um weitere zu finden und auszuwählen. | Only common languages are shown. Use search to find and select others. |
| `accessibilitySectionLabel` | Barrierefreiheit benötigt? | Accessibility needed? |
| `accessibilityOptionLabel` | Ja | Yes |
| `finish` | FERTIG | FINISH |
| `next` | WEITER | NEXT |
| `skip` | ÜBERSPRINGEN | SKIP |
| `eventList` | Events | Events |
| `createEvent` | Event erstellen | Create Event |
| `nav.discover` (shell) | Entdecken | Discover |
| `browseEvents` (shell, booking-eligible) | Events entdecken | Browse events |

## `filters`

| Key | DE | EN |
|---|---|---|
| `title` | FILTERN | FILTERS |
| `from` | VON | FROM |
| `to` | BIS | UNTIL |
| `reset` | ZURÜCKSETZEN | RESET |
| `noResults` | KEINE EVENTS ENTSPRECHEN DIESEN FILTERN. | NO EVENTS MATCH THESE FILTERS. |

## `auth`

| Key | DE | EN |
|---|---|---|
| `loginTitle` | WILLKOMMEN ZURÜCK. | WELCOME BACK. |
| `signupTitle` | WERDE TEIL DES CLUBS. | JOIN THE CLUB. |
| `emailLabel` | EMAIL ADRESSE | EMAIL ADDRESS |
| `passwordLabel` | PASSWORT | PASSWORD |
| `loginBtn` | LOG IN | LOG IN |
| `signupBtn` | KONTO ERSTELLEN | CREATE ACCOUNT |
| `switchLogin` | Hast du schon ein Konto? Log in. | Already have an account? Log in. |
| `switchSignup` | Neu hier? Erstelle ein Konto. | New here? Create an account. |
| `errorFields` | Bitte alle Felder ausfüllen. | Please fill in all fields. |

## `checkout`

| Key | DE | EN |
|---|---|---|
| `title` | DEIN KULTUR-UPGRADE. | YOUR CULTURE UPGRADE. |
| `subtitle` | Voller Zugang. 17 Credits/Monat. Jederzeit kündbar. | Full Access. 17 Credits/mo. Cancel anytime. |
| `button` | ABO STARTEN — 29€ | START SUB — 29€ |
| `secure` | SICHERE ZAHLUNG VIA STRIPE | SECURE PAYMENT VIA STRIPE |
| `perks[0]` | Alle Events inklusive | All events included |
| `perks[1]` | Vorkaufsrecht für Highlights | Early access to highlights |
| `perks[2]` | 17 Credits jeden Monat | 17 fresh credits every month |
| `guarantee` | Keine versteckten Kosten. Monatlich kündbar. | No hidden fees. Cancel monthly. |
| `successTitle` | WILLKOMMEN IM CLUB. | WELCOME TO THE CLUB. |
| `successSubtitle` | Deine Credits sind bereit. Viel Spaß in Berlin! | Your credits are loaded. Enjoy Berlin! |
| `errorTitle` | DA GING WAS SCHIEF. | SOMETHING WENT WRONG. |
| `errorSubtitle` | Zahlung abgebrochen. Probier's nochmal. | Payment cancelled. Give it another shot. |
| `promoCodeLabel` | GUTSCHEIN / RABATTCODE | VOUCHER / PROMO CODE |
| `promoCodePlaceholder` | CODE EINGEBEN | ENTER CODE |
| `alreadyActive` | DU BIST BEREITS MITGLIED! | YOU ARE ALREADY A MEMBER! |
| `activeStatus` | Status: Aktiv | Status: Active |

> ✅ **Resolved:** `secure: "SICHERE ZAHLUNG VIA STRIPE" / "SECURE PAYMENT VIA STRIPE"` referenced Stripe despite no integration existing in the old app. **Decided:** the rewrite implements real Stripe Billing (see `features/credits-subscription.feature`), so this copy is now accurate as-is and can be kept unchanged.
> ✅ **Resolved:** `perks[2]` — app + inventory now use DE: "17 Credits jeden Monat" / EN: "17 fresh credits every month". Credits do **not** roll over (see `features/credits-subscription.feature`); the old "Credits roll over" / "Credits rollen mit" claim must not return.
> ✅ **Resolved (membership card merge):** `subtitle` and `guarantee` are **not** rendered on checkout/guest membership UI (single-card layout). `subtitle` remains in the content module for SEO meta description (`membershipPageMeta`); `guarantee` may remain unused in the module.

## `redemption`

| Key | DE | EN |
|---|---|---|
| `ticketCode` | DEIN TICKET-CODE | YOUR TICKET CODE |
| `secretDesc` | Sag diesen Code einfach an der Abendkasse oder beim Einlass. | Just mention this code at the box office or entry. |

## `admin`

| Key | DE | EN |
|---|---|---|
| `dashboard` | Dashboard | Dashboard |
| `partners` | Partner | Partners |
| `users` | Nutzer | Users |
| `exportCsv` | CSV Export | Export CSV |
| `freezeUser` | Einfrieren | Freeze |
| `unfreezeUser` | Aktivieren | Unfreeze |
| `stats.bookings` | Buchungen | Bookings |
| `stats.burn` | Credits ausgegeben | Credits Burned |
| `stats.activeUsers` | Aktive Abos | Active Subs |

## `partner`

| Key | DE | EN |
|---|---|---|
| `portal` | Partner Portal | Partner Portal |
| `searchGuest` | Gast suchen... | Search guest... |
| `guestList` | Gästeliste | Guest List |
| `noGuests` | Keine Gäste gefunden. | No guests found. |
| `checkIn` | Check-In | Check-In |
| `checkedIn` | Eingeloggt | Checked-In |

## Legal pages (`apps/web/app/lib/content/legal.ts`)

Bilingual Impressum / Privacy / Terms module for `LegalPage`. Footer links: `footer.legal.*` in `apps/web/app/lib/copy.ts`.

| Page key | DE `pageTitle` | EN `pageTitle` | Route |
|---|---|---|---|
| `impressum` | Impressum | Imprint | `/:locale/impressum` |
| `privacy` | Datenschutz | Privacy Policy | `/:locale/privacy` |
| `terms` | AGB | Terms of Service | `/:locale/terms` |

Chrome: eyebrow `Rechtliches` / `Legal`. Section model: `id`, `title`, `body: string[]`. Body uses foreground color (not muted). See `docs/product/ui/static-pages-content.md` § Legal pages.

## Transactional emails — subscription invoice

Not a `translations.ts` key table. Verbatim DE/EN copy lives in `packages/email/src/subscription-invoice.ts` (`buildSubscriptionInvoiceContent`). Sent via Resend after the first paid subscription invoice (`invoice.paid` + `billing_reason` `subscription_create` only). From-address is `DAILY_CODES_FROM_EMAIL`. `{SITE_URL}` is the public origin with no trailing slash; links are `{SITE_URL}/{locale}/…`. Credits do **not** roll over.

| | DE | EN |
|---|---|---|
| Subject | Deine Unveiled Berlin Rechnung | Your Unveiled Berlin invoice |
| Lead | Deine Unveiled Berlin Mitgliedschaft ist aktiv. | Your Unveiled Berlin membership is active. |
| Plan | Abo: Basic Berlin — 29€/Monat | Plan: Basic Berlin — 29€/month |
| Credits | Credits: 17 pro Monat (ungenutzte Credits verfallen) | Credits: 17 per month (unused credits do not roll over) |
| Attachment | Deine Rechnung ist als PDF angehängt. | Your invoice is attached as a PDF. |
| Next steps heading | Nächste Schritte: | What to do next: |
| 1. Events | Events entdecken: `{SITE_URL}/de/events` | Browse events: `{SITE_URL}/en/events` |
| 2. Book / My Tickets | Mit Credits buchen — Tickets und Einlassdetails findest du unter Meine Tickets: `{SITE_URL}/de/bookings` | Book with your credits — tickets and door details land in My Tickets: `{SITE_URL}/en/bookings` |
| 3. Billing | Abrechnung verwalten: `{SITE_URL}/de/profile/billing` | Manage billing: `{SITE_URL}/en/profile/billing` |
| 4. How it works | So funktioniert's: `{SITE_URL}/de/how-it-works` | How it works: `{SITE_URL}/en/how-it-works` |
| 5. FAQ | FAQ: `{SITE_URL}/de/faq` | FAQ: `{SITE_URL}/en/faq` |
| Support | Support: support@unveiled.berlin | Support: support@unveiled.berlin |

HTML is a paragraph-equivalent of the same content with anchor tags on each URL and `mailto:support@unveiled.berlin`.

## Booking checkout — already booked

Not a `translations.ts` key. Verbatim DE/EN copy lives in `apps/web/app/lib/booking-content.ts` (`getAlreadyBookedCopy`). Shown on public event detail (selected hour) and `/events/:id/book` when a booking-eligible member already holds that occurrence as `CONFIRMED` or `USED`. My Tickets href is `/:locale/bookings`.

| | DE | EN |
|---|---|---|
| Message | Du hast das bereits gebucht. Du kannst es unter Meine Tickets nachschauen. | You've already booked this. You can check it in My Tickets. |
| Link | Meine Tickets | My Tickets |

## Content not captured in `translations.ts` (extract manually from components if needed)

- Landing page hero/marketing copy (inline in `App.tsx`)
- How It Works page steps/value points (`HowItWorksPage.tsx`)
- FAQ questions/answers (`HelpSection.tsx` — hardcoded 3 Q&As per language)
- Discover/marketing page copy (`apps/web/app/lib/content/discover.ts` — featured empty state: "Aktuell keine empfohlenen Events." / "No featured events right now."; Partner venues eyebrow "Partnerorte" / "Partner venues")
- App shell nav Discover / Browse events strings (`apps/web/app/lib/copy.ts` — `nav.discover`, `browseEvents`)
- Admin Featured events + Featured partners chrome (`apps/web/app/lib/admin-content.ts`): `tabFeatured` Empfohlene Events / Featured events; `tabFeaturedPartners` Empfohlene Partner / Featured partners; `featured*` + `featuredPartners*` list/add/remove titles, empty states, confirm copy (remove keeps catalog partner/event); Featured events table: `featuredReorderHint`, `featuredSaveOrderAction`, `featuredRemoveBulkAction`, `featuredSelectLabel`; Featured partners grid: `featuredPartnersReorderHint`, `featuredPartnersSaveOrderAction`, `featuredPartnersRemoveBulkAction`, `featuredPartnersSelectLabel`
- Admin Bookings tab chrome (`apps/web/app/lib/admin-content.ts`): `tabBookings` Buchungen / Bookings; `bookingsIndexTitle` Buchungen nach Event / Bookings by event; `bookingsIndexSubtitle`; `eventBookingsTitle` / `eventBookingsAction` Buchungen / Bookings; `cancelAllAction` Alle bestätigten Buchungen stornieren / Cancel all confirmed bookings; `cancelAllTitle`, `cancelAllLead`, `cancelAllCatalogWarning`, `cancelAllSinglePathNote`, `cancelAllUsedNote`; `cancelAllReasonLabel` Grund (erforderlich) / Reason (required); `cancelAllSubmit` Stornierung bestätigen / Confirm cancellation; `cancelAllEmpty`; `bookingsEmpty` Keine Buchungen für dieses Event. / No bookings for this event.; `bookingsIndexEmpty`; `colConfirmed` / `colUsed` / `colCancelled` / `colWaitlist` / `colCreditsCharged`; `statusFilterLabel`; `okCancelAll` Buchungen storniert. Credits und Gutscheine wurden zurückgegeben. / Bookings cancelled. Credits and vouchers were returned.
- Onboarding / profile preference option labels — locale maps in `apps/web/app/lib/onboarding-content.ts` (`getInterestLabel`, `getMoodLabel`, `getTimingLabel`, `getWeekdayLabel`, `getPreferredLanguageLabel`, `getAgeGroupLabel`). Stored allowlist keys remain in `@unveiled/auth/constants`: `INTERESTS` includes `Other` (DE `Sonstiges`); member `PREFERRED_LANGUAGES` (no `Non-Verbal`; DE/EN pinned first in UI). Timing/days/moods are translated per locale. Location chrome also lives in `onboarding-content.ts` (`getOnboardingCopy`): `locationLabel`, `countryLabel` / `countryDisplay`, `cityLabel` / `cityDisplay`, `zipCodeLabel`, `zipCodeHint` (Germany/Berlin prefilled; optional Berlin PLZ). Travel distance / `radiusLabel` is not collected. Interests Other free-text labels, language search placeholder, Accessibility needed? / Yes|Ja. Event **category/type** labels are **not** `INTERESTS` / `getInterestLabel` — they live with admin-content maps: `getEventCategoryOptions` / `getEventTypeOptions` in `apps/web/app/lib/admin-content.ts` wrapping `getEventCategoryLabel` / `getEventTypeLabel` from `@unveiled/db` (`event-taxonomy.ts`). Member feed/map filter chrome: `categoryLabel` Kategorie/Category in `apps/web/app/lib/event-feed-content.ts`.
- "SECURE RSVP // NO REFUNDS" booking policy copy (hardcoded in `BookingModal.tsx`, not in `translations.ts`)
- Venue check-in inline copy (`BookingsView.tsx`)
- Event detail checkout-card CTA/notice strings (guest unlock, membership notices, “Secure RSVP // No refunds”, total label) — live in `EventDetailPage.tsx` / locale helpers, not the old `translations.ts` catalog; see `ui/ui-component-map.md` Event detail entry. EventCard primary CTA uses Discover / Entdecken (`bookNow` key) or Waitlist / Warteliste for all viewer states (guest included); image and title also link to detail.
- Event detail gallery section + slider a11y (`apps/web/app/lib/event-detail-gallery-copy.ts`): section title Galerie/Gallery; Previous/Next/Close labels; photo alt “Foto N” / “Photo N”.
- Event detail partner opening hours (`apps/web/app/lib/partner-opening-hours-display.ts`): weekday labels Monday–Sunday / Montag–Sonntag; public detail lists **working days only** as `HH:MM – HH:MM` (Europe/Berlin wall times) under partner name/logo in DETAILS when `has_opening_hours` is true with at least one open weekday. Closed / Geschlossen remains on the admin partner form (`openingHoursClosedLabel` in `admin-content.ts`); the public hours list does not show it.
- Admin event gallery manage copy (`apps/web/app/lib/admin-content.ts`): `galleryTitle`, `gallerySubtitle`, `galleryCapacity`, `galleryEmpty`, `galleryAdd*` / `galleryRemove*` / `galleryManageAction` / `galleryPhotoLabel` / `gallerySelectLabel` / `galleryReorderHint` / `gallerySaveOrderAction` / `gallerySelectedFilesLabel`; capacity/duplicate/reorder validation messages via `mapCatalogError`.
- Admin image upload copy (`apps/web/app/lib/admin-content.ts`): `imageFileLabel`, `imageUploadHint`, `imageUploadHintEdit`, `imageProcessingError`, `imageRequiredError`, `imageUndecodableError`, `imageWebpUnsupportedError`, `imageIncompleteVariantsError`, `imageProcessingSubmitBlocked`, `imageVariantGalleryLabel`, `imageVariantOpenLabel`, `imageVariantPreviousLabel`, `imageVariantNextLabel`, `imageVariantCloseHint`; partner logo: `logoFileLabel`, `logoUploadHint`, `logoUploadHintEdit`, `logoRequiredError`. Hints describe browser-decodable → WebP (no 800×420 / 8 MB language). Partner create/edit: `bankDetailsLabel` Bankverbindung (optional) / Bank details (optional); `bankDetailsHint` accounting helper; `fieldErrors.bankDetails` max 2000 characters.
- Admin event multi-value fields (`apps/web/app/lib/admin-content.ts`): `titleLabelDe` Titel (DE) / Title (DE); `titleLabelEn` Titel (EN) / Title (EN); `descriptionLabelDe` Beschreibung (DE) / Description (DE); `descriptionLabelEn` Beschreibung (EN) / Description (EN); `fieldErrors.titleDe` / `titleEn` / `descriptionDe` / `descriptionEn` for empty locale copy. `languagesLabel` Sprachen/Languages; `languagesSearchPlaceholder` Sprachen suchen/Search languages; `languagesSearchHint` short helper that only common languages are shown and search finds the rest; `languageIndependentLabel` Sprachunabhängig/Language-independent; `languageIndependentHint` short helper for exhibitions/installations; `hasSubtitlesLabel` Untertitel/Subtitles; `hasSubtitlesHint` independent-of-spoken-languages helper (one or more); `subtitleLanguageLabel` Untertitelsprachen/Subtitle languages; `subtitleLanguagesSearchPlaceholder` Untertitelsprachen suchen/Search subtitle languages; `subtitleLanguagesSearchHint` same short search helper; `fieldErrors.subtitleLanguage` for missing/invalid ISO list. Spoken languages and subtitle languages both use searchable `CheckboxMultiSelect` (subtitles = full ISO 639-1, not spoken `EVENT_LANGUAGES`). Event target age groups (`targetAgeGroupsLabel`) removed. Clone flow keys: `cloneAction` Klonen/Clone; `cloneEventTitle` Event klonen/Clone event; `cloneSubmit` Klonen/Clone; inventory/date hints on the clone form. Series builder weekday labels removed with series create. Partner attribution on public detail uses denormalized `event.partnerName` + logo image alt (no separate copy keys). Public detail language-independent value uses the same Language-independent / Sprachunabhängig wording. Public detail subtitles MetaCell label is Untertitel/Subtitles with joined ISO codes as value.
- Admin shared page eyebrow (`apps/web/app/lib/admin-content.ts` `pageEyebrow`): "Admin" / "Verwaltung" — used by every `AdminPageShell` `PageSectionHeader`.
- Member profile account chrome + membership home (`apps/web/app/lib/profile-content.ts`): `eyebrow` Account/Konto; `title` Your account/Dein Konto; tab labels Membership/Mitgliedschaft, Personal details/Persönliche Daten, Vibes / Preferences, Billing/Abrechnung, Change password/Passwort ändern, Export data/Daten exportieren, Delete account/Konto löschen; `membershipTitle` / `membershipSubtitle`; `manageSubscriptionCta` Manage subscription/Abo verwalten; `startMembershipCta` Start membership/Mitgliedschaft starten.

## Recommendation

Move this catalog into whatever i18n library the rewrite uses (e.g. `next-intl`-style JSON per locale, or a HonoX-compatible i18n solution) as `de.json` / `en.json`, and audit the "not captured" list above against the actual component source before finalizing — some of that copy may be worth revising anyway per the project's stated openness to changing features/copy that don't make sense.
