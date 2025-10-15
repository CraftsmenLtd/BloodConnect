import { LocationService } from '../../userWorkflow/LocationService'
import type { LocationDTO, UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import type LocationRepository from '../../models/policies/repositories/LocationRepository'
import type { Logger } from '../../models/logger/Logger'
import { generateUniqueID } from '../../utils/idGenerator'
import { generateGeohash } from '../../utils/geohash'

jest.mock('../../utils/idGenerator')
jest.mock('../../utils/geohash')

describe('LocationService', () => {
  let locationService: LocationService
  let mockLocationRepository: jest.Mocked<LocationRepository>
  let mockLogger: jest.Mocked<Logger>

  beforeEach(() => {
    mockLocationRepository = {
      create: jest.fn(),
      deleteUserLocations: jest.fn(),
      queryUserLocations: jest.fn()
    } as unknown as jest.Mocked<LocationRepository>

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as jest.Mocked<Logger>

    locationService = new LocationService(
      mockLocationRepository,
      mockLogger
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('updateUserLocation', () => {
    test('should delete existing locations and create new ones', async () => {
      const userId = 'user-123'
      const mockLocationId = 'location-id-1'
      const mockGeohash = 'w4rq8p9q'
      const mockCreatedAt = '2025-01-15T10:00:00.000Z'

      ;(generateUniqueID as jest.Mock).mockReturnValue(mockLocationId)
      ;(generateGeohash as jest.Mock).mockReturnValue(mockGeohash)

      jest.spyOn(global, 'Date').mockImplementation(() => ({
        toISOString: () => mockCreatedAt
      } as Date))

      const preferredDonationLocations: LocationDTO[] = [
        {
          userId: '',
          locationId: '',
          area: 'Dhaka Medical College',
          countryCode: '',
          latitude: 23.7261,
          longitude: 90.3987,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        }
      ]

      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-12-01'
      }

      await locationService.updateUserLocation(
        userId,
        preferredDonationLocations,
        userAttributes
      )

      expect(mockLocationRepository.deleteUserLocations).toHaveBeenCalledWith(userId)
      expect(generateGeohash).toHaveBeenCalledWith(23.7261, 90.3987)
      expect(mockLocationRepository.create).toHaveBeenCalledWith({
        userId: 'user-123',
        locationId: mockLocationId,
        area: 'Dhaka Medical College',
        countryCode: 'BD',
        latitude: 23.7261,
        longitude: 90.3987,
        geohash: mockGeohash,
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-12-01',
        createdAt: mockCreatedAt
      })

      jest.restoreAllMocks()
    })

    test('should handle multiple preferred donation locations', async () => {
      const userId = 'user-456'
      const locationIds = ['loc-1', 'loc-2', 'loc-3']
      const geohashes = ['geo-1', 'geo-2', 'geo-3']

      ;(generateUniqueID as jest.Mock)
        .mockReturnValueOnce(locationIds[0])
        .mockReturnValueOnce(locationIds[1])
        .mockReturnValueOnce(locationIds[2])

      ;(generateGeohash as jest.Mock)
        .mockReturnValueOnce(geohashes[0])
        .mockReturnValueOnce(geohashes[1])
        .mockReturnValueOnce(geohashes[2])

      const preferredDonationLocations: LocationDTO[] = [
        {
          userId: '',
          locationId: '',
          area: 'Location 1',
          countryCode: '',
          latitude: 23.7261,
          longitude: 90.3987,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        },
        {
          userId: '',
          locationId: '',
          area: 'Location 2',
          countryCode: '',
          latitude: 23.8103,
          longitude: 90.4125,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        },
        {
          userId: '',
          locationId: '',
          area: 'Location 3',
          countryCode: '',
          latitude: 23.7500,
          longitude: 90.4000,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        }
      ]

      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'B+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-11-15'
      }

      await locationService.updateUserLocation(
        userId,
        preferredDonationLocations,
        userAttributes
      )

      expect(mockLocationRepository.deleteUserLocations).toHaveBeenCalledWith(userId)
      expect(mockLocationRepository.create).toHaveBeenCalledTimes(3)
      expect(generateUniqueID).toHaveBeenCalledTimes(3)
      expect(generateGeohash).toHaveBeenCalledTimes(3)

      expect(mockLocationRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          userId: 'user-456',
          locationId: 'loc-1',
          area: 'Location 1',
          latitude: 23.7261,
          longitude: 90.3987,
          geohash: 'geo-1'
        })
      )

      expect(mockLocationRepository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          userId: 'user-456',
          locationId: 'loc-2',
          area: 'Location 2',
          latitude: 23.8103,
          longitude: 90.4125,
          geohash: 'geo-2'
        })
      )

      expect(mockLocationRepository.create).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({
          userId: 'user-456',
          locationId: 'loc-3',
          area: 'Location 3',
          latitude: 23.7500,
          longitude: 90.4000,
          geohash: 'geo-3'
        })
      )
    })

    test('should not update locations when preferredDonationLocations is undefined', async () => {
      const userId = 'user-789'
      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'O+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-10-01'
      }

      await locationService.updateUserLocation(
        userId,
        undefined as unknown as LocationDTO[],
        userAttributes
      )

      expect(mockLocationRepository.deleteUserLocations).not.toHaveBeenCalled()
      expect(mockLocationRepository.create).not.toHaveBeenCalled()
    })

    test('should not update locations when preferredDonationLocations is empty array', async () => {
      const userId = 'user-999'
      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'AB+',
        availableForDonation: false,
        lastVaccinatedDate: '2024-09-15'
      }

      await locationService.updateUserLocation(
        userId,
        [],
        userAttributes
      )

      expect(mockLocationRepository.deleteUserLocations).not.toHaveBeenCalled()
      expect(mockLocationRepository.create).not.toHaveBeenCalled()
    })

    test('should set availableForDonation to false when userAttributes has false', async () => {
      const userId = 'user-111'
      const mockLocationId = 'loc-id'
      const mockGeohash = 'geohash'

      ;(generateUniqueID as jest.Mock).mockReturnValue(mockLocationId)
      ;(generateGeohash as jest.Mock).mockReturnValue(mockGeohash)

      const preferredDonationLocations: LocationDTO[] = [
        {
          userId: '',
          locationId: '',
          area: 'Test Location',
          countryCode: '',
          latitude: 23.7261,
          longitude: 90.3987,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        }
      ]

      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'A-',
        availableForDonation: false,
        lastVaccinatedDate: '2024-08-01'
      }

      await locationService.updateUserLocation(
        userId,
        preferredDonationLocations,
        userAttributes
      )

      expect(mockLocationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          availableForDonation: false
        })
      )
    })

    test('should set availableForDonation to false when not explicitly true', async () => {
      const userId = 'user-222'
      const mockLocationId = 'loc-id'
      const mockGeohash = 'geohash'

      ;(generateUniqueID as jest.Mock).mockReturnValue(mockLocationId)
      ;(generateGeohash as jest.Mock).mockReturnValue(mockGeohash)

      const preferredDonationLocations: LocationDTO[] = [
        {
          userId: '',
          locationId: '',
          area: 'Test Location',
          countryCode: '',
          latitude: 23.7261,
          longitude: 90.3987,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        }
      ]

      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'B-',
        availableForDonation: undefined,
        lastVaccinatedDate: '2024-07-01'
      }

      await locationService.updateUserLocation(
        userId,
        preferredDonationLocations,
        userAttributes
      )

      expect(mockLocationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          availableForDonation: false
        })
      )
    })

    test('should generate unique locationId for each location', async () => {
      const userId = 'user-333'
      const locationIds = ['unique-id-1', 'unique-id-2']

      ;(generateUniqueID as jest.Mock)
        .mockReturnValueOnce(locationIds[0])
        .mockReturnValueOnce(locationIds[1])

      ;(generateGeohash as jest.Mock).mockReturnValue('geo')

      const preferredDonationLocations: LocationDTO[] = [
        {
          userId: '',
          locationId: '',
          area: 'Loc 1',
          countryCode: '',
          latitude: 23.7261,
          longitude: 90.3987,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        },
        {
          userId: '',
          locationId: '',
          area: 'Loc 2',
          countryCode: '',
          latitude: 23.8103,
          longitude: 90.4125,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        }
      ]

      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'O+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-06-01'
      }

      await locationService.updateUserLocation(
        userId,
        preferredDonationLocations,
        userAttributes
      )

      expect(mockLocationRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ locationId: 'unique-id-1' })
      )
      expect(mockLocationRepository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ locationId: 'unique-id-2' })
      )
    })

    test('should generate unique geohash for each location based on coordinates', async () => {
      const userId = 'user-444'
      const geohashes = ['geohash-1', 'geohash-2']

      ;(generateUniqueID as jest.Mock).mockReturnValue('loc-id')
      ;(generateGeohash as jest.Mock)
        .mockReturnValueOnce(geohashes[0])
        .mockReturnValueOnce(geohashes[1])

      const preferredDonationLocations: LocationDTO[] = [
        {
          userId: '',
          locationId: '',
          area: 'Loc 1',
          countryCode: '',
          latitude: 23.7261,
          longitude: 90.3987,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        },
        {
          userId: '',
          locationId: '',
          area: 'Loc 2',
          countryCode: '',
          latitude: 24.8949,
          longitude: 91.8687,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        }
      ]

      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'AB-',
        availableForDonation: true,
        lastVaccinatedDate: '2024-05-01'
      }

      await locationService.updateUserLocation(
        userId,
        preferredDonationLocations,
        userAttributes
      )

      expect(generateGeohash).toHaveBeenNthCalledWith(1, 23.7261, 90.3987)
      expect(generateGeohash).toHaveBeenNthCalledWith(2, 24.8949, 91.8687)

      expect(mockLocationRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ geohash: 'geohash-1' })
      )
      expect(mockLocationRepository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ geohash: 'geohash-2' })
      )
    })

    test('should propagate repository errors from deleteUserLocations', async () => {
      const userId = 'user-555'
      const error = new Error('Delete operation failed')

      mockLocationRepository.deleteUserLocations.mockRejectedValue(error)

      const preferredDonationLocations: LocationDTO[] = [
        {
          userId: '',
          locationId: '',
          area: 'Test Location',
          countryCode: '',
          latitude: 23.7261,
          longitude: 90.3987,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        }
      ]

      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-04-01'
      }

      await expect(
        locationService.updateUserLocation(userId, preferredDonationLocations, userAttributes)
      ).rejects.toThrow('Delete operation failed')
    })

    test('should propagate repository errors from create', async () => {
      const userId = 'user-666'
      const error = new Error('Create operation failed')

      ;(generateUniqueID as jest.Mock).mockReturnValue('loc-id')
      ;(generateGeohash as jest.Mock).mockReturnValue('geohash')
      mockLocationRepository.create.mockRejectedValue(error)

      const preferredDonationLocations: LocationDTO[] = [
        {
          userId: '',
          locationId: '',
          area: 'Test Location',
          countryCode: '',
          latitude: 23.7261,
          longitude: 90.3987,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        }
      ]

      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'A+',
        availableForDonation: true,
        lastVaccinatedDate: '2024-03-01'
      }

      await expect(
        locationService.updateUserLocation(userId, preferredDonationLocations, userAttributes)
      ).rejects.toThrow('Create operation failed')
    })

    test('should convert lastVaccinatedDate to string', async () => {
      const userId = 'user-777'
      const mockLocationId = 'loc-id'
      const mockGeohash = 'geohash'

      ;(generateUniqueID as jest.Mock).mockReturnValue(mockLocationId)
      ;(generateGeohash as jest.Mock).mockReturnValue(mockGeohash)

      const preferredDonationLocations: LocationDTO[] = [
        {
          userId: '',
          locationId: '',
          area: 'Test Location',
          countryCode: '',
          latitude: 23.7261,
          longitude: 90.3987,
          geohash: '',
          bloodGroup: 'A+',
          availableForDonation: false,
          lastVaccinatedDate: '',
          createdAt: ''
        }
      ]

      const userAttributes: Partial<UserDetailsDTO> = {
        countryCode: 'BD',
        bloodGroup: 'O-',
        availableForDonation: true,
        lastVaccinatedDate: '2024-02-15'
      }

      await locationService.updateUserLocation(
        userId,
        preferredDonationLocations,
        userAttributes
      )

      expect(mockLocationRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          lastVaccinatedDate: '2024-02-15'
        })
      )
    })
  })

  describe('queryUserLocations', () => {
    test('should query and return user locations', async () => {
      const userId = 'user-123'
      const mockLocations: LocationDTO[] = [
        {
          userId: 'user-123',
          locationId: 'loc-1',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8103,
          longitude: 90.4125,
          geohash: 'w4rq8p9q',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-01-01',
          createdAt: '2025-01-15T10:00:00.000Z'
        },
        {
          userId: 'user-123',
          locationId: 'loc-2',
          area: 'Chittagong',
          countryCode: 'BD',
          latitude: 22.3569,
          longitude: 91.7832,
          geohash: 'w2mgu7d1',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-01-01',
          createdAt: '2025-01-15T11:00:00.000Z'
        }
      ]

      mockLocationRepository.queryUserLocations.mockResolvedValue(mockLocations)

      const result = await locationService.queryUserLocations(userId)

      expect(mockLocationRepository.queryUserLocations).toHaveBeenCalledWith(userId)
      expect(result).toEqual(mockLocations)
      expect(result).toHaveLength(2)
    })

    test('should return empty array when user has no locations', async () => {
      const userId = 'user-456'
      mockLocationRepository.queryUserLocations.mockResolvedValue([])

      const result = await locationService.queryUserLocations(userId)

      expect(mockLocationRepository.queryUserLocations).toHaveBeenCalledWith(userId)
      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    test('should propagate repository errors', async () => {
      const userId = 'user-789'
      const error = new Error('Query operation failed')
      mockLocationRepository.queryUserLocations.mockRejectedValue(error)

      await expect(
        locationService.queryUserLocations(userId)
      ).rejects.toThrow('Query operation failed')
    })

    test('should handle different user IDs correctly', async () => {
      const userId1 = 'user-111'
      const userId2 = 'user-222'

      const locations1: LocationDTO[] = [
        {
          userId: userId1,
          locationId: 'loc-1',
          area: 'Dhaka',
          countryCode: 'BD',
          latitude: 23.8103,
          longitude: 90.4125,
          geohash: 'w4rq8p9q',
          bloodGroup: 'A+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-01-01',
          createdAt: '2025-01-15T10:00:00.000Z'
        }
      ]

      const locations2: LocationDTO[] = [
        {
          userId: userId2,
          locationId: 'loc-2',
          area: 'Sylhet',
          countryCode: 'BD',
          latitude: 24.8949,
          longitude: 91.8687,
          geohash: 'w2rc4j8z',
          bloodGroup: 'B+',
          availableForDonation: true,
          lastVaccinatedDate: '2024-02-01',
          createdAt: '2025-01-15T11:00:00.000Z'
        }
      ]

      mockLocationRepository.queryUserLocations
        .mockResolvedValueOnce(locations1)
        .mockResolvedValueOnce(locations2)

      const result1 = await locationService.queryUserLocations(userId1)
      const result2 = await locationService.queryUserLocations(userId2)

      expect(mockLocationRepository.queryUserLocations).toHaveBeenNthCalledWith(1, userId1)
      expect(mockLocationRepository.queryUserLocations).toHaveBeenNthCalledWith(2, userId2)
      expect(result1).toEqual(locations1)
      expect(result2).toEqual(locations2)
    })
  })
})
