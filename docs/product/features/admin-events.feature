# Admin event catalog for the production MVP.
# Dedicated SSR pages: /admin/events/new, /admin/events/:id/edit, etc. (see sitemap).
# Partner self-service event CRUD is post-MVP (features/post-mvp/). Admin retains
# unrestricted cross-venue event management in MVP.
# Event image = required upload or remote URL → six JPEG variants (extras/image-uploads.md).

Feature: Admin — Event Management
  As an admin
  I want to create, edit, and remove events
  So that the catalog stays accurate

  Background:
    Given I am signed in as "ADMIN"

  Scenario: Create a single event
    When I create a new event with a title, partner, credit price, capacity, description, image, and dateTime
    Then the event is added to the catalog
    And its remaining capacity defaults to its total capacity
    And its startTimeMinutes and weekday are computed from its dateTime

  Scenario: Supply the event image as a direct upload
    When I create or edit an event and upload an image file instead of pasting a URL
    Then the file is processed into the standard set of size variants and stored in object storage
    And the event's image is set to the resulting image, exactly as if a URL had been provided (see extras/image-uploads.md)

  Scenario: Supply the event image as a remote URL
    When I create or edit an event and paste an image URL instead of uploading a file
    Then the server fetches that URL and processes it into the same set of size variants as a direct upload
    And the event's image is set to the resulting image — the original URL is not stored or linked to directly

  Scenario: Event image is required
    When I attempt to create or edit an event without providing an image (neither upload nor URL)
    Then the creation/edit is rejected until an image is provided

  Scenario Outline: Redemption configuration validation on create
    Given I am creating an event with ticket type "<ticketType>" and secret code mode "<mode>"
    When I omit "<requiredField>"
    Then the creation is rejected until I provide it

    Examples:
      | ticketType  | mode   | requiredField      |
      | SECRET_CODE | MANUAL | secretCode         |
      | VOUCHER     | (n/a)  | promoCode          |
      | VOUCHER     | (n/a)  | eventWebsiteUrl    |

  Scenario: Shared generated code is created automatically
    Given I create an event with ticket type "SECRET_CODE" and mode "SHARED_GENERATED"
    And I do not supply a code
    Then the system will generate one shared code the first time it's needed

  Scenario: Default values on creation
    Given I create an event without specifying capacity, ticket type, secret code mode, or timing mode
    Then it defaults to totalCapacity 10, ticketType "SECRET_CODE", secretCodeMode "MANUAL", timingMode "TIME_SLOT"

  Scenario: Create an event series with manual slots
    When I create an event series by manually specifying a list of unique, non-empty date/time slots
    Then one event is created per slot, sharing the same base details

  Scenario: Create an event series with a date-range builder
    When I create an event series by specifying a date range, selected weekdays, and daily time(s), with optional excluded dates
    Then one event is created for each matching weekday/time combination in the range, excluding the specified dates
    And I can preview the generated slots before confirming

  Scenario: Update an event's capacity
    Given an event has some tickets already sold (remaining capacity less than total capacity)
    When I update its total capacity to a new value
    Then its remaining capacity is recalculated as max(0, newTotal - alreadySold)

  Scenario: Edit event details
    When I update an event's title, description, image, price, or redemption configuration
    Then the changes are saved and reflected in the feed

  Scenario: Delete an event
    When I delete an event
    Then it is removed from the catalog and no longer bookable

  Scenario: Optional accessibility and audience metadata
    When I create or edit an event
    Then I can optionally set barrier-free accessibility, supported languages, and target age groups

  Scenario: Export redemption codes for an event
    Given an event has confirmed bookings with redemption codes
    When I export codes for that event
    Then I receive a CSV of bookings and their redemption codes

  Scenario: Seed demo data (empty environment only)
    Given the events and partners tables are both empty
    When I trigger the demo data seed
    Then a small set of sample partners and events is created
    And a small subset of upcoming demo events is featured for Discover

  Scenario: Seed demo data is a no-op when data exists
    Given at least one partner or event already exists
    When I trigger the demo data seed
    Then no new demo data is created

  Scenario: List featured events
    When I open the Featured tab ("/:locale/admin/featured")
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
