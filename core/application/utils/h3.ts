import { latLngToCell, cellToParent, gridRing, gridDisk, gridDiskDistances, cellToLatLng } from 'h3-js'
import { RADIUS_OF_EARTH, H3_FINE_RESOLUTION } from '../../../commons/libs/constants/NoMagicNumbers'

export function generateH3Cell(
  latitude: number,
  longitude: number,
  resolution: number = H3_FINE_RESOLUTION
): string {
  return latLngToCell(latitude, longitude, resolution)
}

export function getH3CellParent(cell: string, resolution: number): string {
  return cellToParent(cell, resolution)
}

export function getH3GridRing(cell: string, k: number): string[] {
  if (k === 0) {
    return [cell]
  }
  try {
    return gridRing(cell, k)
  } catch (_error) {
    const distances = gridDiskDistances(cell, k)

    return distances[k] ?? []
  }
}

export function getH3GridDisk(cell: string, k: number): string[] {
  return gridDisk(cell, k)
}

export function getDistanceBetweenH3Cells(cellA: string, cellB: string): number {
  const [lat1, lng1] = cellToLatLng(cellA)
  const [lat2, lng2] = cellToLatLng(cellB)

  return haversineKm(lat1, lng1, lat2, lng2)
}

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRadians = (degrees: number): number => (degrees * Math.PI) / 180
  const deltaLat = toRadians(lat2 - lat1)
  const deltaLng = toRadians(lng2 - lng1)

  const centralAngle
    = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2))
    * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2)

  const angularDistance = 2 * Math.atan2(Math.sqrt(centralAngle), Math.sqrt(1 - centralAngle))

  return parseFloat((RADIUS_OF_EARTH * angularDistance).toFixed(2))
}
