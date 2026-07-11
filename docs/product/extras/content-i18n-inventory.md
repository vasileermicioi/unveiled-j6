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
| `bookNow` | Bin dabei | Book Now |
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
| `moodLabel` | WELCHE VIBES SUCHST DU? | WHAT VIBES ARE YOU AFTER? |
| `districtLabel` | WO BIST DU UNTERWEGS? | WHERE DO YOU HANG OUT? |
| `radiusLabel` | WIE WEIT WÜRDEST DU FAHREN? | HOW FAR WOULD YOU TRAVEL? |
| `timingLabel` | WANN HAST DU ZEIT? | WHEN DO YOU HAVE TIME? |
| `daysLabel` | WELCHE TAGE? | WHICH DAYS? |
| `languagePrefLabel` | SPRACHEN? | LANGUAGES? |
| `accessibilityLabel` | BARRIEREFREIHEIT ERFORDERLICH? | ACCESSIBILITY REQUIRED? |
| `finish` | FERTIG | FINISH |
| `next` | WEITER | NEXT |
| `skip` | ÜBERSPRINGEN | SKIP |
| `km` | km | km |
| `eventList` | Events | Events |
| `createEvent` | Event erstellen | Create Event |

## `filters`

| Key | DE | EN |
|---|---|---|
| `title` | FILTERN | FILTERS |
| `from` | VON | FROM |
| `to` | BIS | UNTIL |
| `reset` | ZURÜCKSETZEN | RESET |
| `noResults` | KEINE EVENTS IN DIESEM ZEITRAUM GEFUNDEN. | NO EVENTS FOUND FOR THIS PERIOD. |

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
| `subtitle` | Full Access. 17 Credits/Monat. Jederzeit kündbar. | Full Access. 17 Credits/mo. Cancel anytime. |
| `button` | ABO STARTEN — 29€ | START SUB — 29€ |
| `secure` | SICHERE ZAHLUNG VIA STRIPE | SECURE PAYMENT VIA STRIPE |
| `perks[0]` | Alle Events inklusive | All events included |
| `perks[1]` | Vorkaufsrecht für Highlights | Early access to highlights |
| `perks[2]` | Credits rollen mit | Credits roll over |
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
> ⚠️ **Needs copy correction:** `perks[2]` ("Credits roll over" / "Credits rollen mit") — **decided:** credits do **not** roll over in the rewrite (see `features/credits-subscription.feature`). This specific line must be rewritten before launch, e.g. DE: "17 Credits jeden Monat" / EN: "17 fresh credits every month" — do not ship the old "roll over" claim, it is now actively false rather than just unimplemented.

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

## Content not captured in `translations.ts` (extract manually from components if needed)

- Landing page hero/marketing copy (inline in `App.tsx`)
- How It Works page steps/value points (`HowItWorksPage.tsx`)
- FAQ questions/answers (`HelpSection.tsx` — hardcoded 3 Q&As per language)
- Discover/marketing page copy (`AccessPage.tsx`)
- Onboarding option labels (interests, moods, districts, timing, days — hardcoded arrays in `Onboarding.tsx`, values like "Theater", "Kino", "Mitte", "X-Berg", etc. are the same string in both languages today)
- "SECURE RSVP // NO REFUNDS" booking policy copy (hardcoded in `BookingModal.tsx`, not in `translations.ts`)
- Venue check-in inline copy (`BookingsView.tsx`)
- `EventCard`'s two viewer-state-dependent CTA labels, hardcoded inline rather than pulled from `translations.ts` like the rest of the card's copy (`bookNow`/`waitlist` are in the catalog, these two aren't): "See details" / "Mehr sehen" (guest state) and "Unlock event" / "Mit Abo öffnen" (inactive-subscription state) — see `ui/ui-component-map.md`'s `EventCard` entry

## Recommendation

Move this catalog into whatever i18n library the rewrite uses (e.g. `next-intl`-style JSON per locale, or a HonoX-compatible i18n solution) as `de.json` / `en.json`, and audit the "not captured" list above against the actual component source before finalizing — some of that copy may be worth revising anyway per the project's stated openness to changing features/copy that don't make sense.
