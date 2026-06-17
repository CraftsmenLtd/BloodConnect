import { latLngToCell, cellToLatLng, isValidCell } from 'h3-js'

const H3_FINE_RESOLUTION = 10
// Default map center: Mohakhali, Dhaka (H3 res-10 cell).
export const DEFAULT_CENTER_CELL = '8a3cf10c914ffff'

export const decodeCell = (cell: string): { latitude: number; longitude: number } => {
  const [latitude, longitude] = cellToLatLng(cell)

  return { latitude, longitude }
}

export const encodeCell = (lat: number, lng: number): string =>
  latLngToCell(lat, lng, H3_FINE_RESOLUTION)

export const safeCell = (cell: string): string =>
  isValidCell(cell) ? cell : DEFAULT_CENTER_CELL
