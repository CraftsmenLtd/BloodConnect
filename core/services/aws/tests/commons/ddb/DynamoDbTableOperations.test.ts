import DynamoDbTableOperations from '../../../commons/ddb/DynamoDbTableOperations'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { UserDTO } from '@commons/dto/UserDTO'
import UserModel, { UserFields } from '@application/technicalImpl/dbModels/UserModel'
import DatabaseError from '@commons/libs/errors/DatabaseError'
import { GENERIC_CODES } from '@commons/libs/constants/GenericCodes'

const ddbMock = mockClient(DynamoDBDocumentClient)

describe('DynamoDbTableOperations Tests', () => {
  let dynamoDbOperations: DynamoDbTableOperations<UserDTO, any, UserModel>

  const mockUserDto: UserDTO = {
    id: '12345',
    email: 'ebrahim@example.com',
    name: 'Ebrahim',
    phone: '1234567890',
    registrationDate: new Date('2023-09-16T12:00:00Z')
  }

  const mockDbFields: UserFields = {
    pk: 'USER#12345',
    sk: 'PROFILE',
    email: 'ebrahim@example.com',
    name: 'Ebrahim',
    phone: '1234567890',
    createdAt: '2023-09-16T12:00:00Z'
  }

  beforeEach(() => {
    ddbMock.reset()
    process.env.DYNAMODB_TABLE_NAME = 'TestTable'
    dynamoDbOperations = new DynamoDbTableOperations(new UserModel())

    jest.spyOn(UserModel.prototype, 'fromDto').mockReturnValue(mockDbFields)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should create an item in DynamoDB successfully', async() => {
    const mockPutResponse = { $metadata: { httpStatusCode: 200 } }
    ddbMock.on(PutCommand).resolves(mockPutResponse)

    const createdItem = await dynamoDbOperations.create(mockUserDto)

    expect(createdItem).toEqual(mockUserDto)
    expect(ddbMock.calls()).toHaveLength(1)

    expect(UserModel.prototype.fromDto).toHaveBeenCalledWith(mockUserDto)
  })

  test('should throw an error when DynamoDB fails to create an item', async() => {
    const mockPutResponse = { $metadata: { httpStatusCode: 500 } }
    ddbMock.on(PutCommand).resolves(mockPutResponse)

    await expect(dynamoDbOperations.create(mockUserDto)).rejects.toThrow(
      'Failed to create item in DynamoDB. property "putCommandOutput.Attributes" is undefined'
    )

    expect(ddbMock.calls()).toHaveLength(1)
  })

  test('should throw error when DynamoDB table name is not defined', () => {
    delete process.env.DYNAMODB_TABLE_NAME
    expect(() => dynamoDbOperations.getTableName()).toThrow(
      new DatabaseError('DDB Table name not defined', GENERIC_CODES.ERROR)
    )
  })

  test('should return the correct table name from the environment', () => {
    const tableName = dynamoDbOperations.getTableName()
    expect(tableName).toBe('TestTable')
  })
})
