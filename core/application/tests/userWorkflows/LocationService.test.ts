import { LocationService } from '../../userWorkflow/LocationService'
import type LocationRepository from '../../models/policies/repositories/LocationRepository'
import type { LocationDTO } from '../../../../commons/dto/UserDTO'
import { mockLogger } from '../mocks/mockLogger'

describe('LocationService Tests', () => {
  const locationRepository = {
    create: jest.fn(),
    update: jest.fn(),
    getItem: jest.fn(),
    delete: jest.fn(),
    queryUserLocations: jest.fn(),
    deleteUserLocations: jest.fn(),
    deleteUserLocation: jest.fn()
  } as unknown as jest.Mocked<LocationRepository>

  const locationService = new LocationService(locationRepository, mockLogger)

  const userId = 'user-123'
  const preferredLocation = {
    area: 'Banani, Dhaka',
    latitude: 23.7936706,
    longitude: 90.4066082
  } as LocationDTO
  const validUserAttributes = {
    countryCode: 'BD',
    bloodGroup: 'O-' as const,
    availableForDonation: true,
    lastVaccinatedDate: '2023-05-01'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    locationRepository.queryUserLocations.mockResolvedValue([])
  })

  test('should do nothing when no locations are provided', async() => {
    await locationService.updateUserLocation(userId, [], validUserAttributes)

    expect(locationRepository.create).not.toHaveBeenCalled()
    expect(locationRepository.deleteUserLocation).not.toHaveBeenCalled()
    expect(locationRepository.deleteUserLocations).not.toHaveBeenCalled()
  })

  test('should throw when countryCode is missing instead of writing a fabricated key', async() => {
    const { countryCode: _countryCode, ...attributesWithoutCountry } = validUserAttributes

    await expect(
      locationService.updateUserLocation(userId, [preferredLocation], attributesWithoutCountry)
    ).rejects.toThrow('Cannot update locations: user countryCode is missing')
    expect(locationRepository.create).not.toHaveBeenCalled()
  })

  test('should throw when bloodGroup is missing instead of writing a fabricated key', async() => {
    const { bloodGroup: _bloodGroup, ...attributesWithoutBloodGroup } = validUserAttributes

    await expect(
      locationService.updateUserLocation(userId, [preferredLocation], attributesWithoutBloodGroup)
    ).rejects.toThrow('Cannot update locations: user bloodGroup is missing')
    expect(locationRepository.create).not.toHaveBeenCalled()
  })

  test('should throw when availableForDonation is missing instead of defaulting to unavailable', async() => {
    const {
      availableForDonation: _availableForDonation,
      ...attributesWithoutAvailability
    } = validUserAttributes

    await expect(
      locationService.updateUserLocation(userId, [preferredLocation], attributesWithoutAvailability)
    ).rejects.toThrow('Cannot update locations: user availableForDonation is missing')
    expect(locationRepository.create).not.toHaveBeenCalled()
  })

  test('should create locations with real profile values', async() => {
    await locationService.updateUserLocation(userId, [preferredLocation], validUserAttributes)

    expect(locationRepository.create).toHaveBeenCalledTimes(1)
    const createdLocation = locationRepository.create.mock.calls[0][0]
    expect(createdLocation).toMatchObject({
      userId,
      area: preferredLocation.area,
      countryCode: 'BD',
      bloodGroup: 'O-',
      availableForDonation: true,
      lastVaccinatedDate: '2023-05-01'
    })
    expect(typeof createdLocation.locationId).toBe('string')
    expect(createdLocation.h3Res8).not.toBe('')
  })

  test('should omit lastVaccinatedDate when the user has none instead of writing "undefined"', async() => {
    const { lastVaccinatedDate: _lastVaccinatedDate, ...attributesWithoutVaccination }
      = validUserAttributes

    await locationService.updateUserLocation(
      userId,
      [preferredLocation],
      attributesWithoutVaccination
    )

    const createdLocation = locationRepository.create.mock.calls[0][0]
    expect('lastVaccinatedDate' in createdLocation).toBe(false)
  })

  test('should delete old locations only after new ones are created', async() => {
    const callOrder: string[] = []
    locationRepository.queryUserLocations.mockResolvedValue([
      { locationId: 'old-location-1' } as LocationDTO
    ])
    locationRepository.create.mockImplementation(async() => {
      callOrder.push('create')

      return {} as LocationDTO
    })
    locationRepository.deleteUserLocation.mockImplementation(async() => {
      callOrder.push('delete')
    })

    await locationService.updateUserLocation(userId, [preferredLocation], validUserAttributes)

    expect(callOrder).toEqual(['create', 'delete'])
    expect(locationRepository.deleteUserLocation).toHaveBeenCalledWith(userId, 'old-location-1')
  })

  test('should keep old locations when creating a new one fails', async() => {
    locationRepository.queryUserLocations.mockResolvedValue([
      { locationId: 'old-location-1' } as LocationDTO
    ])
    locationRepository.create.mockRejectedValue(new Error('write failed'))

    await expect(
      locationService.updateUserLocation(userId, [preferredLocation], validUserAttributes)
    ).rejects.toThrow('write failed')
    expect(locationRepository.deleteUserLocation).not.toHaveBeenCalled()
  })
})
