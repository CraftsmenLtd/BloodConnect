import UserModel from '../../../technicalImpl/dbModels/UserModel'
import { mockUserWithStringId, mockUserWithNumberId, expectedUser } from '../../mocks/mockUserData'

describe('UserModel Unit Tests', () => {
  const userModel = new UserModel()

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
      expect(userModel.fromDto(mockUserWithStringId)).toEqual(expectedUser)
    })

    test('should handle non-string id correctly in fromDto', () => {
      expect(userModel.fromDto(mockUserWithNumberId)).toEqual(expectedUser)
    })
  })

  describe('toDto', () => {
    test('should transform UserFields to UserDTO correctly', () => {
      const mockUserFields = { ...expectedUser }
      const expectedUserDto = { ...mockUserWithStringId }
      expect(userModel.toDto(mockUserFields)).toEqual(expectedUserDto)
    })

    test('should handle missing optional fields in UserFields', () => {
      const mockUserFields = { ...expectedUser }
      const expectedUserDto = { ...mockUserWithStringId }
      expect(userModel.toDto(mockUserFields)).toEqual(expectedUserDto)
    })
  })
})
