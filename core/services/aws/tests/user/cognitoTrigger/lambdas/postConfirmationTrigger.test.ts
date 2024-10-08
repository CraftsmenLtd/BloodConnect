import postConfirmationLambda from '../../../../user/cognitoTrigger/lambdas/postConfirmationTrigger'
import { UserService } from '../../../../../../application/userWorkflows/UserService'
import DynamoDbTableOperations from '../../../../commons/ddb/DynamoDbTableOperations'
import { postConfirmationLambdaMockEvent } from '../../../cannedData/lambdaEventMocks'
import { mockDynamoDbOperations } from '../../../mock/dynamoDbMocks'
import { mockUserWithStringId } from '../../../../../../application/tests/mocks/mockUserData'

jest.mock('../../../../../../application/userWorkflows/UserService')
jest.mock('../../../../commons/ddb/DynamoDbTableOperations')

describe('postConfirmationLambda Tests', () => {
  const mockDynamoDbTableOperations = mockDynamoDbOperations

  beforeEach(() => {
    (DynamoDbTableOperations as jest.Mock).mockImplementation(() => mockDynamoDbTableOperations)
    jest.spyOn(UserService.prototype, 'createNewUser').mockResolvedValue(mockUserWithStringId)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should return the event unchanged when triggerSource is not PostConfirmation_ConfirmSignUp', async() => {
    const mockEvent = postConfirmationLambdaMockEvent
    mockEvent.triggerSource = 'PostConfirmation_ConfirmForgotPassword'

    const result = await postConfirmationLambda(mockEvent)
    expect(UserService.prototype.createNewUser).not.toHaveBeenCalled()
    expect(result).toEqual(mockEvent)
  })

  test('should create a new user when triggerSource is PostConfirmation_ConfirmSignUp', async() => {
    const mockEvent = postConfirmationLambdaMockEvent
    mockEvent.triggerSource = 'PostConfirmation_ConfirmSignUp'

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
