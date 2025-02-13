import { LocationService } from '../../src/LocationService/LocationService'
import { FetchClient } from '../../src/setup/clients/FetchClient'

jest.mock('../../src/setup/clients/FetchClient')

const mockHttpClient = {
  get: jest.fn()
}

describe('LocationService', () => {
  const locationService = new LocationService('https://gw-example.bloodconnect.net/api')
  const mockFetchClient = FetchClient as jest.Mocked<typeof FetchClient>

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should throw an error if no coordinates are found', async() => {
    const location = 'Nonexistent Place'

    mockFetchClient.prototype.get = jest.fn().mockResolvedValue([])

    await expect(locationService.getCoordinates(location)).rejects.toThrow(
      `Failed to retrieve coordinates for "${location}."`
    )
  })

  it('should throw an error if FetchClient throws an error', async() => {
    const location = 'Some Place'
    mockFetchClient.prototype.get = jest.fn().mockRejectedValue(new Error('Network error'))

    await expect(locationService.getCoordinates(location)).rejects.toThrow(
      `Failed to retrieve coordinates for "${location}."`
    )
  })

  it('should throw an error for unexpected errors', async() => {
    const location = 'Some Place'
    mockHttpClient.get.mockRejectedValueOnce('Unexpected error')

    await expect(locationService.getCoordinates(location)).rejects.toThrow(
      'Failed to retrieve coordinates for "Some Place."'
    )
  })
})
