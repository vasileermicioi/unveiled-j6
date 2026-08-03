# Admin venue (partner) records for the production MVP.
#
# MVP: admins create/edit/delete venue records and logos for the catalog.
# Post-MVP (parked under features/post-mvp/): portal-access provisioning and
# venue check-in QR token regenerate — see partner-and-checkin.feature.
#
# Partner "logo" is a required upload (five WebP variants via @unveiled/images) —
# see extras/image-uploads.md.

Feature: Admin — Partner Management
  As an admin
  I want to manage partner (venue) records
  So that venues can be represented in the catalog and attached to events

  Background:
    Given I am signed in as "ADMIN"

  Scenario: Create a partner
    When I create a partner with a name, contact email, structured location (street, house number, Berlin zip), and a logo image
    Then the partner is added to the catalog as a venue record
    And the partner has a non-null logo image
    And the partner stores a composed display address from those structured fields

  Scenario: Supply the partner logo as a direct upload
    When I create or edit a partner and upload a logo image file
    Then it is processed into five WebP size variants client-side and stored in object storage, exactly like an event image (see extras/image-uploads.md)
    And the admin sees a resized-variant preview gallery for the processed (or existing) logo

  Scenario: Partner logo is required
    When I attempt to create a partner without uploading a logo image
    Then the creation is rejected until a logo is provided

  Scenario Outline: Partner creation validation
    When I submit a partner with <field> set to "<value>"
    Then I see a validation error for <field>

    Examples:
      | field        | value          |
      | name         |                |
      | contactEmail | not-an-email   |
      | street       |                |
      | houseNumber  |                |
      | zipCode      |                |

  Scenario: Country and city are fixed on the partner form
    When I open create or edit partner
    Then country and city are shown prefilled as Germany and Berlin
    And I cannot change country or city via the form

  Scenario: Edit a partner
    When I update a partner's structured location or other details
    Then the changes are saved
    And the composed display address is updated on write

  Scenario: Enable weekly opening hours on create or edit
    When I enable opening hours on create or edit and set a valid open/close (or closed) value for each weekday Monday–Sunday
    And I save the partner
    Then the partner is stored with has_opening_hours true and the weekly schedule
    And public event detail for that partner's events lists those weekday hours in the DETAILS attribution area

  Scenario: Incomplete or invalid opening hours are rejected
    When I enable opening hours and submit an incomplete day or an inverted/equal open–close range
    Then the save is rejected with an opening-hours validation error
    And the form re-shows the submitted hours values

  Scenario: Disable opening hours
    Given a partner has opening hours enabled
    When I uncheck the opening-hours toggle and save
    Then the partner is stored with has_opening_hours false and opening_hours null
    And public event detail for that partner's events omits the opening-hours list

  Scenario: Renaming a partner propagates to its events
    Given a partner has existing events
    When I change that partner's display name
    Then all of that partner's events are updated with the new denormalized partner name

  Scenario: Delete a partner
    When I delete a partner
    Then the partner record is removed

  Scenario: List featured partners
    When I open the Featured partners tab ("/:locale/admin/featured-partners")
    Then I see the current featured partners grid ordered by sort_order
    And each tile shows at least name and logo thumbnail
    And I see a path to save order and remove selected partners

  Scenario: Add by searching existing partners
    When I search on the featured partners add page ("/:locale/admin/featured-partners/add?q=")
    Then I see matching catalog partners that are not already featured
    And submitting add creates a featured row for that partner
    And I am redirected to the featured partners list

  Scenario: Admin reorders featured partners by drag and drop
    Given at least two partners are on the Featured partners list
    When I drag a partner tile to a new position on the grid
    And I save the order ("Save order" / "Reihenfolge speichern")
    Then the new order is saved (sort_order) and shown after reload

  Scenario: Admin remove from featured partners keeps venue
    Given a partner is on the Featured partners list
    When I select that partner on the grid
    And I open remove confirm ("/:locale/admin/featured-partners/remove?partnerIds=")
    And I confirm remove
    Then the partner disappears from the featured partners list
    And Discover no longer lists it in Partner venues
    And the partner remains available in "/:locale/admin/partners"

  Scenario: Empty featured partners list
    Given no featured partner rows exist
    When I open "/:locale/admin/featured-partners"
    Then I see an empty state and a path to add featured partners

  Scenario: Partner list search is labeled Name
    When I open "/:locale/admin/partners"
    Then the partner search filter is labeled "Name" (DE: "Name")
    And it is not the events-list placeholder "Search title or partner" / "Titel oder Partner suchen"

  Scenario Outline: Partner list can be sorted
    When I open "/:locale/admin/partners" and click the "<column>" column header to sort
    Then the partners table is sorted by <sort_param> (<dir_param>)
    And the search query q is preserved when present
    And when the selection is not the default (created + desc), the URL includes sort=<sort_param> and dir=<dir_param>

    Examples:
      | column         | sort_param | dir_param |
      | Name           | name       | asc       |
      | Created        | created    | asc       |
      | Active events  | events     | desc      |

  Scenario: Partner list reset filters clears search and sort
    Given I have an active name filter and a non-default sort on "/:locale/admin/partners"
    When I follow "Reset filters" / "Filter zurücksetzen"
    Then I am on "/:locale/admin/partners" with default last-created sort and no search query

  Scenario: Partner list shows Active events column
    When I open "/:locale/admin/partners"
    Then the partners table has an "Active events" / "Aktive Events" column
    And each partner row shows an active-events count

  Scenario: Partner list Export opens sales export
    When I open "/:locale/admin/partners"
    And I follow the list-level "Export" action
    Then I am on "/:locale/admin/partners/export"

  Scenario: View tickets sold for a period
    When I open the sales-export page ("/:locale/admin/partners/export") and submit a valid from/to period
    Then I see the sales-export results for that period (tickets-sold table with Title, Partner, Date, and Tickets sold, or empty-events copy when there are no events)

  Scenario: Filter sales export by event title and partner name
    When I open the sales-export page and filter by event title and/or partner name with a valid from/to period
    Then the table lists only matching events
    And Download CSV uses the same title and partner filters (format=csv with title/partner query params)

  Scenario: Download sales CSV
    When I request the sales-export CSV for a valid from/to period (format=csv)
    Then the response is text/csv with a Content-Disposition attachment
    And the CSV includes a tickets_sold column
    And when title and/or partner filters are set, the CSV includes only matching events

  Scenario: Sales export is admin-only
    Given I am not signed in as ADMIN
    When I open "/:locale/admin/partners/export"
    Then access is denied (guest → login with returnTo; USER → locale home)
