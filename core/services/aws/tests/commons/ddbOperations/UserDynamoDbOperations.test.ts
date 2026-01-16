import UserDynamoDbOperations from '../../../commons/ddbOperations/UserDynamoDbOperations'
import DynamoDbTableOperations from '../../../commons/ddbOperations/DynamoDbTableOperations'
import type { UserDetailsDTO } from '../../../../../../commons/dto/UserDTO'

jest.mock('../../../commons/ddbOperations/DynamoDbTableOperations')

describe('UserDynamoDbOperations', () => {
  let userDynamoDbOperations: UserDynamoDbOperations
  const mockTableName = 'test-table'
  const mockRegion = 'us-east-1'

  beforeEach(() => {
    jest.clearAllMocks()
    userDynamoDbOperations = new UserDynamoDbOperations(mockTableName, mockRegion)
  })

  describe('constructor', () => {
    it('should initialize with correct table name and region', () => {
      expect(userDynamoDbOperations).toBeInstanceOf(UserDynamoDbOperations)
      expect(userDynamoDbOperations).toBeInstanceOf(DynamoDbTableOperations)
    })

    it('should create instance with different regions', () => {
      const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-south-1']

      regions.forEach((region) => {
        const operations = new UserDynamoDbOperations('test-table', region)
        expect(operations).toBeInstanceOf(UserDynamoDbOperations)
      })
    })
  })

  describe('getUser', () => {
    it('should successfully get user by userId', async () => {
      const userId = 'test-user-id'
      const mockUser: UserDetailsDTO = {
        userId,
        name: 'Test User',
        bloodGroup: 'A+',
        gender: 'Male',
        countryCode: '+880',
        dateOfBirth: '1990-01-01',
        age: 33,
        preferredDonationLocations: ['City Hospital'],
        availableForDonation: true
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockUser)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await userDynamoDbOperations.getUser(userId)

      expect(result).toEqual(mockUser)
      expect(mockGetItem).toHaveBeenCalledWith(`USER#${userId}`, 'PROFILE')
    })

    it('should return null when user does not exist', async () => {
      const userId = 'non-existent-user-id'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await userDynamoDbOperations.getUser(userId)

      expect(result).toBeNull()
      expect(mockGetItem).toHaveBeenCalledWith(`USER#${userId}`, 'PROFILE')
    })

    it('should handle userId with special characters', async () => {
      const userId = 'user-id-with-special-chars-!@#$%'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await userDynamoDbOperations.getUser(userId)

      expect(mockGetItem).toHaveBeenCalledWith(`USER#${userId}`, 'PROFILE')
    })

    it('should handle long userId strings', async () => {
      const userId = 'very-long-user-id-with-many-characters-12345-67890-abcdef-ghijkl'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await userDynamoDbOperations.getUser(userId)

      expect(mockGetItem).toHaveBeenCalledWith(`USER#${userId}`, 'PROFILE')
    })

    it('should format partition key correctly with USER prefix', async () => {
      const userId = 'test-user-id'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await userDynamoDbOperations.getUser(userId)

      const expectedPK = `USER#${userId}`
      expect(mockGetItem).toHaveBeenCalledWith(expectedPK, 'PROFILE')
    })

    it('should always use PROFILE as sort key', async () => {
      const userId = 'test-user-id'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await userDynamoDbOperations.getUser(userId)

      expect(mockGetItem).toHaveBeenCalledWith(expect.any(String), 'PROFILE')
    })

    it('should handle DynamoDB errors gracefully', async () => {
      const userId = 'test-user-id'
      const dbError = new Error('DynamoDB query failed')

      const mockGetItem = jest.fn().mockRejectedValue(dbError)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await expect(userDynamoDbOperations.getUser(userId)).rejects.toThrow('DynamoDB query failed')
    })

    it('should return user with all optional fields', async () => {
      const userId = 'test-user-id'
      const mockUser: UserDetailsDTO = {
        userId,
        name: 'Test User',
        bloodGroup: 'O-',
        gender: 'Female',
        countryCode: '+1',
        dateOfBirth: '1995-05-15',
        age: 28,
        preferredDonationLocations: ['Hospital A', 'Hospital B'],
        availableForDonation: true,
        phoneNumbers: ['+1234567890'],
        height: 165,
        weight: 55,
        lastDonationDate: '2023-12-01',
        lastVaccinatedDate: '2024-03-15',
        email: 'test@example.com',
        profilePicture: 'https://example.com/pic.jpg'
      }

      const mockGetItem = jest.fn().mockResolvedValue(mockUser)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      const result = await userDynamoDbOperations.getUser(userId)

      expect(result).toEqual(mockUser)
      expect(result?.phoneNumbers).toEqual(['+1234567890'])
      expect(result?.height).toBe(165)
      expect(result?.weight).toBe(55)
      expect(result?.lastDonationDate).toBe('2023-12-01')
      expect(result?.lastVaccinatedDate).toBe('2024-03-15')
    })

    it('should handle empty string userId', async () => {
      const userId = ''

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await userDynamoDbOperations.getUser(userId)

      expect(mockGetItem).toHaveBeenCalledWith('USER#', 'PROFILE')
    })

    it('should handle userId with dashes and underscores', async () => {
      const userId = 'user_id-with-dashes_and_underscores-123'

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      await userDynamoDbOperations.getUser(userId)

      expect(mockGetItem).toHaveBeenCalledWith(`USER#${userId}`, 'PROFILE')
    })

    it('should handle multiple calls with different user IDs', async () => {
      const userIds = ['user-1', 'user-2', 'user-3']

      const mockGetItem = jest.fn().mockResolvedValue(null)
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      for (const userId of userIds) {
        await userDynamoDbOperations.getUser(userId)
      }

      expect(mockGetItem).toHaveBeenCalledTimes(3)
      expect(mockGetItem).toHaveBeenNthCalledWith(1, 'USER#user-1', 'PROFILE')
      expect(mockGetItem).toHaveBeenNthCalledWith(2, 'USER#user-2', 'PROFILE')
      expect(mockGetItem).toHaveBeenNthCalledWith(3, 'USER#user-3', 'PROFILE')
    })

    it('should return user with different blood groups', async () => {
      const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

      const mockGetItem = jest.fn()
      DynamoDbTableOperations.prototype.getItem = mockGetItem

      for (const bloodGroup of bloodGroups) {
        const mockUser: UserDetailsDTO = {
          userId: 'test-user-id',
          name: 'Test User',
          bloodGroup,
          gender: 'Male',
          countryCode: '+880',
          dateOfBirth: '1990-01-01',
          age: 33,
          preferredDonationLocations: ['City Hospital'],
          availableForDonation: true
        }
        mockGetItem.mockResolvedValueOnce(mockUser)

        const result = await userDynamoDbOperations.getUser('test-user-id')

        expect(result?.bloodGroup).toBe(bloodGroup)
      }

      expect(mockGetItem).toHaveBeenCalledTimes(8)
    })
  })
})
