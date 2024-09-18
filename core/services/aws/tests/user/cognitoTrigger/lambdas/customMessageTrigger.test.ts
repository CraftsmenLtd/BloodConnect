import customEmailTemplateLambda from '../../../../user/cognitoTrigger/lambdas/customMessageTrigger'
import { UserService } from '@application/userWorkflows/UserService'
import { Callback, Context, CustomMessageTriggerEvent } from 'aws-lambda'

jest.mock('@application/userWorkflows/UserService')

describe('customEmailTemplateLambda Tests', () => {
  let mockEvent: CustomMessageTriggerEvent
  let mockCallback: Callback<CustomMessageTriggerEvent>
  let mockContext: Context

  beforeEach(() => {
    mockEvent = {
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
    } satisfies CustomMessageTriggerEvent
    mockContext = {
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
    } satisfies Context

    mockCallback = jest.fn()

    jest.spyOn(UserService.prototype, 'getPostSignUpMessage').mockReturnValue({
      title: 'Welcome to Blood Connect!',
      content: 'Hello Ebrahim, please verify your email using code 123456'
    })
    jest.spyOn(UserService.prototype, 'getForgotPasswordMessage').mockReturnValue({
      title: 'Reset your Blood Connect password',
      content: 'Hello Ebrahim, please reset your password using code 123456'
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should generate post-signup email for CustomMessage_SignUp trigger', () => {
    mockEvent.triggerSource = 'CustomMessage_SignUp'
    customEmailTemplateLambda(mockEvent, mockContext, mockCallback)

    expect(UserService.prototype.getPostSignUpMessage).toHaveBeenCalledWith('Ebrahim', '123456')
    expect(mockEvent.response.emailSubject).toBe('Welcome to Blood Connect!')
    expect(mockEvent.response.emailMessage).toBe('Hello Ebrahim, please verify your email using code 123456')
    expect(mockCallback).toHaveBeenCalledWith(null, mockEvent)
  })

  test('should generate forgot-password email for CustomMessage_ForgotPassword trigger', () => {
    mockEvent.triggerSource = 'CustomMessage_ForgotPassword'
    customEmailTemplateLambda(mockEvent, mockContext, mockCallback)

    expect(UserService.prototype.getForgotPasswordMessage).toHaveBeenCalledWith('Ebrahim', '123456')
    expect(mockEvent.response.emailSubject).toBe('Reset your Blood Connect password')
    expect(mockEvent.response.emailMessage).toBe('Hello Ebrahim, please reset your password using code 123456')
    expect(mockCallback).toHaveBeenCalledWith(null, mockEvent)
  })

  test('should do nothing for unsupported triggerSource', () => {
    mockEvent.triggerSource = 'CustomMessage_AdminCreateUser'
    customEmailTemplateLambda(mockEvent, mockContext, mockCallback)

    expect(UserService.prototype.getPostSignUpMessage).not.toHaveBeenCalled()
    expect(UserService.prototype.getForgotPasswordMessage).not.toHaveBeenCalled()

    expect(mockCallback).toHaveBeenCalledWith(null, mockEvent)
  })
})
