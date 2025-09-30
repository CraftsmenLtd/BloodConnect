import Constants from 'expo-constants'
import { FetchClient } from '../setup/clients/FetchClient'
import { stringToNumber } from '../utility/stringParser'
const { APP_NAME, APP_VERSION, LOCATION_SERVICE_EMAIL } = Constants.expoConfig?.extra ?? {}

export type Coordinates = {
  lat: string;
  lon: string;
}

type GeocodeResponse = {
  results: GeocodeResult[];
}

type GeocodeResult = {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

type Prediction = {
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

        return { latitude: stringToNumber(lat), longitude: stringToNumber(lon) }
      }
      throw new Error(`Failed to retrieve coordinates for "${location}."`)
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to retrieve coordinates for "${location}."`)
      }
      throw new Error('An unexpected error occurred.')
    }
  }

  filterAndFormatPredictions(predictions: Prediction[], allowedTypes: string[]): Array<{ label: string; value: string }> {
    return predictions.reduce((acc: Array<{ label: string; value: string }>, prediction) => {
      if (prediction.types.some((type) => allowedTypes.includes(type))) {
        acc.push({
          label: prediction.description,
          value: prediction.description
        })
      }

      return acc
    }, [])
  }

  async preferredLocationAutocomplete(location: string): Promise<Array<{ label: string; value: string }>> {
    try {
      const response = await this.httpClient.get<{ predictions: Prediction[] }>(
        '/maps/place/autocomplete/json', {
          input: location,
          types: 'geocode'
        }
      )

      return this.filterAndFormatPredictions(response.predictions, ['neighborhood', 'political'])
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error('Failed to fetch preferred location suggestions')
    }
  }

  async getLatLon(location: string): Promise<{ latitude: number; longitude: number }> {
    try {
      const response = await this.httpClient.get<GeocodeResponse>('/maps/geocode/json', {
        address: location
      })

      if (response.results.length > 0) {
        const { lat, lng } = response.results[0].geometry.location

        return { latitude: lat, longitude: lng }
      }
      throw new Error(`Failed to retrieve coordinates for "${location}."`)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error(`Failed to retrieve coordinates for "${location}."`)
    }
  }

  async healthLocationAutocomplete(location: string): Promise<Array<{ label: string; value: string }>> {
    if (location === '') return []
    try {
      const response = await this.httpClient.get<{ predictions: Prediction[] }>(
        '/maps/place/autocomplete/json', {
          input: location,
          types: 'establishment'
        })

      return this.filterAndFormatPredictions(response.predictions, ['hospital', 'health', 'pharmacy', 'clinic'])
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      throw new Error('Failed to fetch health location suggestions')
    }
  }
}
