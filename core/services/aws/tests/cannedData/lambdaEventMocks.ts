import type { CustomMessageTriggerEvent, PostConfirmationTriggerEvent, Context } from 'aws-lambda'

export const postConfirmationLambdaMockEvent: PostConfirmationTriggerEvent = {
  triggerSource: 'PostConfirmation_ConfirmSignUp',
  request: {
    userAttributes: {
      email: 'ebrahim@example.com',
      name: 'Ebrahim',
      phone_number: '1234567890'
    }
  },
  response: {},
  region: 'us-east-1',
  userPoolId: 'us-east-1_123456',
  callerContext: {
    awsSdkVersion: '1',
    clientId: 'abc123'
  },
  version: '1',
  userName: 'ebrahim@example.com'
}

export const customMessageLambdaMockEvent: CustomMessageTriggerEvent = {
  triggerSource: 'CustomMessage_SignUp',
  request: {
    userAttributes: {
      name: 'Ebrahim'
    },
    codeParameter: '123456',
    usernameParameter: '',
    clientMetadata: {},
    linkParameter: ''
  },
  response: {
    emailSubject: '',
    emailMessage: '',
    smsMessage: ''
  },
  region: 'us-east-1',
  userPoolId: 'us-east-1_123456',
  callerContext: {
    awsSdkVersion: '1',
    clientId: 'abc123'
  },
  version: '1',
  userName: 'ebrahim@example.com'
}

export const lambdaMockContext: Context = {
  callbackWaitsForEmptyEventLoop: false,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
  memoryLimitInMB: '128',
  awsRequestId: '1234567890',
  logGroupName: '/aws/lambda/test-function',
  logStreamName: '2023/01/01/[$LATEST]12345678901234567890',
  getRemainingTimeInMillis: jest.fn(),
  done: jest.fn(),
  fail: jest.fn(),
  succeed: jest.fn()
}
