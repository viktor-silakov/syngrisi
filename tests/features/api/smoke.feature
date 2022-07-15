@Pending
Feature: Smoke VRS API

    Background:
        Given I clear Database and stop Server
        Given I start VRS server
        Given I setup VRS driver

    Scenario: New test
        When I send "post" request to "http://<serverDomain>:<serverPort>/tests" with:
        """
        form:
          name: Test VRS API Smoke
          status: passed
          viewport: 1x1
          browser: chrome
          os: MacOs
        """

        When I expect the "post" response with:
        """
        statusCode: 200
        json:
          name: Test VRS API Smoke
          status: passed
          browserName: chrome
          viewport: 1x1
          os: MacOs
          blinking: 0
        """

    Scenario: Check Phase 1
        When I create via http new VRS Test with:
          """
            url: http://<serverDomain>:<serverPort>/tests
            params:
              name: Test Check Phase 1
              status: passed
              viewport: 1x1
              browser: chrome
              os: MacOs
          """
        Given I generate a random image "./files/randomImg.png"
        Given I create via http new VRS Check with:
          """
            url: http://<serverDomain>:<serverPort>/checks
            hashFilePath: ./files/randomImg.png
            params:
              testname: Test Check Phase 1
              name: check phase1
              viewport: 10x10
              browserName: firefox
              os: MacOs
              suitename: VRS API - Check
              appname: Test Api App
          """
        When I expect the "VRSCheck" response with:
        """
          statusCode: 206
          json:
            status: requiredFileData
            message: cannot found an image with this hashcode, please add image file data and resend request
        """

    Scenario: Check Phase 1-2

        When I create via http new VRS Test with:
          """
            url: http://<serverDomain>:<serverPort>/tests
            params:
              name: Test Check Phase 1-2
              status: passed
              viewport: 1x1
              browser: chrome
              os: MacOs
          """
        Given I generate a random image "./files/randomImg.png"
        Given I create via http new VRS Check with:
          """
            url: http://<serverDomain>:<serverPort>/checks
            hashFilePath: ./files/randomImg.png
            params:
              testname: Test Check Phase 1-2
              name: check phase12
              viewport: 10x10
              browserName: firefox
              os: MacOs
              suitename: VRS API - Check
              appname: Test Api App
          """
        Given I create via http new VRS Check with:
          """
            url: http://<serverDomain>:<serverPort>/checks
            hashFilePath: ./files/randomImg.png
            file: ./files/randomImg.png
            params:
              testname: Test Check Phase 1-2
              name: check phase12
              viewport: 10x10
              browserName: firefox
              os: MacOs
              suitename: VRS API - Check
              appname: Test Api App
          """
        When I expect the "VRSCheck" response with:
        """
          statusCode: 200
          json:
            status:
              - new
            name: check phase12
            browserName: firefox
            os: MacOs
        """

    Scenario: Check Phase 1-2 - already exist with different test name
    # this section is needed to create snapshoot with test with other name
        When I create via http new VRS Test with:
          """
            url: http://<serverDomain>:<serverPort>/tests
            params:
              name: Test Check Phase 1-2 already exist - 1
              status: passed
              viewport: 1x1
              browser: chrome
              os: MacOs
          """
        Given I generate a random image "./files/randomImg.png"
        Given I create via http new VRS Check with:
          """
            url: http://<serverDomain>:<serverPort>/checks
            hashFilePath: ./files/randomImg.png
            params:
              testname: Test Check Phase 1-2 already exist - 1
              name: check phase12 ae-1
              viewport: 10x10
              browserName: firefox
              browserVersion: 11
              browserFullVersion: 11.01.01
              os: MacOs
              suitename: VRS API - Check
              appname: Test Api App
          """

        When I expect the "VRSCheck" response with:
        """
          statusCode: 206
          json:
            status: requiredFileData
            message: cannot found an image with this hashcode, please add image file data and resend request
        """

        Given I create via http new VRS Check with:
          """
            url: http://<serverDomain>:<serverPort>/checks
            hashFilePath: ./files/randomImg.png
            file: ./files/randomImg.png
            params:
              testname: Test Check Phase 1-2 already exist - 1
              name: check phase12 ae-1
              viewport: 10x10
              browserName: firefox
              browserVersion: 11
              browserFullVersion: 11.01.01
              os: MacOs
              suitename: VRS API - Check
              appname: Test Api App
          """
        When I expect the "VRSCheck" response with:
        """
          statusCode: 200
          json:
            status:
              - new
            name: check phase12 ae-1
            browserName: firefox
            os: MacOs
        """

        # Main section

        When I create via http new VRS Test with:
          """
            url: http://<serverDomain>:<serverPort>/tests
            params:
              name: Test Check Phase 1-2 already exist - 2
              status: passed
              viewport: 1x1
              browser: chrome
              os: MacOs
          """

        When I create via http new VRS Check with:
          """
            url: http://<serverDomain>:<serverPort>/checks
            hashFilePath: ./files/randomImg.png
            params:
              testname: Test Check Phase 1-2 already exist - 2
              name: check phase12 ae-2
              viewport: 10x10
              browserName: firefox
              browserVersion: 11
              browserFullVersion: 11.01.01
              os: MacOs
              suitename: VRS API - Check
              appname: Test Api App
          """

        When I expect the "VRSCheck" response with:
        """
          statusCode: 200
          json:
            status:
              - new
            name: check phase12 ae-2
            browserName: firefox
            os: MacOs
        """
