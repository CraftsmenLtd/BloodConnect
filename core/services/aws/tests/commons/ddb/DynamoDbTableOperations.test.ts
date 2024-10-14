import DynamoDbTableOperations from '../../../commons/ddb/DynamoDbTableOperations'
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { UserDTO } from '../../../../../../commons/dto/UserDTO'
import UserModel from '../../../../../application/technicalImpl/dbModels/UserModel'
import DatabaseError from '../../../../../../commons/libs/errors/DatabaseError'
import { GENERIC_CODES } from '../../../../../../commons/libs/constants/GenericCodes'
import { mockUserWithStringId, expectedUser } from '../../../../../application/tests/mocks/mockUserData'

describe('DynamoDbTableOperations Tests', () => {
  const ddbMock = mockClient(DynamoDBDocumentClient)
  const dynamoDbOperations = new DynamoDbTableOperations<UserDTO, any, UserModel>(new UserModel())

  beforeEach(() => {
    ddbMock.reset()
    process.env.DYNAMODB_TABLE_NAME = 'TestTable'
    jest.spyOn(UserModel.prototype, 'fromDto').mockReturnValue(expectedUser)
    jest.spyOn(UserModel.prototype, 'toDto').mockReturnValue(mockUserWithStringId)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should create an item in DynamoDB successfully', async() => {
    const mockPutResponse = { $metadata: { httpStatusCode: 200 } }
    ddbMock.on(PutCommand).resolves(mockPutResponse)

    const createdItem = await dynamoDbOperations.create(mockUserWithStringId)

    expect(createdItem).toEqual(mockUserWithStringId)
    expect(ddbMock.calls()).toHaveLength(1)
    expect(UserModel.prototype.fromDto).toHaveBeenCalledWith(mockUserWithStringId)
  })

  test('should throw an error when DynamoDB fails to create an item', async() => {
    const mockPutResponse = { $metadata: { httpStatusCode: 500 } }
    ddbMock.on(PutCommand).resolves(mockPutResponse)

    await expect(dynamoDbOperations.create(mockUserWithStringId)).rejects.toThrow(
      'Failed to create item in DynamoDB. property "putCommandOutput.Attributes" is undefined'
    )

    expect(ddbMock.calls()).toHaveLength(1)
  })

  test('should update an item in DynamoDB successfully', async() => {
    const mockUpdateResponse = { $metadata: { httpStatusCode: 200 } }
    ddbMock.on(UpdateCommand).resolves(mockUpdateResponse)

    const updatedItem = await dynamoDbOperations.update(mockUserWithStringId)

    expect(updatedItem).toEqual(mockUserWithStringId)
    expect(ddbMock.calls()).toHaveLength(1)
    expect(UserModel.prototype.fromDto).toHaveBeenCalledWith(mockUserWithStringId)
  })

  test('should throw an error when DynamoDB fails to update an item', async() => {
    const mockUpdateResponse = { $metadata: { httpStatusCode: 500 } }
    ddbMock.on(UpdateCommand).resolves(mockUpdateResponse)

    await expect(dynamoDbOperations.update(mockUserWithStringId)).rejects.toThrow(
      'Failed to update item in TestTable. Error: Failed to update item in DynamoDB. HTTP Status Code: 500'
    )

    expect(ddbMock.calls()).toHaveLength(1)
  })

  test('should throw an error when update operation encounters an error', async() => {
    ddbMock.on(UpdateCommand).rejects(new Error('DynamoDB update error'))

    await expect(dynamoDbOperations.update(mockUserWithStringId)).rejects.toThrow(
      'Failed to update item in TestTable. Error: DynamoDB update error'
    )

    expect(ddbMock.calls()).toHaveLength(1)
  })

  test('should fetch an item from DynamoDB successfully', async() => {
    const mockGetResponse = { Item: expectedUser, $metadata: { httpStatusCode: 200 } }
    ddbMock.on(GetCommand).resolves(mockGetResponse)

    const fetchedItem = await dynamoDbOperations.getItem('partitionKey')

    expect(fetchedItem).toEqual(mockUserWithStringId)
    expect(ddbMock.calls()).toHaveLength(1)
    expect(UserModel.prototype.toDto).toHaveBeenCalledWith(expectedUser)
  })

  test('should return null when item is not found in DynamoDB', async() => {
    const mockGetResponse = { Item: undefined, $metadata: { httpStatusCode: 200 } }
    ddbMock.on(GetCommand).resolves(mockGetResponse)

    const fetchedItem = await dynamoDbOperations.getItem('partitionKey')

    expect(fetchedItem).toBeNull()
    expect(ddbMock.calls()).toHaveLength(1)
  })

  test('should throw an error when DynamoDB fails to fetch item', async() => {
    ddbMock.on(GetCommand).rejects(new Error('DynamoDB getItem error'))

    await expect(dynamoDbOperations.getItem('partitionKey')).rejects.toThrow(
      new DatabaseError('Failed to fetch item from DynamoDB', GENERIC_CODES.ERROR)
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
