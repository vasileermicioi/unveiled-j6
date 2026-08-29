# Admin event catalog for the production MVP.
# Dedicated SSR pages: /admin/events/new, /admin/events/new/dates, /admin/events/new/image,
# /admin/events/:id/edit, /admin/events/:id/edit/dates, /admin/events/:id/edit/image (see sitemap).
# Partner self-service event CRUD is post-MVP (features/post-mvp/). Admin retains
# unrestricted cross-venue event management in MVP.
# Event image = required file upload → five WebP variants (extras/image-uploads.md).
# Create stays Draft (`published = false`) until `/:locale/admin/events/:id/publish`.
# Featured-add creates an unpublished featured row until `/:locale/admin/featured/:eventId/publish`.

Feature: Admin — Event Management
  As an admin
  I want to create, edit, and remove events
  So that the catalog stays accurate

  Background:
    Given I am signed in as "ADMIN"

  Scenario: Create a single event
    When I create a new event with German and English titles and Markdown descriptions, partner, per-datetime credit prices, capacity, image, Berlin zip code, and one or more dateTimes
    Then the event is added to the catalog as Draft
    And its remaining capacity defaults to its total capacity
    And its startTimeMinutes and weekday are computed from its primary/next dateTime
    And the success path points at the publish confirm
    # descriptions are Markdown source (two MDXEditor instances, DE then EN); other required fields unchanged
    # Admin create/edit/clone forms present an editable datetime list (add/remove inplace) with credits per row

  Scenario: Create event with DE and EN titles
    When I create an event with both locale titles and both locale descriptions
    And I publish the event
    Then the event is added to the catalog
    And "/de" and "/en" public detail show the matching titles

  Scenario: Create rejects empty English title
    When I submit create or edit with a German title and an empty English title
    Then the event is not saved
    # Domain REQUIRED_FIELD — packages/db event-copy.unit.test.ts; no Playwright (wizard + R2)

  Scenario: Add and remove datetimes on create
    When I am on the new-event form
    And I add a second datetime row, set a credit price on each remaining row, and remove one row
    Then submitting persists exactly the remaining datetime values and their credits on the event

  Scenario: Per-datetime credits persist
    When I create an event with two datetime rows priced 1 and 3 credits
    Then the stored occurrence_credit_prices are 1 and 3 in datetime order
    And denormalized credit_price equals the primary/next slot's price

  Scenario: Total credits shown on the form
    When the datetime list has rows priced 2 and 5
    Then the form shows a total of 7 credits for the list

  Scenario: Timing mode is first on Date & tickets
    When I open the new-event form and go to step 2
    Then I see Timing mode before Capacity allocation, ticket type, and the datetime list

  Scenario: All day hides time inputs
    When I set Timing mode to All day
    Then hour and minute inputs are hidden on the range builder and datetime rows
    And date fields remain

  Scenario: Time slot shows times
    When I set Timing mode to Time slot
    Then datetime rows and range slots show time inputs

  Scenario: Shared capacity is one pool
    When I create an event with Capacity allocation Shared across all dates and capacity 10 and two datetimes
    Then the event's total capacity is 10
    And datetime rows do not show a capacity input

  Scenario: Per-date capacities persist
    When I create an event with Capacity allocation Per date, default capacity 5, and two datetime rows set to 4 and 6
    Then the stored occurrence_capacities are 4 and 6 in datetime order
    And total capacity equals 10

  Scenario: Range rebuild stamps default capacity
    When Capacity allocation is Per date with capacity 8
    And I generate a date range
    Then each generated datetime row's capacity is 8

  Scenario: Capacity and inventory totals mismatch
    When I am creating a VOUCHER_PROMO event with datetime capacity total 10 and 7 codes previewed
    Then the capacity and inventory totals are shown in danger styling
    And submitting is rejected until they match

  Scenario: Edit datetimes inplace
    When I edit an event that already has multiple datetimes
    Then I see all values as editable rows including each row's credits
    And I can add or remove rows and save

  Scenario: Range and two time slots generate a grid
    When I set a start date, end date, and time slots 10:00 at 1 credit and 18:00 at 3 credits
    Then the datetime list has one row per date × each time
    And morning rows are priced 1 and evening rows are priced 3

  Scenario: Changing the end date rebuilds from scratch
    When a generated list exists and I have manually added an extra row
    And I change the builder end date
    Then the list is replaced by a fresh expansion
    And the manually added row is gone

  Scenario: Create prefills slots from partner open times
    When I am on the new-event form and select a partner open 10:00–18:00 weekdays and closed Sunday
    Then the builder shows a 10:00 time slot by default

  Scenario: Range includes closed partner weekdays
    When that partner is selected and I generate a range that includes Sunday with the default 10:00 slot
    Then Sunday is in the datetime list
    And every calendar day in the range is

  Scenario: Admin event list shows next upcoming datetime
    When I view the admin Events catalog for an event with multiple datetimes including a future occurrence
    Then the date column shows the next upcoming datetime
    And it may append a simple +N count of additional datetimes

  Scenario: Admin sets Berlin zip on create
    When I create a new event with a valid Berlin PLZ and other required fields
    Then the event is saved with country DE, city berlin, and that zip_code
    And no neighborhood / Kiez field is shown

  Scenario: Country and city are fixed on the form
    When I open create, edit, or clone event
    Then country and city are shown prefilled as Germany and Berlin
    And I cannot change country or city via the form
    And no neighborhood / Kiez select is shown

  Scenario: Admin authors Markdown description
    When I create or edit an event and enter Markdown in the German and English description editors
    Then the event is saved with that Markdown source for both locales
    And guests see locale-resolved rendered Markdown on the public event detail page

  Scenario: Supply the event image as a direct upload
    When I create or edit an event and upload an image file
    Then the file is processed into five WebP size variants client-side and stored in object storage
    And the event's image is set to the resulting image (see extras/image-uploads.md)
    And the admin sees a resized-variant preview gallery for the processed (or existing) image

  Scenario: Event image is required
    When I attempt to create or edit an event without uploading an image
    Then the creation/edit is rejected until an image is provided

  Scenario: Create walks three steps
    When I open the new-event form
    Then I see step 1 General with progress indicating step 1 of 3
    And I do not see the datetime list or image uploader until I go to those steps

  Scenario: Create submit is on the image step
    When I am on new-event step 3
    Then I can submit the form
    And earlier steps' values are included in the POST
    And the URL is "/:locale/admin/events/new/image"

  Scenario: Edit can jump to image
    When I open edit-event
    Then I can move to step 3 without posting
    And the URL is "/:locale/admin/events/:id/edit/image"
    And saving posts the full form including unchanged dates and image id

  Scenario: Refresh keeps unsaved event edits
    When I change a field on create or edit event and refresh
    Then the unsaved value is still in the field
    And I can discard the draft to reload saved or empty values
    And discard on create returns to step 1

  Scenario: Edit steps keep unsaved edits
    When I edit a field on one wizard step and open another step URL
    Then returning to the first step still shows the unsaved value
    And create GET "/:locale/admin/events/new/dates" stays on Date & tickets (does not redirect to step 1)
    And Back from Date & tickets does not trigger date validation

  Scenario: Successful event save clears draft
    When I save the event successfully and reopen edit
    Then I see persisted database values, not the discarded in-progress draft

  Scenario: Missing image returns to step 3
    When I create an event and submit without a primary image
    Then the form is rejected
    And the re-rendered form shows the image step
    And the URL is the image create route

  Scenario: Failed create keeps event image for retry
    When I create an event with a processed image and the submit is rejected
    Then I still see the resized-variant preview for that image on the form
    And I can retry submit without uploading the image again

  Scenario: Failed edit keeps newly processed replacement image for retry
    When I edit an event, process a replacement primary image, and the submit is rejected
    Then the re-rendered form shows the newly processed/staged replacement preview
    And I can retry submit without choosing the replacement file again

  Scenario: Event primary credit on create
    When I create an event and set image credit to "Photo: Ada"
    Then the public event detail shows that credit under the primary image

  Scenario: Keep existing image and edit credit
    Given an event with an existing primary image
    When I edit the event, keep the image, and change the credit
    Then the stored credit is updated without replacing the image

  Scenario: Gallery photo credit on add
    When I add a gallery photo and set its credit
    Then the gallery manage list shows that credit

  Scenario Outline: Redemption configuration validation on create
    Given I am creating an event with ticket type "<ticketType>"
    When I omit "<requiredField>"
    Then the creation is rejected until I provide it

    Examples:
      | ticketType    | requiredField        |
      | SECRET_CODE   | secretCode           |
      | VOUCHER_PROMO | promo inventory      |
      | VOUCHER_PROMO | eventWebsiteUrl      |
      | VOUCHER_PDF   | PDF ticket inventory |

  Scenario: Admin uploads promo codes with preview
    Given I am creating or editing a VOUCHER_PROMO event
    When I select a text or CSV file (or paste codes)
    Then the UI previews one non-empty code per line
    And available codes/tickets total equals that count
    And submitting succeeds only when datetime capacity total equals that count
    And inventory rows are written only after a successful SSR form POST

  Scenario: Admin uploads a master PDF and previews tickets
    Given I am creating or editing a VOUCHER_PDF event
    When I choose split-one-file import, upload a PDF, and set pages to skip (comma/ranges) and pages per ticket
    Then the UI shows how many tickets the split produces (not a page-by-page list)
    And submitting succeeds only when datetime capacity total equals that ticket count
    And confirming the form stores one AVAILABLE PDF inventory row per ticket

  Scenario: Admin uploads multiple PDF files as tickets
    Given I am creating or editing a VOUCHER_PDF event
    When I choose multiple-files import and select several PDF files
    Then the UI shows the ticket count equal to the number of files
    And submitting succeeds only when datetime capacity total equals that file count
    And confirming the form stores one AVAILABLE PDF inventory row per file

  Scenario: Default values on creation
    Given I create an event without specifying capacity, ticket type, timing mode, or capacity allocation
    Then it defaults to totalCapacity 10, ticketType "SECRET_CODE", timingMode "TIME_SLOT", capacityMode "SHARED"

  Scenario: Clone event from catalog list
    When I open clone for an existing event, set a new date/time, and confirm
    Then a new event appears in the catalog with the copied title and new date/time

  Scenario: Clone voucher event requires inventory
    When I clone a VOUCHER_PROMO or VOUCHER_PDF event without providing new inventory
    Then the clone is rejected until inventory is provided

  Scenario: Clone entry points visible
    When I view the Events list or an event edit page
    Then a Clone action linking to "/:locale/admin/events/:id/clone" is available
    And no Event series create CTA is shown

  Scenario: Clone is not a wizard
    When I open clone for an existing event
    Then I do not see the three-step progress chrome from create/edit

  Scenario Outline: Event list can be sorted
    When I open "/:locale/admin/events" and click the "<column>" column header to sort
    Then the events table is sorted by <sort_param> (<dir_param>)
    And title, partner, and language filters are preserved when present
    And when the selection is not the default (created + desc), the URL includes sort=<sort_param> and dir=<dir_param>

    Examples:
      | column   | sort_param | dir_param |
      | Title    | title      | asc       |
      | Partner  | partner    | asc       |
      | Date     | date       | desc      |
      | Created  | created    | asc       |
      | Capacity | capacity   | desc      |
      | Status   | published  | desc      |

  Scenario: Event list filters by title, partner, and language
    When I open "/:locale/admin/events" and filter by event title, partner name, and/or language
    Then the list shows matching events
    And language filter also matches events whose subtitle language equals the selected code
    And the table shows a Status column with Published/Draft and a Publish or Unpublish link

  Scenario: Event list reset filters clears search and sort
    Given I have active title/partner/language filters and/or a non-default sort on "/:locale/admin/events"
    When I follow "Reset filters" / "Filter zurücksetzen"
    Then I am on "/:locale/admin/events" with default last-created sort and no filters

  Scenario: Update an event's capacity
    Given an event has some tickets already sold (remaining capacity less than total capacity)
    When I update its total capacity to a new value
    Then its remaining capacity is recalculated as max(0, newTotal - alreadySold)
    # newTotal is the shared capacity number, or the sum of per-date capacities

  Scenario: Edit event details
    When I update an event's German and English titles, descriptions, image, price, or redemption configuration
    Then the changes are saved and reflected in the feed
    # descriptions remain Markdown source; both editors are initialized from stored locale Markdown

  Scenario: Delete an event
    When I delete an event
    Then it is removed from the catalog and no longer bookable

  Scenario: Optional audience metadata without barrier-free
    When I create or edit an event
    Then I can optionally set supported languages, language-independent, and subtitles
    And supported languages and language-independent are mutually exclusive in the UI
    And subtitles are independent of spoken languages / language-independent
    And no barrier-free control is shown
    And no target age groups control is shown

  Scenario: Check language-independent hides languages picker
    When I open create or edit event
    And I check Language-independent
    Then the languages multi-select is not shown
    And saving stores language-independent true with no language list

  Scenario: Uncheck language-independent restores languages picker
    When I clear Language-independent on edit
    Then the languages multi-select is shown again
    And I may select zero or more languages as today

  Scenario: Check Subtitles reveals language multi-select
    When I open create or edit event
    And I check Subtitles
    Then a searchable subtitle-languages checkbox multi-select with the full ISO 639-1 list is shown and at least one language is required

  Scenario: Save event with Subtitles and multiple languages
    When I create an event with Subtitles checked and DE plus EN selected
    Then the saved event has has_subtitles true and subtitle_languages containing DE and EN
    And the public detail DETAILS metadata shows subtitles availability and those languages

  Scenario: Subtitles controls available when language-independent
    When I open create or edit event
    And I check Language-independent
    Then the Subtitles checkbox remains available
    And checking Subtitles still shows the subtitle-languages checkbox multi-select

  Scenario: Languages multi-select with search
    When I open create or edit event
    And Language-independent is unchecked
    Then languages are chosen with a searchable checkbox multi-select
    And only a short default list is shown until search is used
    And a hint explains that search is needed to find other languages
    And already-selected values remain available for the form POST even when filtered out of the visible list

  # Structured street/house/line2 + zip are the admin location inputs — no free-text address field;
  # display `address` is composed on write. Map is structured-geocode preview only (line2 excluded).
  Scenario: Add event prefills structured location and map from partner
    When I am on the new-event form and select a partner from the dropdown
    Then the street, house number, optional line2, and zip fields are set from that partner
    And the map preview updates to a structured geocode when geocoding succeeds
    # Live Nominatim success is soft-fail — structured prefill is required; map preview may stay at default

  Scenario: Edit event keeps existing location when partner changes
    When I am on the edit-event form and change the partner
    Then the existing structured location fields remain unchanged until I edit them manually
    And the map preview is not silently overwritten from the new partner's location

  Scenario: Geocode soft-fails leave structured location filled
    When I am on the new-event form and select a partner whose location cannot be geocoded
    Then the structured location fields are still set from that partner
    And saving the event with that location succeeds
    And the map preview may stay unchanged
    And the saved event does not store invented default-center coordinates for that failed geocode

  Scenario: No admin lat lng or zoom controls
    When I open create or edit event
    Then no latitude, longitude, or map zoom number fields are shown
    And the map marker is not offered as a drag-to-set authoring control
    And no free-text address authoring field is shown as the street-location source of truth

  Scenario: Export redemption codes for an event
    Given an event has confirmed bookings with redemption codes
    When I export codes for that event
    Then I receive a CSV of bookings and their redemption codes

  Scenario: Seed demo data (empty environment only)
    Given the events and partners tables are both empty
    When I trigger the demo data seed
    Then a small set of sample partners and events is created
    And a small subset of upcoming demo events is featured for Discover
    And at least one upcoming featured event has multiple gallery images

  Scenario: Seed demo data is a no-op when data exists
    Given at least one partner or event already exists
    When I trigger the demo data seed
    Then no new demo data is created

  Scenario: Admin multi-upload gallery photos
    Given an existing event in the catalog
    When I open the event gallery add page ("/:locale/admin/events/:id/gallery/add")
    And I submit multiple valid image files
    Then each file is processed into five WebP variants client-side and stored as gallery images
    And I am redirected to the event gallery list showing the new photos
    And the primary hero image is unchanged

  Scenario: Admin removes selected gallery photos
    Given an event has two or more gallery photos
    When I select one or more photos on the gallery grid
    And I open remove confirm via "Remove photos" / "Fotos entfernen"
    And I confirm with form POST
    Then those images disappear from the event gallery list
    And unreferenced image objects are cleaned up from storage

  Scenario: Admin reorders gallery photos by drag and drop
    Given an event has two or more gallery photos
    When I drag a gallery photo to a new position on the grid
    And I save the order ("Save order" / "Reihenfolge speichern")
    Then the new order is saved (sort_order) and shown after reload

  Scenario: Gallery manage is available from the Events catalog
    Given an existing catalog event that is not on the featured list
    When I open the Events list ("/:locale/admin/events") or that event's edit page
    Then I see a path to manage that event's gallery photos
    And the Featured events list does not offer a gallery-manage shortcut
    And gallery manage is not required on the create-event form

  Scenario: List featured events
    When I open the Featured events tab ("/:locale/admin/featured")
    Then I see the current featured list ordered by sort_order
    And each row shows at least a primary-image thumbnail (or placeholder), title, partner, and date/time
    And when the list is non-empty I see Save order and Remove selected
    And a missing or broken thumbnail does not block select or remove

  Scenario: Add by searching existing events
    When I search on the featured add page ("/:locale/admin/featured/add") with title, partner, and/or language filters
    Then I see matching catalog events that are not already featured
    And each result row shows a primary-image thumbnail (or placeholder) alongside title, partner, languages, subtitles, and date/time
    And a missing or broken thumbnail does not block the add action
    And submitting add adds that event to the featured list
    And I am returned to the Featured events list

  Scenario: Admin reorders featured events by drag and drop
    Given at least two events are on the Featured list
    When I drag a featured event row to a new position
    And I save the order ("Save order" / "Reihenfolge speichern")
    Then the new order is saved (sort_order) and shown after reload

  Scenario: Admin remove from featured keeps catalog event
    Given an upcoming event is on the Featured list
    When I select that event on the list
    And I open remove confirm ("/:locale/admin/featured/remove?eventIds=")
    And I confirm remove
    Then the event disappears from the featured list
    And Discover no longer lists it
    And the event remains available in "/:locale/admin/events"

  Scenario: Empty featured list
    Given no featured rows exist
    When I open "/:locale/admin/featured"
    Then I see an empty state and a path to add featured events

  Scenario: Publish confirm goes live on Browse
    When I confirm publish for a draft event
    Then the Events catalog shows Published / Veröffentlicht
    And a booking-eligible member sees that event on "/events"

  Scenario: Unpublish confirm hides from Browse
    When I confirm unpublish for a published event
    Then the Events catalog still lists the event as Draft / Entwurf
    And that event does not appear on member "/events"

  Scenario: Create does not appear on Browse
    When I create an event and do not publish it
    Then the event is on "/admin/events" as Draft
    And it does not appear on member "/events"

  Scenario: Event list shows Published or Draft status
    When I open "/admin/events" with both a draft and a published event
    Then each row shows Published / Veröffentlicht or Draft / Entwurf

  Scenario: Event list filters by published
    When I open "/admin/events?published=no"
    Then only unpublished events are listed
    And sort, title, partner, and language params are preserved when changing the filter

  Scenario: Unpublish does not delete or drop featured membership
    Given a catalog event has a featured row
    When I unpublish the catalog event
    Then the event remains on "/admin/events"
    And the featured row remains on "/admin/featured"
    And Discover omits the event until the catalog event is published again

  Scenario: Preview draft detail
    When I open "/:locale/admin/events/:id/preview" for an unpublished event
    Then the preview page is available and shows the locale title
    And a guest opening "/:locale/events/:id" sees the same not-found page as a missing event

  Scenario: Preview does not book
    When I am on the detail preview
    Then the primary checkout control is Preview only / Nur Vorschau
    And there is no book, waitlist, save, or login form POST from that page

  Scenario: Preview browse card
    When I open the browse preview for an unpublished event that is not featured
    Then I see one event card with the locale title
    And the page does not list other catalog events
    And the card CTA stays on "/:locale/admin/events/:id/preview"

  Scenario: Preview discover card
    When I open the discover preview for an unpublished event that is not featured
    Then I still see one Discover-styled event card with the locale title
    And I see the live Discover section header copy
    And live "/:locale/discover" does not list that draft

  Scenario: Guest cannot open event preview
    Given I have an unpublished event
    When a guest opens "/:locale/admin/events/:id/preview"
    Then they are sent to "/:locale/login?returnTo="
    And the event body is not shown
