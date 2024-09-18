// import DynamoDbTableOperations from '../../../commons/ddb/DynamoDbTableOperations'
// import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
// import { mockClient } from 'aws-sdk-client-mock' // For mocking DynamoDB Document Client
// import { UserDTO } from '@commons/dto/UserDTO'
// import UserModel, { UserFields } from '@application/technicalImpl/dbModels/UserModel' // Example UserModel (ModelAdapter)
// // import DatabaseError from '@commons/libs/errors/DatabaseError'
// // import { GenericCodes } from '@commons/libs/constants/GenericCodes'

// const ddbMock = mockClient(DynamoDBDocumentClient)

// describe('DynamoDbTableOperations Tests', () => {
//   let dynamoDbOperations: DynamoDbTableOperations<UserDTO, any, UserModel>

//   const mockUserDto: UserDTO = {
//     id: '12345',
//     email: 'test@example.com',
//     name: 'John Doe',
//     phone: '1234567890',
//     registrationDate: new Date('2023-09-16T12:00:00Z')
//   }

//   const mockDbFields: UserFields = {
//     pk: 'USER#12345',
//     sk: 'PROFILE',
//     email: 'test@example.com',
//     name: 'John Doe',
//     phone: '1234567890',
//     createdAt: '2023-09-16T12:00:00Z'
//   }

//   beforeEach(() => {
//     ddbMock.reset()
//     process.env.DYNAMODB_TABLE_NAME = 'TestTable'
//     dynamoDbOperations = new DynamoDbTableOperations(new UserModel())

//     jest.spyOn(UserModel.prototype, 'fromDto').mockReturnValue(mockDbFields)
//     // jest.spyOn(UserModel.prototype, 'toDto').mockReturnValue(mockUserDto)
//   })

//   afterEach(() => {
//     jest.clearAllMocks()
//   })

//   test('should create an item in DynamoDB successfully', async() => {
//     const mockPutResponse = { $metadata: { httpStatusCode: 200 } }
//     ddbMock.on(PutCommand).resolves(mockPutResponse)

//     const createdItem = await dynamoDbOperations.create(mockUserDto)

//     expect(createdItem).toEqual(mockUserDto)
//     expect(ddbMock.calls()).toHaveLength(1)

//     expect(UserModel.prototype.fromDto).toHaveBeenCalledWith(mockUserDto)
//     // expect(UserModel.prototype.toDto).toHaveBeenCalledWith(mockDbFields)
//   })

//   test('should return the correct table name from the environment', () => {
//     const tableName = dynamoDbOperations.getTableName()
//     expect(tableName).toBe('TestTable')
//   })
// })
