import type { UserDTO } from '../../../../../commons/dto/UserDTO'
import type DynamoDbTableOperations from '../../commons/ddbOperations/DynamoDbTableOperations'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mockDynamoDbOperations: jest.Mocked<DynamoDbTableOperations<UserDTO, any, any>> = {
  create: jest.fn()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as unknown as jest.Mocked<DynamoDbTableOperations<UserDTO, any, any>>
