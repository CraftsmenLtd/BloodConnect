import customEmailTemplateLambda from '../../../../user/cognitoTrigger/lambdas/customMessageTrigger'
import { UserService } from '@application/userWorkflows/UserService'
import { Callback, Context, CustomMessageTriggerEvent } from 'aws-lambda'
import { customMessageLambdaMockEvent, lambdaMockContext } from '../../../helpers/testHelpers'

jest.mock('@application/userWorkflows/UserService')

describe('customEmailTemplateLambda Tests', () => {
  let mockEvent: CustomMessageTriggerEvent = customMessageLambdaMockEvent
  const mockCallback: Callback<CustomMessageTriggerEvent> = jest.fn()
  const mockContext: Context = lambdaMockContext

  beforeEach(() => {
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
    mockEvent = {
      ...mockEvent,
      triggerSource: 'CustomMessage_SignUp'
    }
    customEmailTemplateLambda(mockEvent, mockContext, mockCallback)

    expect(UserService.prototype.getPostSignUpMessage).toHaveBeenCalledWith('Ebrahim', '123456')
    expect(mockEvent.response.emailSubject).toBe('Welcome to Blood Connect!')
    expect(mockEvent.response.emailMessage).toBe('Hello Ebrahim, please verify your email using code 123456')
    expect(mockCallback).toHaveBeenCalledWith(null, mockEvent)
  })

  test('should generate forgot-password email for CustomMessage_ForgotPassword trigger', () => {
    mockEvent = {
      ...mockEvent,
      triggerSource: 'CustomMessage_ForgotPassword'
    }
    customEmailTemplateLambda(mockEvent, mockContext, mockCallback)

    expect(UserService.prototype.getForgotPasswordMessage).toHaveBeenCalledWith('Ebrahim', '123456')
    expect(mockEvent.response.emailSubject).toBe('Reset your Blood Connect password')
    expect(mockEvent.response.emailMessage).toBe('Hello Ebrahim, please reset your password using code 123456')
    expect(mockCallback).toHaveBeenCalledWith(null, mockEvent)
  })

  test('should do nothing for unsupported triggerSource', () => {
    mockEvent = {
      ...mockEvent,
      triggerSource: 'CustomMessage_AdminCreateUser'
    }
    customEmailTemplateLambda(mockEvent, mockContext, mockCallback)

    expect(UserService.prototype.getPostSignUpMessage).not.toHaveBeenCalled()
    expect(UserService.prototype.getForgotPasswordMessage).not.toHaveBeenCalled()

    expect(mockCallback).toHaveBeenCalledWith(null, mockEvent)
  })
})
