import postConfirmationLambda from '../../../../user/cognitoTrigger/lambdas/postConfirmationTrigger'
import { UserService } from '../../../../../../application/userWorkflow/UserService'
import DynamoDbTableOperations from '../../../../commons/ddbOperations/DynamoDbTableOperations'
import { mockDynamoDbOperations } from '../../../mock/dynamoDbMocks'
import { mockUserWithStringId } from '../../../../../../application/tests/mocks/mockUserData'
import { updateCognitoUserInfo } from '../../../../commons/cognito/CognitoOperations'
import { sendAppUserWelcomeMail } from '../../../../commons/ses/sesOperations'
import { GenericMessage } from '../../../../../../../commons/dto/MessageDTO'
import { createPostConfirmationEvent } from '../../../mock/cognitoEventMocks'

jest.mock('../../../../../../application/userWorkflow/UserService')
jest.mock('../../../../commons/ddbOperations/DynamoDbTableOperations')
jest.mock('../../../../commons/cognito/CognitoOperations')
jest.mock('../../../../commons/ses/sesOperations')

describe('postConfirmationLambda Tests', () => {
  const mockDynamoDbTableOperations = mockDynamoDbOperations
  const mockEmailContent: GenericMessage = {
    title: 'Welcome',
    content: 'Welcome content'
  }

  beforeEach(() => {
    (DynamoDbTableOperations as jest.Mock).mockImplementation(
      () => mockDynamoDbTableOperations
    )
    jest
      .spyOn(UserService.prototype, 'createNewUser')
      .mockResolvedValue(mockUserWithStringId)
    jest
      .spyOn(UserService.prototype, 'getAppUserWelcomeMail')
      .mockReturnValue(mockEmailContent);
    (updateCognitoUserInfo as jest.Mock).mockResolvedValue(undefined);
    (sendAppUserWelcomeMail as jest.Mock).mockResolvedValue(undefined)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return the event unchanged when triggerSource is not PostConfirmation_ConfirmSignUp', async() => {
    const mockEvent = createPostConfirmationEvent(
      'PostConfirmation_ConfirmForgotPassword'
    )

    const result = await postConfirmationLambda(mockEvent)

    expect(UserService.prototype.createNewUser).not.toHaveBeenCalled()
    expect(updateCognitoUserInfo).not.toHaveBeenCalled()
    expect(sendAppUserWelcomeMail).not.toHaveBeenCalled()
    expect(result).toEqual(mockEvent)
  })

  test('should process new user signup successfully', async() => {
    const mockEvent = createPostConfirmationEvent(
      'PostConfirmation_ConfirmSignUp'
    )

    const result = await postConfirmationLambda(mockEvent)

    expect(UserService.prototype.createNewUser).toHaveBeenCalledWith(
      {
        email: mockEvent.request.userAttributes.email,
        name: mockEvent.request.userAttributes.name,
        phoneNumbers: [mockEvent.request.userAttributes.phone_number]
      },
      mockDynamoDbTableOperations
    )

    expect(updateCognitoUserInfo).toHaveBeenCalledWith({
      userPoolId: mockEvent.userPoolId,
      username: mockEvent.userName,
      attributes: {
        'custom:userId': mockUserWithStringId.id.toString()
      }
    })

    expect(UserService.prototype.getAppUserWelcomeMail).toHaveBeenCalledWith(
      mockEvent.request.userAttributes.name
    )
    expect(sendAppUserWelcomeMail).toHaveBeenCalledWith({
      email: mockEvent.request.userAttributes.email,
      emailContent: mockEmailContent
    })

    expect(result).toEqual(mockEvent)
  })

  test('should handle missing optional user attributes', async() => {
    const mockEvent = createPostConfirmationEvent(
      'PostConfirmation_ConfirmSignUp',
      {
        request: {
          userAttributes: {
            email: 'test@example.com'
          }
        }
      }
    )

    const result = await postConfirmationLambda(mockEvent)

    expect(UserService.prototype.createNewUser).toHaveBeenCalledWith(
      {
        email: 'test@example.com',
        name: '',
        phoneNumbers: ['']
      },
      mockDynamoDbTableOperations
    )
    expect(result).toEqual(mockEvent)
  })

  test('should handle errors in user creation', async() => {
    const mockError = new Error('Database error')
    jest
      .spyOn(UserService.prototype, 'createNewUser')
      .mockRejectedValue(mockError)

    const mockEvent = createPostConfirmationEvent(
      'PostConfirmation_ConfirmSignUp'
    )

    await expect(postConfirmationLambda(mockEvent)).rejects.toThrow(
      'Database error'
    )
    expect(updateCognitoUserInfo).not.toHaveBeenCalled()
    expect(sendAppUserWelcomeMail).not.toHaveBeenCalled()
  })

  test('should handle errors in Cognito update', async() => {
    const mockError = new Error('Cognito error');
    (updateCognitoUserInfo as jest.Mock).mockRejectedValue(mockError)

    const mockEvent = createPostConfirmationEvent(
      'PostConfirmation_ConfirmSignUp'
    )

    await expect(postConfirmationLambda(mockEvent)).rejects.toThrow(
      'Cognito error'
    )
    expect(sendAppUserWelcomeMail).not.toHaveBeenCalled()
  })

  test('should handle errors in sending welcome email', async() => {
    const mockError = new Error('Email error');
    (sendAppUserWelcomeMail as jest.Mock).mockRejectedValue(mockError)

    const mockEvent = createPostConfirmationEvent(
      'PostConfirmation_ConfirmSignUp'
    )

    await expect(postConfirmationLambda(mockEvent)).rejects.toThrow(
      'Email error'
    )
  })
})
