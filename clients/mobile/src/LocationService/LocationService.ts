import { FetchClient } from '../setup/clients/FetchClient'

export interface Coordinates {
  lat: string;
  lon: string;
}

export interface Amenity {
  id: number;
  lat: number;
  lon: number;
  tags: {
    amenity: string;
    name?: string;
    [key: string]: string | undefined;
  };
}

export interface OverpassResponse {
  version: number;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: Amenity[];
}

export class LocationService {
  private readonly httpClient: FetchClient

  constructor(httpClient: FetchClient) {
    this.httpClient = httpClient
  }

  async getCoordinates(location: string): Promise<Coordinates> {
    try {
      const params = {
        q: location,
        format: 'json',
        limit: 1
      }

      const response = await this.httpClient.get<Coordinates[]>('https://nominatim.openstreetmap.org/search', params)

      if (response.length > 0) {
        const { lat, lon } = response[0]
        return { lat, lon }
      } else {
        throw new Error(`No coordinates found for location: ${location}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      throw new Error(`Failed to fetch coordinates: ${errorMessage}`)
    }
  }

  async getNearbyLocations(lat: string, lon: string, radius = 1000): Promise<Amenity[]> {
    try {
      const query = `
        [out:json];
        (
            node["amenity"="hospital"](around:${radius}, ${lat}, ${lon});
            relation["amenity"="hospital"](around:${radius}, ${lat}, ${lon});
            node["amenity"~"hospital|clinic|health"](around:${radius}, ${lat}, ${lon});
            relation["amenity"~"hospital|clinic|health"](around:${radius}, ${lat}, ${lon});
        );
        out body;
        >;
        out skel qt;
      `

      const response = await this.httpClient.post<OverpassResponse>(
        'https://overpass-api.de/api/interpreter',
        new URLSearchParams({ data: query }).toString(),
        { 'Content-Type': 'application/x-www-form-urlencoded' }
      )

      return response.elements
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      throw new Error(`Failed to fetch nearby locations: ${errorMessage}`)
    }
  }

  async getLocationAndNearbyPlaces(location: string, radius: number = 2500): Promise<Amenity[]> {
    try {
      const { lat, lon } = await this.getCoordinates(location)

      const nearbyPlaces = await this.getNearbyLocations(lat, lon, radius)
      const filteredPlaces = nearbyPlaces.map((place: any) => {
        return {
          lat: place.lat,
          lon: place.lon,
          name: place.tags?.name || 'Unknown Place'
        }
      })
      return filteredPlaces
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
      throw new Error(`Error in fetching location and nearby places: ${errorMessage}`)
    }
  }
}
