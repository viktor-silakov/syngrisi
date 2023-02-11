Feature: Bulk test Delete

    Background:
        Given I clear Database and stop Server
        Given I start Server and start Driver
        When I open the app
        When I clear local storage

    Scenario: Delete 2 tests
        Given I create "2" tests with:
        """
          testName: TestName-$
          checks:
              - checkName: CheckName
        """
        When I go to "index2" page

        When I wait on element "[data-table-test-name=TestName-0]" to be displayed
        When I wait on element "[data-table-test-name=TestName-1]" to be displayed

        When I click on the element "[data-test-checkbox-name=TestName-0]"
        When I click on the element "[data-test-checkbox-name=TestName-1]"
        When I wait on element "[data-test='table-remove-tests']" to be displayed
        When I click on the element "[data-test='table-remove-tests']"
        Then I expect that element ".mantine-Modal-modal" to contain text "Remove selected tests?"
        Then I expect that element ".mantine-Modal-modal" to contain text "Are you sure you want to permanently delete the selected tests?"
        When I wait on element "[data-test='confirm-remove-test-icon']" to be displayed

        When I click on the element "[data-test='confirm-remove-test-icon']"

        When I wait on element "[data-table-test-name=TestName-0]" to not be displayed
        When I wait on element "[data-table-test-name=TestName-1]" to not be displayed

        When I wait on element "[data-table-test-name=TestName-0]" to not be displayed
        When I wait on element "[data-table-test-name=TestName-1]" to not be displayed


