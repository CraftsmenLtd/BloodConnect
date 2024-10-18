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
      throw new Error('No coordinates found for location.')
    }
  }
}
