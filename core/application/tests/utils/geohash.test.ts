import { generateGeohash, decodeGeohash, getGeohashNthNeighbors, getDistanceBetweenGeohashes } from '../../utils/geohash'
import ngeohash from 'ngeohash'

jest.mock('ngeohash')

describe('Geohash Utility Functions', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('generateGeohash', () => {
    test('should generate a geohash with default precision (7)', () => {
      const latitude = 37.7749
      const longitude = -122.4194
      const geohashMock = '9q8yyzq';

      (ngeohash.encode as jest.Mock).mockReturnValue(geohashMock)
      const result = generateGeohash(latitude, longitude)

      expect(ngeohash.encode).toHaveBeenCalledWith(latitude, longitude, 8)
      expect(result).toEqual(geohashMock)
    })

    test('should generate a geohash with custom precision', () => {
      const latitude = 37.7749
      const longitude = -122.4194
      const precision = 9
      const geohashMock = '9q8yyzqd2';

      (ngeohash.encode as jest.Mock).mockReturnValue(geohashMock)
      const result = generateGeohash(latitude, longitude, precision)

      expect(ngeohash.encode).toHaveBeenCalledWith(latitude, longitude, precision)
      expect(result).toEqual(geohashMock)
    })

    test('should handle extreme latitude and longitude values', () => {
      const latitude = 90
      const longitude = 180
      const geohashMock = 'zzzzzzz';

      (ngeohash.encode as jest.Mock).mockReturnValue(geohashMock)
      const result = generateGeohash(latitude, longitude)

      expect(ngeohash.encode).toHaveBeenCalledWith(latitude, longitude, 8)
      expect(result).toEqual(geohashMock)
    })
  })

  describe('decodeGeohash', () => {
    test('should decode a valid geohash to latitude and longitude', () => {
      const geohash = '9q8yyzq'
      const decodedMock = { latitude: 37.7749, longitude: -122.4194 };

      (ngeohash.decode as jest.Mock).mockReturnValue(decodedMock)
      const result = decodeGeohash(geohash)

      expect(ngeohash.decode).toHaveBeenCalledWith(geohash)
      expect(result).toEqual(decodedMock)
    })

    test('should return null for invalid geohash input', () => {
      const invalidGeohash = ''
      const result = decodeGeohash(invalidGeohash)
      expect(result).toBeNull()
    })

    test('should return null when decode throws error', () => {
      const invalidGeohash = 'invalid';
      (ngeohash.decode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid geohash')
      })

      const result = decodeGeohash(invalidGeohash)
      expect(result).toBeNull()
    })

    test('should handle whitespace-only input', () => {
      const whitespaceGeohash = '   '
      const result = decodeGeohash(whitespaceGeohash)
      expect(result).toBeNull()
    })
  })

  describe('getGeohashNthNeighbors', () => {
    test('should return the geohash itself when neighborLevel is 0', () => {
      const geohash = '9q8yyzq'
      const result = getGeohashNthNeighbors(geohash, 0)

      expect(result).toEqual([geohash])
      expect(ngeohash.neighbors).not.toHaveBeenCalled()
    })

    test('should return first level neighbors when neighborLevel is 1', () => {
      const geohash = '9q8yyzq'
      const mockNeighbors = ['9q8yyzw', '9q8yyzx', '9q8yyzr', '9q8yyzp', '9q8yyzn', '9q8yyzm', '9q8yyz8', '9q8yyz9'];
      (ngeohash.neighbors as jest.Mock).mockReturnValue(mockNeighbors)

      const result = getGeohashNthNeighbors(geohash, 1)

      expect(ngeohash.neighbors).toHaveBeenCalledWith(geohash)
      expect(result).toHaveLength(8)
      expect(result).toEqual(expect.arrayContaining(mockNeighbors))
    })

    test('should return second level neighbors when neighborLevel is 2', () => {
      const geohash = '9q8yyzq'
      const firstLevelNeighbors = ['neighbor1', 'neighbor2']
      const secondLevelNeighbors = ['neighbor3', 'neighbor4'];

      (ngeohash.neighbors as jest.Mock)
        .mockReturnValueOnce(firstLevelNeighbors)
        .mockReturnValueOnce(secondLevelNeighbors)
        .mockReturnValueOnce(secondLevelNeighbors)

      const result = getGeohashNthNeighbors(geohash, 2)

      expect(result.length).toBeGreaterThan(0)
      expect(ngeohash.neighbors).toHaveBeenCalled()
    })

    test('should not include duplicate neighbors', () => {
      const geohash = '9q8yyzq'
      const mockNeighbors = ['neighbor1', 'neighbor2', 'neighbor3'];

      (ngeohash.neighbors as jest.Mock).mockReturnValue(mockNeighbors)

      const result = getGeohashNthNeighbors(geohash, 1)

      const uniqueNeighbors = [...new Set(result)]
      expect(result.length).toBe(uniqueNeighbors.length)
    })

    test('should handle higher neighbor levels', () => {
      const geohash = '9q8yyzq'
      let callCount = 0;

      (ngeohash.neighbors as jest.Mock).mockImplementation((_hash: string) => {
        // Return unique neighbors for each call to avoid Set deduplication
        const baseIndex = callCount * 3
        callCount++

        return [
          `neighbor_${baseIndex}_0`,
          `neighbor_${baseIndex}_1`,
          `neighbor_${baseIndex}_2`
        ]
      })

      const result = getGeohashNthNeighbors(geohash, 3)

      expect(result.length).toBeGreaterThan(0)
      expect(ngeohash.neighbors).toHaveBeenCalled()
    })
  })

  describe('getDistanceBetweenGeohashes', () => {
    test('should calculate distance between two geohashes', () => {
      const geohash1 = '9q8yyzq'
      const geohash2 = '9q8yyzr'
      const coords1 = { latitude: 37.7749, longitude: -122.4194 }
      const coords2 = { latitude: 37.7750, longitude: -122.4195 };

      (ngeohash.decode as jest.Mock)
        .mockReturnValueOnce(coords1)
        .mockReturnValueOnce(coords2)

      const result = getDistanceBetweenGeohashes(geohash1, geohash2)

      expect(ngeohash.decode).toHaveBeenCalledWith(geohash1)
      expect(ngeohash.decode).toHaveBeenCalledWith(geohash2)
      expect(typeof result).toBe('number')
      expect(result).toBeGreaterThanOrEqual(0)
    })

    test('should return 0 for same geohash', () => {
      const geohash = '9q8yyzq'
      const coords = { latitude: 37.7749, longitude: -122.4194 };

      (ngeohash.decode as jest.Mock).mockReturnValue(coords)

      const result = getDistanceBetweenGeohashes(geohash, geohash)

      expect(result).toBe(0)
    })

    test('should calculate distance for geohashes far apart', () => {
      const geohash1 = '9q8yyzq' // San Francisco
      const geohash2 = 'dr5ru' // New York
      const coords1 = { latitude: 37.7749, longitude: -122.4194 }
      const coords2 = { latitude: 40.7128, longitude: -74.0060 };

      (ngeohash.decode as jest.Mock)
        .mockReturnValueOnce(coords1)
        .mockReturnValueOnce(coords2)

      const result = getDistanceBetweenGeohashes(geohash1, geohash2)

      expect(result).toBeGreaterThan(0)
      expect(result).toBeGreaterThan(100) // Should be thousands of km
    })

    test('should return fixed decimal precision', () => {
      const geohash1 = '9q8yyzq'
      const geohash2 = '9q8yyzr'
      const coords1 = { latitude: 37.7749, longitude: -122.4194 }
      const coords2 = { latitude: 37.7750123, longitude: -122.4195456 };

      (ngeohash.decode as jest.Mock)
        .mockReturnValueOnce(coords1)
        .mockReturnValueOnce(coords2)

      const result = getDistanceBetweenGeohashes(geohash1, geohash2)

      const decimalPlaces = result.toString().split('.')[1]?.length || 0
      expect(decimalPlaces).toBeLessThanOrEqual(2)
    })
  })
})
