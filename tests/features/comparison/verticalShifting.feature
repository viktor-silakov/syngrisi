@visual @comparison @shifting
Feature: Vertical Shifting
  Background:
    Given I clear test VRS database
    Given I kill process which used port: "3001"
    When I set env variables:
    """
    V_SHIFTING:1
    """
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

  Scenario: Down-Up 1 pix
    Down-Up - because before make a comparison we crop bottom pixels of baseline and top pixels of actual image

    Given I start VRS session with parameters:
    """
      testName: Down-Up
      suiteName: Vertical Shifting
    """
    When I open the url "http://localhost:3001/static/shift.html"
    When I visually assert page as "Top - Down Shifting"
    When I stop VRS session

    Given I start VRS session with parameters:
    """
      testName: Down-Up
      suiteName: Vertical Shifting
    """
    When I open the url "http://localhost:3001/static/shift.html"
    When I execute javascript code:
    """
    document.getElementById('rectangle').style['margin-top']='1px'
    """
    When I visually assert page as "Top - Down Shifting"
    When I stop VRS session

  Scenario: Up-Down 1 pix
   Up-Down - because before make a comparison we crop top pixels of baseline and bottom pixels of actual image

    Given I start VRS session with parameters:
    """
      testName: Down-Up
      suiteName: Vertical Shifting
    """
    When I open the url "http://localhost:3001/static/shift.html"
    When I execute javascript code:
    """
    document.getElementById('rectangle').style['margin-top']='1px'
    """

    Then I visually assert page as "Top - Down Shifting"
    When I stop VRS session

    Given I start VRS session with parameters:
    """
      testName: Down-Up
      suiteName: Vertical Shifting
    """
    When I open the url "http://localhost:3001/static/shift.html"

    Then I visually assert page as "Top - Down Shifting"
    When I stop VRS session

