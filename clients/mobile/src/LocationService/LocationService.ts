import Constants from 'expo-constants'
import { FetchClient } from '../setup/clients/FetchClient'
const { APP_NAME, APP_VERSION, LOCATION_SERVICE_EMAIL, GOOGLE_MAP_API_KEY } = Constants.expoConfig?.extra ?? {}

export interface Coordinates {
  lat: string;
  lon: string;
}

interface GeocodeResponse {
  results: GeocodeResult[];
}

interface GeocodeResult {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface Prediction {
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
  terms?: Array<{ value: string }>;
  types: string[];
}

export class LocationService {
  private readonly httpClient: FetchClient

  constructor(baseUrl: string) {
    this.httpClient = new FetchClient(baseUrl)
  }

  async getCoordinates(location: string): Promise<{ latitude: number; longitude: number }> {
    try {
      const params = {
        q: location,
        format: 'json',
        limit: 1
      }

      const response = await this.httpClient.get<Coordinates[]>('/search', params, {
        'User-Agent': `${APP_NAME}/${APP_VERSION} (${LOCATION_SERVICE_EMAIL})`
      })
      const hasFirstResult = Object.prototype.hasOwnProperty.call(response, '0')
      if (hasFirstResult) {
        const { lat, lon } = response['0']
        return { latitude: +lat, longitude: +lon }
      } else {
        throw new Error(`Failed to retrieve coordinates for "${location}."`)
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve coordinates for "${location}."`)
      } else {
        throw new Error('An unexpected error occurred.')
      }
    }
  }

  async preferedLocationAutocomplete(location: string, city: string): Promise<Array<{ label: string; value: string }>> {
    const COUNTRY = 'BD'

    try {
      const response = await this.httpClient.get<{ predictions: Prediction[] }>('/place/autocomplete/json', {
        input: location,
        types: 'geocode',
        components: `country:${COUNTRY}`,
        key: GOOGLE_MAP_API_KEY
      })
      const formattedData = response.predictions
        .filter((prediction: Prediction) => {
          return (
            (prediction.types.includes('neighborhood') || prediction.types.includes('political'))
          )
        })
        .map((prediction: Prediction) => ({
          label: prediction.description,
          value: prediction.description
        }))

      return formattedData
    } catch (error) {
      console.error('Error fetching location autocomplete:', error)
      return []
    }
  }

  async getLatLon(location: string): Promise<{ latitude: number; longitude: number }> {
    try {
      const response = await this.httpClient.get<GeocodeResponse>('/geocode/json',
        {
          address: location,
          key: GOOGLE_MAP_API_KEY
        }
      )

      if (response.results.length > 0) {
        const { lat, lng } = response.results[0].geometry.location
        return { latitude: lat, longitude: lng }
      } else {
        throw new Error(`Failed to retrieve coordinates for "${location}."`)
      }
    } catch (error) {
      throw new Error(`Failed to retrieve coordinates for "${location}."`)
    }
  }

  async healthLocationAutocomplete(location: string): Promise<Array<{ label: string; value: string }>> {
    const COUNTRY = 'BD'

    try {
      const response = await this.httpClient.get<{ predictions: Prediction[] }>('/place/autocomplete/json', {
        input: location,
        types: 'establishment',
        components: `country:${COUNTRY}`,
        key: GOOGLE_MAP_API_KEY
      })

      const formattedData = response.predictions
        .filter((prediction: Prediction) => {
          return (
            (prediction.types.includes('hospital') ||
             prediction.types.includes('health') ||
             prediction.types.includes('pharmacy') ||
             prediction.types.includes('clinic'))
          )
        })
        .map((prediction: Prediction) => ({
          label: prediction.description,
          value: prediction.description
        }))

      return formattedData
    } catch (error) {
      console.error('Error fetching health location autocomplete:', error)
      return []
    }
  }
}
