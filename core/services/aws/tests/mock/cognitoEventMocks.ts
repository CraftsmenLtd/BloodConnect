import { PostConfirmationTriggerEvent, PostAuthenticationTriggerEvent } from 'aws-lambda'

export const createPostConfirmationEvent = (
  triggerSource: 'PostConfirmation_ConfirmSignUp' | 'PostConfirmation_ConfirmForgotPassword',
  overrides: Partial<PostConfirmationTriggerEvent> = {}
): PostConfirmationTriggerEvent => ({
  version: '1',
  region: 'us-east-1',
  userPoolId: 'us-east-1_123456789',
  userName: 'testuser',
  callerContext: {
    awsSdkVersion: '1.0',
    clientId: 'TEST_CLIENT_ID'
  },
  triggerSource,
  request: {
    userAttributes: {
      email: 'test@example.com',
      name: 'Test User',
      phone_number: '+1234567890'
    },
    clientMetadata: {}
  },
  response: {},
  ...overrides
})

export const createPostAuthenticationEvent = (
  overrides: Partial<PostAuthenticationTriggerEvent> = {}
): PostAuthenticationTriggerEvent => ({
  version: '1',
  region: 'us-east-1',
  userPoolId: 'us-east-1_123456789',
  userName: 'testuser',
  callerContext: {
    awsSdkVersion: '1.0',
    clientId: 'TEST_CLIENT_ID'
  },
  triggerSource: 'PostAuthentication_Authentication',
  request: {
    userAttributes: {
      email: 'test@example.com',
      name: 'Test User',
      'custom:userId': 'user123'
    },
    clientMetadata: {},
    newDeviceUsed: false
  },
  response: {},
  ...overrides
})
