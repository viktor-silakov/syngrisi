@integration
Feature: Regions works properly

  Background:
    Given I clear test VRS database
    Given I kill process which used port: "3001"
    Given I start VRS server with parameters:
    """
      port: 3001
      databaseName: VRSdbTest
      baseLineFolder: ./baselinesTest/
    """
    Given I setup VRS driver with parameters:
    """
      url: "http://vrs:3001/"
    """

    Given I start VRS session with parameters:
    """
      testName: "Region check"
    """
    When I open the url "http://vrs:3001/"
    When I check image with path: "vrs/tests/files/A.png" as "Region"
    Then the "check" "status" should be "new"

    When I stop VRS session

  Scenario: Create Region without saving
    When I open the url "http://vrs:3001/"
    When I click on "Region check" VRS test
    Then I expect that VRS test "Region check" is unfolded
    When I click on the element "[name=region]"
    When I click on the element "[name=baseline_link]"
    When I execute javascript code:
    """
     return baseline.allRects.length.toString()
    """
    When I wait for "1" seconds
    Then I expect the stored "js" object is equal:
    """
      0
    """

    When I click on the element "[name=add-region]"
    When I execute javascript code:
    """
     return baseline.allRects.length.toString()
    """

    When I wait for "1" seconds
    Then I expect the stored "js" object is equal:
    """
      1
    """

    When I execute javascript code:
    """
     const { left, top, width, height, fill, stroke, opacity } = baseline.getLastRegion()
     return [left, top, width, height, fill, stroke, opacity].toString()
    """
    Then I expect the stored "js" object is equal:
    """
      20,20,200,100,MediumVioletRed,rgba(100,200,200,0.5),0.5
    """

    When I refresh page
    When I execute javascript code:
    """
     return baseline.allRects.length.toString()
    """

    When I wait for "1" seconds
    Then I expect the stored "js" object is equal:
    """
      0
    """

  Scenario: Create Region with saving
    When I open the url "http://vrs:3001/"
    When I click on "Region check" VRS test
    Then I expect that VRS test "Region check" is unfolded
    When I click on the element "[name=region]"
    When I click on the element "[name=baseline_link]"

    When I click on the element "[name=add-region]"
    When I execute javascript code:
    """
     return baseline.allRects.length.toString()
    """
    When I wait for "1" seconds
    Then I expect the stored "js" object is equal:
    """
      1
    """

    When I execute javascript code:
    """
     const { left, top, width, height, fill, stroke, opacity } = baseline.getLastRegion()
     return [left, top, width, height, fill, stroke, opacity].toString()
    """
    Then I expect the stored "js" object is equal:
    """
      20,20,200,100,MediumVioletRed,rgba(100,200,200,0.5),0.5
    """

    When I click on the element "[name=save-snapshot]"

    When I refresh page
    When I execute javascript code:
    """
     return baseline.allRects.length.toString()
    """
    When I wait for "1" seconds
    Then I expect the stored "js" object is equal:
    """
      1
    """

    When I execute javascript code:
    """
     const { left, top, width, height, fill, stroke, opacity } = baseline.getLastRegion()
     return [Math.round(left), Math.round(top), Math.round(width), Math.round(height), fill, stroke, opacity].toString()
    """
    Then I expect the stored "js" object is equal:
    """
      20,20,200,100,MediumVioletRed,rgba(100,200,200,0.5),0.5
    """


  Scenario: Create Region with saving after change position
    When I open the url "http://vrs:3001/"
    When I click on "Region check" VRS test
    Then I expect that VRS test "Region check" is unfolded
    When I click on the element "[name=region]"
    When I click on the element "[name=baseline_link]"

    When I click on the element "[name=add-region]"
    When I execute javascript code:
    """
     return baseline.allRects.length.toString()
    """
    Then I expect the stored "js" object is equal:
    """
      1
    """

    When I execute javascript code:
    """
     const { left, top, width, height, fill, stroke, opacity } = baseline.getLastRegion()
     return [left, top, width, height, fill, stroke, opacity].toString()
    """
    Then I expect the stored "js" object is equal:
    """
      20,20,200,100,MediumVioletRed,rgba(100,200,200,0.5),0.5
    """

    When I execute javascript code:
    """
      baseline.getLastRegion().left = 300
      baseline.getLastRegion().top = 500
      baseline.canvas.renderAll()
      const { left, top, width, height, fill, stroke, opacity } = baseline.getLastRegion()
      return [Math.round(left), Math.round(top), Math.round(width), Math.round(height), fill, stroke, opacity].toString()
    """
    Then I expect the stored "js" object is equal:
    """
      300,500,200,100,MediumVioletRed,rgba(100,200,200,0.5),0.5
    """

    When I click on the element "[name=save-snapshot]"

    When I refresh page
    When I execute javascript code:
    """
     return baseline.canvas.getObjects().filter(x=>x.name==='ignore_rect').length.toString()
    """
    Then I expect the stored "js" object is equal:
    """
      1
    """

    When I execute javascript code:
    """
     const { left, top, width, height, fill, stroke, opacity } = baseline.getLastRegion()
     console.log(baseline.getLastRegion())
     console.log(baseline.getLastRegion())
     console.log(baseline.getLastRegion())
     return [Math.round(left), Math.round(top), Math.round(width), Math.round(height), fill, stroke, opacity].toString()
    """
    Then I expect the stored "js" object is equal:
    """
      300,500,200,100,MediumVioletRed,rgba(100,200,200,0.5),0.5
    """

  Scenario: Create Region with saving - two regiona
    When I open the url "http://vrs:3001/"
    When I click on "Region check" VRS test
    Then I expect that VRS test "Region check" is unfolded
    When I click on the element "[name=region]"
    When I click on the element "[name=baseline_link]"

    When I click on the element "[name=add-region]"
    When I click on the element "[name=add-region]"
    When I click on the element "[name=save-snapshot]"

    When I refresh page
    When I execute javascript code:
    """
     return baseline.canvas.getObjects().filter(x=>x.name==='ignore_rect').length.toString()
    """
    When I wait for "1" seconds
    Then I expect the stored "js" object is equal:
    """
      2
    """
