@smoke
Feature: Test Auto Update

    Background:
        Given I clear Database and stop Server
        Given I start Server and start Driver
        When I open the app
        When I clear local storage

    Scenario: Update Table with new Tests
    After the user opens the table, the Application store items timestamp on the open the table moment,
    and then shows the user only items that are older than this timestamp and when the new items continue to arrive,
    the user should see new items counter indicator on the top right corner of the 'Refresh' icon (which will be
    updated every X seconds) and after clicking on the icon, the table will be refreshed with new items.

        When I create "1" tests with:
        """
          testName: "TestName-before"
          checks:
            - filePath: files/A.png
              checkName: CheckName
        """
        When I go to "index2" page
        When I wait on element "[data-table-test-name=TestName-before]" to be displayed

        When I wait for "3" seconds
        When I refresh page
        When I create "3" tests with:
        """
          testName: "TestName-after"
          checks:
            - filePath: files/A.png
              checkName: CheckName
        """
        When I wait for "5" seconds

        Then I expect that element "[data-test='table-refresh-icon-badge']" to contain text "3"
        When I wait on element "[data-table-test-name=TestName-before]" to be displayed

        When I click on the element "[data-test='table-refresh-icon']"
        When I wait for "10" seconds
        When I wait on element "[data-table-test-name=TestName-after]" for 10000ms to be displayed
        Then I expect that element "[data-table-test-name=TestName-after]" does appear exactly "3" times
