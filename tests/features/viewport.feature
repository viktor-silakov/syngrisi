@integration
Feature: VRS Viewport

    Background:
        Given I clear Database and stop Server
        Given I start Server and start Driver

    Scenario: VRS ViewPort - create single check
        When I set env variables:
        """
        RUN_NAME: RUN-01
        """
        Given I set window size: "1366x768"
        Given I start session with parameters:
        """
          testName: "Viewport integration test"
        """
        When I open the url "http://<serverDomain>:<serverPort>/static/app_1.html"
        When I visually check page as "viewport - single check"

        When I stop session

        When I open the app
        When I wait for "2" seconds
        Then I expect that VRS test "Viewport integration test" has "1366x768" viewport
        When I click on "Viewport integration test" VRS test
        Then I expect that VRS test "Viewport integration test" is unfolded
        Then I expect that VRS check "1/1 viewport - single check" has "New" status
        # assert preview
        Then I expect that element "//div[contains(@class, 'preview-overlay-text')]" is clickable
        Then I expect that element "//div[contains(@class, 'preview-overlay-text')]" to have text "1366x768"

    Scenario: VRS ViewPort - two checks with same viewports
        When I set env variables:
        """
        RUN_NAME: RUN-01
        """
        Given I start session with parameters:
        """
          testName: "Viewport integration test"
        """
        Given I set window size: "1366x768"
        When I open the url "http://<serverDomain>:<serverPort>/static/app_1.html"
        When I visually check page as "viewport - two checks same viewports 01"

        When I visually check page as "viewport - two checks same viewports 02"

        When I stop session
        When I open the app

        When I wait for "2" seconds
        Then I expect that VRS test "Viewport integration test" has "1366x768" viewport

    Scenario: VRS ViewPort - two checks with different viewports
        When I set env variables:
        """
        RUN_NAME: RUN-01
        """
        Given I start session with parameters:
        """
          testName: "Viewport integration test"
        """
        Given I set window size: "1366x768"
        When I open the url "http://<serverDomain>:<serverPort>/static/app_1.html"
        When I visually check page as "viewport - two checks same viewports 01"

        Given I set window size: "1050x768"
        When I refresh page
        When I visually check page as "viewport - two checks same viewports 02"

        When I stop session
        When I open the app
        When I wait for "2" seconds

        Then I expect that VRS test "Viewport integration test" has "≠" viewport
