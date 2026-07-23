# Admin venue (partner) records for the production MVP.
#
# MVP: admins create/edit/delete venue records and logos for the catalog.
# Post-MVP (parked under features/post-mvp/): portal-access provisioning and
# venue check-in QR token regenerate — see partner-and-checkin.feature.
#
# Partner "logo" is an optional upload (six JPEG variants via @unveiled/images) —
# see extras/image-uploads.md.

Feature: Admin — Partner Management
  As an admin
  I want to manage partner (venue) records
  So that venues can be represented in the catalog and attached to events

  Background:
    Given I am signed in as "ADMIN"

  Scenario: Create a partner
    When I create a partner with a name, contact email, address, and optionally a logo image
    Then the partner is added to the catalog as a venue record

  Scenario: Supply the partner logo as a direct upload or a remote URL
    When I create or edit a partner and either upload a logo image file or paste a logo image URL
    Then it is processed into the standard set of size variants and stored in object storage, exactly like an event image (see extras/image-uploads.md)
    And the partner's logo remains optional either way — omitting both leaves the partner without a logo

  Scenario Outline: Partner creation validation
    When I submit a partner with <field> set to "<value>"
    Then I see a validation error for <field>

    Examples:
      | field        | value          |
      | name         |                |
      | contactEmail | not-an-email   |
      | address      |                |

  Scenario: Edit a partner
    When I update a partner's details
    Then the changes are saved

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
    And each tile shows at least name (and logo thumbnail when present)
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
