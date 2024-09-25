import { PostConfirmationTriggerEvent } from 'aws-lambda'
import DynamoDbTableOperations from '../../commons/ddb/DynamoDbTableOperations'
import { UserDTO } from '@commons/dto/UserDTO'

export const getMockEvent = (): PostConfirmationTriggerEvent => ({
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
})

export const getMockDynamoDbTableOperations = (): jest.Mocked<
DynamoDbTableOperations<UserDTO, any, any>
> => ({
  create: jest.fn()
} as unknown as jest.Mocked<DynamoDbTableOperations<UserDTO, any, any>>)
