@integration
Feature: Create User

    Background:
        Given I clear Database and stop Server
        When I set env variables:
        """
        TEST: 1
        SYNGRISI_AUTH: 0
        """
        Given I start VRS server with parameters:
        """
        port: 3001
        databaseName: VRSdbTest
        baseLineFolder: ./baselinesTest/
        """
        When I open the url "http://vrs:3001/loadTestUser"
        Given I kill process which used port: "3001"

        When I set env variables:
        """
        TEST: 0
        SYNGRISI_AUTH: 1
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
        When I login with user:"Test" password "123"
        Then I wait on element "*=TA" to be displayed

    @smoke
    Scenario: Create User - Success
        When I open the url "http://vrs:3001/admin?task=users"
        When I wait for "3" seconds
        When I click on the element "#add-user"
        When I set "i_ivanov@gmail.com" to the inputfield "//input[@placeholder='Username']"
        When I set "Ivan" to the inputfield "//input[@placeholder='First Name']"
        When I set "Ivanov" to the inputfield "//input[@placeholder='Last Name']"
        When I select the option with the text "user" for element "//select[@new-user-role]"
        When I set "Password-123" to the inputfield "//input[@placeholder='password']"
        When I click on the element "a.send-new-user-button"
        When I wait for "3" seconds
        When I refresh page
        When I wait for "3" seconds
        Then I expect that element "//input[@name='username' and @value='i_ivanov@gmail.com']/../..//input[@name='firstName' and @value='Ivan']/../..//input[@name='lastName' and @value='Ivanov']" is displayed

    Scenario: Create User - Duplicate
        When I open the url "http://vrs:3001/admin?task=users"
        When I wait for "3" seconds
        When I click on the element "#add-user"
        When I set "i_ivanov@gmail.com" to the inputfield "//input[@placeholder='Username']"
        When I set "Ivan" to the inputfield "//input[@placeholder='First Name']"
        When I set "Ivanov" to the inputfield "//input[@placeholder='Last Name']"
        When I select the option with the text "user" for element "//select[@new-user-role]"
        When I set "Password-123" to the inputfield "//input[@placeholder='password']"
        When I click on the element "a.send-new-user-button"
        When I wait for "3" seconds
        When I refresh page
        When I wait for "3" seconds
        Then I expect that element "//input[@name='username' and @value='i_ivanov@gmail.com']/../..//input[@name='firstName' and @value='Ivan']/../..//input[@name='lastName' and @value='Ivanov']" is displayed

        When I click on the element "#add-user"
        When I set "i_ivanov@gmail.com" to the inputfield "//input[@placeholder='Username']"
        When I set "Ivan" to the inputfield "//input[@placeholder='First Name']"
        When I set "Ivanov" to the inputfield "//input[@placeholder='Last Name']"
        When I select the option with the text "user" for element "//select[@new-user-role]"
        When I set "Password-123" to the inputfield "//input[@placeholder='password']"
        When I click on the element "a.send-new-user-button"
        When I wait for "3" seconds
        When I refresh page
        When I wait for "3" seconds
        Then I expect that element "//input[@name='username' and @value='i_ivanov@gmail.com']/../..//input[@name='firstName' and @value='Ivan']/../..//input[@name='lastName' and @value='Ivanov']" does appear exactly "1" times

    Scenario: Create User - without Password
        When I open the url "http://vrs:3001/admin?task=users"
        When I wait for "3" seconds
        When I click on the element "#add-user"
        When I set "p_petrov@gmail.com" to the inputfield "//input[@placeholder='Username']"
        When I set "Petr" to the inputfield "//input[@placeholder='First Name']"
        When I set "Petrov" to the inputfield "//input[@placeholder='Last Name']"
        When I select the option with the text "user" for element "//select[@new-user-role]"
        When I click on the element "a.send-new-user-button"
        When I wait for "3" seconds
        When I refresh page
        When I wait for "3" seconds
        Then I expect that element "//input[@name='username' and @value='p_petrov@gmail.com']/../..//input[@name='firstName' and @value='Petr']/../..//input[@name='lastName' and @value='Petrov']" is displayed

    Scenario: Create User - without Username
        When I open the url "http://vrs:3001/admin?task=users"
        When I wait for "3" seconds
        When I click on the element "#add-user"
        When I set "Petr" to the inputfield "//input[@placeholder='First Name']"
        When I set "Petrov" to the inputfield "//input[@placeholder='Last Name']"
        When I select the option with the text "user" for element "//select[@new-user-role]"
        When I click on the element "a.send-new-user-button"
        When I wait for "3" seconds
        When I refresh page
        When I wait for "3" seconds
        Then I expect that element "//input[@name='username']/../..//input[@name='firstName' and @value='Petr']/../..//input[@name='lastName' and @value='Petrov']" is not displayed
