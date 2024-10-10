import ngeohash from 'ngeohash'

export function generateGeohash(latitude: number, longitude: number, precision: number = 7): string {
  return ngeohash.encode(latitude, longitude, precision)
}

export function decodeGeohash(geohash: string): { latitude: number; longitude: number } {
  const { latitude, longitude } = ngeohash.decode(geohash)
  return { latitude, longitude }
}
