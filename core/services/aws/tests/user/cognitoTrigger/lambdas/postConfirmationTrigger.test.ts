import postConfirmationLambda from '../../../../user/cognitoTrigger/lambdas/postConfirmationTrigger'
import { PostConfirmationTriggerEvent } from 'aws-lambda'
import { UserService } from '@application/userWorkflows/UserService'
import DynamoDbTableOperations from '../../../../commons/ddb/DynamoDbTableOperations'
import { UserDTO } from '@commons/dto/UserDTO'

jest.mock('@application/userWorkflows/UserService')
jest.mock('../../../../commons/ddb/DynamoDbTableOperations')

describe('postConfirmationLambda Tests', () => {
  let mockEvent: PostConfirmationTriggerEvent
  let mockDynamoDbTableOperations: jest.Mocked<DynamoDbTableOperations<UserDTO, any, any>>

  beforeEach(() => {
    mockEvent = {
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
    } satisfies PostConfirmationTriggerEvent

    mockDynamoDbTableOperations = {
      create: jest.fn()
    } as unknown as jest.Mocked<DynamoDbTableOperations<UserDTO, any, any>>
    ;(DynamoDbTableOperations as jest.Mock).mockImplementation(() => mockDynamoDbTableOperations)

    jest.spyOn(UserService.prototype, 'createNewUser').mockResolvedValue({
      id: 'unique-id',
      email: 'ebrahim@example.com',
      name: 'Ebrahim',
      phone: '1234567890',
      registrationDate: new Date()
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return the event unchanged when triggerSource is not PostConfirmation_ConfirmSignUp', async() => {
    mockEvent.triggerSource = 'PostConfirmation_ConfirmForgotPassword'

    const result = await postConfirmationLambda(mockEvent)

    expect(UserService.prototype.createNewUser).not.toHaveBeenCalled()
    expect(result).toEqual(mockEvent)
  })

  test('should create a new user when triggerSource is PostConfirmation_ConfirmSignUp', async() => {
    const result = await postConfirmationLambda(mockEvent)

    expect(UserService.prototype.createNewUser).toHaveBeenCalledWith(
      {
        email: 'ebrahim@example.com',
        name: 'Ebrahim',
        phone_number: '1234567890'
      },
      mockDynamoDbTableOperations
    )

    expect(result).toEqual(mockEvent)
  })
})
