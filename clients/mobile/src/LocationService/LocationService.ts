import Constants from 'expo-constants'
import { FetchClient } from '../setup/clients/FetchClient'
const { APP_NAME, APP_VERSION, LOCATION_SERVICE_EMAIL } = Constants.expoConfig?.extra ?? {}

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

  constructor() {
    this.httpClient = new FetchClient('https://nominatim.openstreetmap.org')
  }

  async getCoordinates(location: string): Promise<Coordinates> {
    try {
      const params = {
        q: location,
        format: 'json',
        limit: 1
      }

      const response = await this.httpClient.get<Coordinates[]>('/search', params, {
        'User-Agent': `${APP_NAME}/${APP_VERSION} (${LOCATION_SERVICE_EMAIL})`
      })
      console.log('RESPONSE', response)
      const hasFirstResult = Object.prototype.hasOwnProperty.call(response, '0')
      if (hasFirstResult) {
        const { lat, lon } = response['0']
        return { lat, lon }
      } else {
        throw new Error(`Failed to retrieve coordinates for ${location}`)
      }
    } catch (error: unknown) {
      console.log('error', error)
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve coordinates for "${location}.`)
      } else {
        throw new Error('An unexpected error occurred.')
      }
    }
  }
}
