import { UserDTO } from '../../../../../commons/dto/UserDTO'
import DynamoDbTableOperations from '../../commons/ddbOperations/DynamoDbTableOperations'

export const mockDynamoDbOperations: jest.Mocked<DynamoDbTableOperations<UserDTO, any, any>> = {
  create: jest.fn()
} as unknown as jest.Mocked<DynamoDbTableOperations<UserDTO, any, any>>
