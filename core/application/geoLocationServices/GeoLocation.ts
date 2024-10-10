export interface GeoLocation {
  getCoordinatesByPlaceName(place: string): Promise<{ lat: string; lon: string }>;
}
