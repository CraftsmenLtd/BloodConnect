import * as fc from 'fast-check'
import {
  formatElapsedTime,
  getCircleGeoJson,
  getZoomLevel
} from '../../src/myActivity/myPosts/details/SearchStatus'

describe('SearchStatus pure functions — property-based tests', () => {
  test('PBT-U2-01: formatElapsedTime output matches expected format for any past date', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
        (msAgo) => {
          const createdAt = new Date(Date.now() - msAgo).toISOString()
          const result = formatElapsedTime(createdAt)
          expect(result).toMatch(/^(\d+d \d+h \d+m|\d+h \d+m|\d+m)$/)
        }
      )
    )
  })

  test('PBT-U2-02: formatElapsedTime output contains no negative numbers', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 * 24 * 60 * 60 * 1000 }),
        (msAgo) => {
          const createdAt = new Date(Date.now() - msAgo).toISOString()
          const result = formatElapsedTime(createdAt)
          const numbers = result.match(/\d+/g)?.map(Number) ?? []
          numbers.forEach((n) => expect(n).toBeGreaterThanOrEqual(0))
        }
      )
    )
  })

  test('PBT-U2-03: getCircleGeoJson with radiusKm <= 0 returns empty polygon', () => {
    fc.assert(
      fc.property(
        fc.double({ min: -180, max: 180, noNaN: true }),
        fc.double({ min: -90, max: 90, noNaN: true }),
        fc.double({ max: 0, noNaN: true }),
        (longitude, latitude, radiusKm) => {
          const result = getCircleGeoJson(longitude, latitude, radiusKm)
          expect(result.geometry.coordinates[0]).toHaveLength(0)
        }
      )
    )
  })

  test('PBT-U2-04: getZoomLevel for any radiusKm >= 0 returns value in [7, 13]', () => {
    fc.assert(
      fc.property(
        fc.float({ min: 0, max: 10_000, noNaN: true }),
        (radiusKm) => {
          const zoom = getZoomLevel(radiusKm)
          expect(zoom).toBeGreaterThanOrEqual(7)
          expect(zoom).toBeLessThanOrEqual(13)
        }
      )
    )
  })
})
