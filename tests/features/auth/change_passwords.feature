Feature: Change Password

    Background:
        When I set window size: "1050x768"
        Given I clear Database and stop Server
        When I set env variables:
        """
          SYNGRISI_TEST_MODE: 1
          SYNGRISI_AUTH: 0
        """
        Given I start Server
        When I create via http test user
        When I stop Server

        When I set env variables:
        """
        SYNGRISI_TEST_MODE: 0
        SYNGRISI_AUTH: 1
        """
        Given I start Server and start Driver

        # crate user
        When I login via http with user:"Test" password "123"
        When I create via http user as:"Test" with params:
        """
        {
            "username": "j_doe@gmail.com",
            "firstName": "John",
            "lastName": "Doe",
            "role": "user",
            "password": "Password-123"
        }
        """

        # prepare servers
        Given I stop Server
        When I set env variables:
        """
        SYNGRISI_TEST_MODE: 0
        SYNGRISI_AUTH: 1
        """
        Given I start Server and start Driver

        # login
        When I login with user:"j_doe@gmail.com" password "Password-123"
        Then I wait on element "*=JD" to be displayed

    @smoke
    Scenario: Change Password - Smoke
        # change password
        When I go to "change_password" page
        When I set "Password-123" to the inputfield "#current-password"
        When I set "Password-456" to the inputfield "#new-password"
        When I set "Password-456" to the inputfield "#new-password-confirmation"
        When I click on the element "#change-password"
        When I wait for "2" seconds
        Then I expect the url to contain "auth/changeSuccess"
        Then I expect that element "h1=Success!" is displayed

        # login with new password
        When I go to "logout" page
        When I wait for "2" seconds
        When I login with user:"j_doe@gmail.com" password "Password-456"
        Then I wait on element "*=JD" to be displayed

    Scenario: Change Password - User not Logged In
        When I go to "logout" page
        When I wait for "5" seconds
#        Then I expect the url to contain "logout"

        When I go to "change_password" page
        When I set "Password-123" to the inputfield "#current-password"
        When I set "Password-456" to the inputfield "#new-password"
        When I set "Password-456" to the inputfield "#new-password-confirmation"
        When I click on the element "#change-password"
        Then I expect that element "#error-message" contain text "user is not logged in"

    Scenario: Change Password - Wrong Current Password
        When I go to "change_password" page
        When I set "WRONG-123" to the inputfield "#current-password"
        When I set "Password-456" to the inputfield "#new-password"
        When I set "Password-456" to the inputfield "#new-password-confirmation"
        When I click on the element "#change-password"
        Then I expect the url to not contain "auth/changeSuccess"
        Then I expect that element "#error-message" contain text "IncorrectPasswordError: Password or username is incorrect"

    Scenario: Change Password - Validation
        When I go to "change_password" page

        Then I expect that the element "#current-password" to have attribute "required"
        Then I expect that the element "#new-password" to have attribute "required"
        Then I expect that the element "#new-password-confirmation" to have attribute "required"

        Then I expect that the css attribute "color" from element "#include-six-chars" is "rgba(250,82,82,1)"
        Then I expect that the css attribute "color" from element "#include-numbers" is "rgba(250,82,82,1)"
        Then I expect that the css attribute "color" from element "#include-lowercase" is "rgba(250,82,82,1)"
        Then I expect that the css attribute "color" from element "#include-uppercase" is "rgba(250,82,82,1)"
        Then I expect that the css attribute "color" from element "#include-special" is "rgba(250,82,82,1)"

        When I set "1" to the inputfield "#new-password"
        Then I expect that the css attribute "color" from element "#include-six-chars" is "rgba(250,82,82,1)"
        Then I expect that the css attribute "color" from element "#include-numbers" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-lowercase" is "rgba(250,82,82,1)"
        Then I expect that the css attribute "color" from element "#include-uppercase" is "rgba(250,82,82,1)"
        Then I expect that the css attribute "color" from element "#include-special" is "rgba(250,82,82,1)"

        When I set "123456" to the inputfield "#new-password"
        Then I expect that the css attribute "color" from element "#include-six-chars" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-numbers" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-lowercase" is "rgba(250,82,82,1)"
        Then I expect that the css attribute "color" from element "#include-uppercase" is "rgba(250,82,82,1)"
        Then I expect that the css attribute "color" from element "#include-special" is "rgba(250,82,82,1)"

        When I set "123456a" to the inputfield "#new-password"
        Then I expect that the css attribute "color" from element "#include-six-chars" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-numbers" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-lowercase" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-uppercase" is "rgba(250,82,82,1)"
        Then I expect that the css attribute "color" from element "#include-special" is "rgba(250,82,82,1)"

        When I set "123456aA" to the inputfield "#new-password"
        Then I expect that the css attribute "color" from element "#include-six-chars" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-numbers" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-lowercase" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-uppercase" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-special" is "rgba(250,82,82,1)"

        When I set "123456aA-" to the inputfield "#new-password"
        Then I expect that the css attribute "color" from element "#include-six-chars" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-numbers" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-lowercase" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-uppercase" is "rgba(18,184,134,1)"
        Then I expect that the css attribute "color" from element "#include-special" is "rgba(18,184,134,1)"

        When I set "123" to the inputfield "#current-password"
        When I set "123" to the inputfield "#new-password-confirmation"
        When I click on the element "#change-password"
        Then the element "//*[@id='new-password-confirmation']/../../following-sibling::*" contains the text "New password and password confirmation must be match"




