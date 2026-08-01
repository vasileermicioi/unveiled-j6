# Admin event catalog for the production MVP.
# Dedicated SSR pages: /admin/events/new, /admin/events/:id/edit, etc. (see sitemap).
# Partner self-service event CRUD is post-MVP (features/post-mvp/). Admin retains
# unrestricted cross-venue event management in MVP.
# Event image = required file upload → five WebP variants (extras/image-uploads.md).

Feature: Admin — Event Management
  As an admin
  I want to create, edit, and remove events
  So that the catalog stays accurate

  Background:
    Given I am signed in as "ADMIN"

  Scenario: Create a single event
    When I create a new event with a title, partner, credit price, capacity, description, image, Berlin zip code, and dateTime
    Then the event is added to the catalog
    And its remaining capacity defaults to its total capacity
    And its startTimeMinutes and weekday are computed from its dateTime
    # description is Markdown source (MDXEditor-assisted); other required fields unchanged

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
    When I create or edit an event and enter Markdown in the description editor
    Then the event is saved with that Markdown source
    And guests see rendered Markdown on the public event detail page

  Scenario: Supply the event image as a direct upload
    When I create or edit an event and upload an image file
    Then the file is processed into five WebP size variants client-side and stored in object storage
    And the event's image is set to the resulting image (see extras/image-uploads.md)
    And the admin sees a resized-variant preview gallery for the processed (or existing) image

  Scenario: Event image is required
    When I attempt to create or edit an event without uploading an image
    Then the creation/edit is rejected until an image is provided

  Scenario: Failed create keeps event image for retry
    When I create an event with a processed image and the submit is rejected
    Then I still see the resized-variant preview for that image on the form
    And I can retry submit without uploading the image again

  Scenario: Failed edit keeps newly processed replacement image for retry
    When I edit an event, process a replacement primary image, and the submit is rejected
    Then the re-rendered form shows the newly processed/staged replacement preview
    And I can retry submit without choosing the replacement file again

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
    And there is no separate capacity field — total capacity equals the inventory code count
    And inventory rows are written only after a successful SSR form POST

  Scenario: Admin uploads a master PDF and previews tickets
    Given I am creating or editing a VOUCHER_PDF event
    When I choose split-one-file import, upload a PDF, and set pages to skip (comma/ranges) and pages per ticket
    Then the UI shows how many tickets the split produces (not a page-by-page list)
    And there is no separate capacity field — total capacity equals the ticket count from the split
    And confirming the form stores one AVAILABLE PDF inventory row per ticket

  Scenario: Admin uploads multiple PDF files as tickets
    Given I am creating or editing a VOUCHER_PDF event
    When I choose multiple-files import and select several PDF files
    Then the UI shows the ticket count equal to the number of files
    And there is no separate capacity field — total capacity equals the number of files
    And confirming the form stores one AVAILABLE PDF inventory row per file

  Scenario: Default values on creation
    Given I create an event without specifying capacity, ticket type, or timing mode
    Then it defaults to totalCapacity 10, ticketType "SECRET_CODE", timingMode "TIME_SLOT"

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

  Scenario: Update an event's capacity
    Given an event has some tickets already sold (remaining capacity less than total capacity)
    When I update its total capacity to a new value
    Then its remaining capacity is recalculated as max(0, newTotal - alreadySold)

  Scenario: Edit event details
    When I update an event's title, description, image, price, or redemption configuration
    Then the changes are saved and reflected in the feed
    # description remains Markdown source; the editor is initialized from stored Markdown

  Scenario: Delete an event
    When I delete an event
    Then it is removed from the catalog and no longer bookable

  Scenario: Optional accessibility and audience metadata
    When I create or edit an event
    Then I can optionally set barrier-free accessibility, supported languages, language-independent, and target age groups
    And supported languages and language-independent are mutually exclusive in the UI

  Scenario: Check language-independent hides languages picker
    When I open create or edit event
    And I check Language-independent
    Then the languages multi-select is not shown
    And saving stores language-independent true with no language list

  Scenario: Uncheck language-independent restores languages picker
    When I clear Language-independent on edit
    Then the languages multi-select is shown again
    And I may select zero or more languages as today

  Scenario: Languages multi-select with search
    When I open create or edit event
    And Language-independent is unchecked
    Then languages are chosen with checkboxes and a search filter that narrows visible options
    And already-selected values remain available for the form POST even when filtered out of view

  Scenario: Age groups multi-select without search
    When I open create or edit event
    Then target age groups are chosen with checkboxes and no search filter control

  # Address is the only admin location input — no lat/lng/zoom fields; map is geocode preview only.
  Scenario: Add event prefills address and map from partner
    When I am on the new-event form and select a partner from the dropdown
    Then the address field is set to that partner's address
    And the map preview updates to a geocode of that address when geocoding succeeds
    # Live Nominatim success is soft-fail — address prefill is required; map preview may stay at default

  Scenario: Edit event keeps existing address when partner changes
    When I am on the edit-event form and change the partner
    Then the existing address remains unchanged until I edit it manually
    And the map preview is not silently overwritten from the new partner's address

  Scenario: Geocode soft-fails leave address filled
    When I am on the new-event form and select a partner whose address cannot be geocoded
    Then the address field is still set to that partner's address
    And saving the event with that address succeeds
    And the map preview may stay unchanged
    And the saved event does not store invented default-center coordinates for that failed geocode

  Scenario: No admin lat lng or zoom controls
    When I open create or edit event
    Then no latitude, longitude, or map zoom number fields are shown
    And the map marker is not offered as a drag-to-set authoring control

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

  Scenario: Gallery manage is available from the featured list
    Given an event is on the featured list
    When I open the Featured events tab ("/:locale/admin/featured")
    Then I see a path to manage that event's gallery photos
    And gallery manage is not shown on the Events list or create/edit event forms

  Scenario: Gallery capacity is enforced
    Given an event already has 12 gallery photos
    When I attempt to add more gallery photos
    Then the add is rejected with an admin-visible error
    And the primary hero image is unchanged

  Scenario: List featured events
    When I open the Featured events tab ("/:locale/admin/featured")
    Then I see the current featured list ordered by sort_order
    And each row shows at least title, partner, and date/time

  Scenario: Add by searching existing events
    When I search on the featured add page ("/:locale/admin/featured/add?q=")
    Then I see matching catalog events that are not already featured
    And submitting add creates a featured row for that event
    And I am redirected to the featured list

  Scenario: Admin remove from featured keeps catalog event
    Given an upcoming event is on the Featured list
    When I confirm remove on "/:locale/admin/featured/:eventId/remove"
    Then the event disappears from the featured list
    And Discover no longer lists it
    And the event remains available in "/:locale/admin/events"

  Scenario: Empty featured list
    Given no featured rows exist
    When I open "/:locale/admin/featured"
    Then I see an empty state and a path to add featured events
