@integration
Feature: Regions - Copy regions data after acceptance

    Background:
        Given I clear Database and stop Server
        Given I start Server and start Driver

    Scenario: Regions - Copy regions data after acceptance
        When I create "1" tests with params:
        """
          filePath: files/A.png
          testName: Copy region
          checkName: Check - 1
        """
        When I accept via http the 1st check with name "Check - 1"
        When I open the app
        Then I wait and refresh page on element "span=Copy region - 1" for "3" seconds to exist
        When I click on "Copy region - 1" VRS test
        When I wait for "2" seconds
        When I click on the element "[name=preview-container]"

        # add region, save and check if exists
        When I wait for "2" seconds
#        When I click on the element "[title='baseline snapshoot']"
#        When I wait for "2" seconds
        When I click on the element "#ignore-regions"
        When I wait for "1" seconds

        When I click on the element "#save-baseline"
        When I wait for "2" seconds
        When I refresh page
        When I wait for "2" seconds
        When I execute javascript code:
        """
         return mainView.allRects.length.toString()
        """
        When I wait for "1" seconds
        Then I expect the stored "js" string is equal:
        """
          1
        """

        When I wait for "2" seconds
        When I execute javascript code:
        """

         const { left, top: top1, width, height, fill, stroke, opacity } = mainView.getLastRegion();
         return [Math.round(left), Math.round(top1), Math.round(width), Math.round(height), fill, stroke, opacity].toString();

        """
        Then I expect the stored "js" string is equal:
        """
          20,50,202,102,MediumVioletRed,black,0.5
        """


        # create the second failed test accept via internal diff icon
        When I create "1" tests with params:
        """
          filePath: files/B.png
          testName: Copy region
          checkName: Check - 1
        """

        When I open the app

        When I wait for "3" seconds
        Then I expect that VRS test "Copy region - 1" has "Failed" status

        When I click on "Copy region - 1" VRS test
        When I wait for "1" seconds
        When I click on the element "a.accept-button"
        When I click on the element "a.accept-option"
        When I wait for "1" seconds
        When I accept the confirmbox

        # check if regions was copied to new baseline
        When I click on the element "[name=preview-container]"
        When I wait for "2" seconds
        When I execute javascript code:
        """
         return mainView.allRects.length.toString()
        """
        When I wait for "1" seconds
        Then I expect the stored "js" string is equal:
        """
          1
        """

        When I execute javascript code:
        """
         const { left, top: top1, width, height, fill, stroke, opacity } = mainView.getLastRegion()
         return [Math.round(left), Math.round(top1), Math.round(width), Math.round(height), fill, stroke, opacity].toString()
        """
        Then I expect the stored "js" string is equal:
        """
          20,50,202,102,MediumVioletRed,black,0.5
        """

        # create the third failed test accept via like icon
        When I create "1" tests with params:
        """
          filePath: files/A.png
          testName: Copy region
          checkName: Check - 1
        """

        When I open the app
        When I wait for "3" seconds
        Then I expect that VRS test "Copy region - 1" has "Failed" status

        When I click on "Copy region - 1" VRS test
        When I wait for "1" seconds
        When I click on the element "[name=preview-container]"
        When I wait for "3" seconds
        When I click on the element "#accept-rect"
        When I wait for "1" seconds
        When I accept the confirmbox

        # check if regions was copied to new baseline
        When I wait for "2" seconds
        When I execute javascript code:
        """
         return mainView.allRects.length.toString()
        """
        When I wait for "1" seconds
        Then I expect the stored "js" string is equal:
        """
          1
        """

        When I execute javascript code:
        """
         const { left, top: top1, width, height, fill, stroke, opacity } = mainView.getLastRegion()
         return [Math.round(left), Math.round(top1), Math.round(width), Math.round(height), fill, stroke, opacity].toString()
        """
        Then I expect the stored "js" string is equal:
        """
          20,50,202,102,MediumVioletRed,black,0.5
        """
