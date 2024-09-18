import UserModel, { UserFields } from '@application/technicalImpl/dbModels/UserModel'
import { UserDTO } from '@commons/dto/UserDTO'

describe('UserModel Unit Tests', () => {
  let userModel: UserModel

  beforeAll(() => {
    userModel = new UserModel()
  })

  describe('getPrimaryIndex', () => {
    test('should return correct primary index with partitionKey and sortKey', () => {
      const expectedPrimaryIndex = { partitionKey: 'pk', sortKey: 'sk' }
      expect(userModel.getPrimaryIndex()).toEqual(expectedPrimaryIndex)
    })
  })

  describe('getIndexDefinitions', () => {
    test('should return an empty object by default', () => {
      expect(userModel.getIndexDefinitions()).toEqual({})
    })
  })

  describe('getIndex', () => {
    test('should return undefined when indexType or indexName is not defined', () => {
      expect(userModel.getIndex('GSI', 'UserByEmail')).toBeUndefined()
    })
  })

  describe('fromDto', () => {
    test('should transform UserDTO to UserFields correctly', () => {
      const mockUserDto: UserDTO = {
        id: '12345',
        email: 'ebrahim@example.com',
        name: 'Ebrahim',
        phone: '1234567890',
        registrationDate: new Date('2023-09-16T12:00:00Z')
      }

      const expectedUserFields = {
        pk: 'USER#12345',
        sk: 'PROFILE',
        email: 'ebrahim@example.com',
        name: 'Ebrahim',
        phone: '1234567890',
        createdAt: '2023-09-16T12:00:00.000Z'
      }

      expect(userModel.fromDto(mockUserDto)).toEqual(expectedUserFields)
    })

    test('should handle non-string id correctly in fromDto', () => {
      const mockUserDto: UserDTO = {
        id: 12345,
        email: 'test2@example.com',
        name: 'Jane Doe',
        phone: '0987654321',
        registrationDate: new Date('2023-09-17T14:30:00Z')
      }

      const expectedUserFields = {
        pk: 'USER#12345',
        sk: 'PROFILE',
        email: 'test2@example.com',
        name: 'Jane Doe',
        phone: '0987654321',
        createdAt: '2023-09-17T14:30:00.000Z'
      }

      expect(userModel.fromDto(mockUserDto)).toEqual(expectedUserFields)
    })
  })

  describe('toDto', () => {
    test('should transform UserFields to UserDTO correctly', () => {
      const mockUserFields: UserFields = {
        pk: 'USER#12345',
        sk: 'PROFILE',
        email: 'ebrahim@example.com',
        name: 'Ebrahim',
        phone: '1234567890',
        createdAt: '2023-09-16T12:00:00.000Z'
      }

      const expectedUserDto: UserDTO = {
        id: '12345',
        email: 'ebrahim@example.com',
        name: 'Ebrahim',
        phone: '1234567890',
        registrationDate: new Date('2023-09-16T12:00:00Z')
      }

      expect(userModel.toDto(mockUserFields)).toEqual(expectedUserDto)
    })

    test('should handle missing optional fields in UserFields', () => {
      const mockUserFields: UserFields = {
        pk: 'USER#12345',
        sk: 'PROFILE',
        email: 'ebrahim@example.com',
        name: 'Ebrahim',
        phone: '1234567890',
        createdAt: '2023-09-16T12:00:00.000Z'
      }

      const expectedUserDto: UserDTO = {
        id: '12345',
        email: 'ebrahim@example.com',
        name: 'Ebrahim',
        phone: '1234567890',
        registrationDate: new Date('2023-09-16T12:00:00Z')
      }

      expect(userModel.toDto(mockUserFields)).toEqual(expectedUserDto)
    })
  })
})
