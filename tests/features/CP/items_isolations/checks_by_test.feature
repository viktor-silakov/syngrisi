Feature: Checks Isolation by Test
    Every checks are related to one test.
    Each test should contain only it checks and no extra checks

    Background:
        Given I clear Database and stop Server
        Given I start Server and start Driver
        When I open the app
        When I clear local storage
        Given I create "2" tests with:
        """
          testName: TestName-1
          checks:
              - checkName: CheckName-1.1
              - checkName: CheckName-1.2
        """
        Given I create "2" tests with:
        """
          testName: TestName-2
          checks:
              - checkName: CheckName-2.1
              - checkName: CheckName-2.2
        """

    Scenario: Checks Isolation by Test
        When I go to "main" page
        When I wait on element "[data-table-test-name=TestName-1]" to be displayed
        When I click on the element "[data-table-test-name=TestName-1]"

        Then I wait on element "[data-table-check-name='CheckName-1.1']" to be displayed
        Then I wait on element "[data-table-check-name='CheckName-1.2']" to be displayed

        Then I wait on element "[data-table-check-name='CheckName-2.1']" to not be displayed
        Then I wait on element "[data-table-check-name='CheckName-2.2']" to not be displayed

        When I click on the element "[data-table-test-name=TestName-2]"

        Then I wait on element "[data-table-check-name='CheckName-2.1']" to be displayed
        Then I wait on element "[data-table-check-name='CheckName-2.2']" to be displayed
