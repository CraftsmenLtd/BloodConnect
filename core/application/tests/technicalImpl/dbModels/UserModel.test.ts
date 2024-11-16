import UserModel from '../../../Models/dbModels/UserModel'
import { expectedUser, mockUserDetailsWithStringId } from '../../mocks/mockUserData'

describe('UserModel Unit Tests', () => {
  const userModel = new UserModel()

  describe('getPrimaryIndex', () => {
    test('should return correct primary index with partitionKey and sortKey', () => {
      const expectedPrimaryIndex = { partitionKey: 'PK', sortKey: 'SK' }
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
      const resultUser = userModel.fromDto(mockUserDetailsWithStringId)
      const { createdAt: resultCreatedAt, ...resultUserWithoutCreatedAt } = resultUser
      const { createdAt: expectedCreatedAt, ...expectedUserWithoutCreatedAt } = expectedUser

      expect(resultUserWithoutCreatedAt).toEqual(expectedUserWithoutCreatedAt)
    })

    test('should handle non-string id correctly in fromDto', () => {
      const resultUser = userModel.fromDto(mockUserDetailsWithStringId)
      const { createdAt: resultCreatedAt, ...resultUserWithoutCreatedAt } = resultUser
      const { createdAt: expectedCreatedAt, ...expectedUserWithoutCreatedAt } = expectedUser

      expect(resultUserWithoutCreatedAt).toEqual(expectedUserWithoutCreatedAt)
    })
  })

  describe('toDto', () => {
    test('should transform UserFields to UserDTO correctly', () => {
      const mockUserFields = { ...expectedUser }
      const expectedUserDto = { ...mockUserDetailsWithStringId }
      expect(userModel.toDto(mockUserFields)).toEqual(expectedUserDto)
    })

    test('should handle missing optional fields in UserFields', () => {
      const mockUserFields = { ...expectedUser }
      const expectedUserDto = { ...mockUserDetailsWithStringId }
      expect(userModel.toDto(mockUserFields)).toEqual(expectedUserDto)
    })
  })
})
