Feature: User Registration
  As a user
  I want to register to BloodConnect
  So that I can access it's features

  Scenario Outline: Get the API key
    Given I have the required data to be registered
      | config_file    |
      | user_data.json |
    When I register my self as a bloodconnect "<user>"
    Then I have acquired API key for the "<user>"

    Examples: Users
      | user  |
      | donor |