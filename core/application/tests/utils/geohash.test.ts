import { generateGeohash, decodeGeohash } from '../../utils/geohash'
import ngeohash from 'ngeohash'

jest.mock('ngeohash')

describe('Geohash Utility Functions', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('generateGeohash', () => {
    it('should generate a geohash with default precision (7)', () => {
      const latitude = 37.7749
      const longitude = -122.4194
      const geohashMock = '9q8yyzq';

      (ngeohash.encode as jest.Mock).mockReturnValue(geohashMock)
      const result = generateGeohash(latitude, longitude)

      expect(ngeohash.encode).toHaveBeenCalledWith(latitude, longitude, 7)
      expect(result).toEqual(geohashMock)
    })

    it('should generate a geohash with custom precision', () => {
      const latitude = 37.7749
      const longitude = -122.4194
      const precision = 9
      const geohashMock = '9q8yyzqd2';

      (ngeohash.encode as jest.Mock).mockReturnValue(geohashMock)
      const result = generateGeohash(latitude, longitude, precision)

      expect(ngeohash.encode).toHaveBeenCalledWith(latitude, longitude, precision)
      expect(result).toEqual(geohashMock)
    })

    it('should handle extreme latitude and longitude values', () => {
      const latitude = 90
      const longitude = 180
      const geohashMock = 'zzzzzzz';

      (ngeohash.encode as jest.Mock).mockReturnValue(geohashMock)
      const result = generateGeohash(latitude, longitude)

      expect(ngeohash.encode).toHaveBeenCalledWith(latitude, longitude, 7)
      expect(result).toEqual(geohashMock)
    })
  })

  describe('decodeGeohash', () => {
    it('should decode a valid geohash to latitude and longitude', () => {
      const geohash = '9q8yyzq'
      const decodedMock = { latitude: 37.7749, longitude: -122.4194 };

      (ngeohash.decode as jest.Mock).mockReturnValue(decodedMock)
      const result = decodeGeohash(geohash)

      expect(ngeohash.decode).toHaveBeenCalledWith(geohash)
      expect(result).toEqual(decodedMock)
    })

    it('should return null for invalid geohash input', () => {
      const invalidGeohash = ''
      const result = decodeGeohash(invalidGeohash)
      expect(result).toBeNull()
    })
  })
})
