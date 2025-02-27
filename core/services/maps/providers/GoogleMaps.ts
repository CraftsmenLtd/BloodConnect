import axios from 'axios'
import {
  APIResponse,
  GeocodeRequest,
  GeocodeResponse,
  PlaceAutocompleteRequest,
  PlaceAutocompleteResponse
} from '../../../application/maps/dto/Maps'
import { MapsProvider } from '../../../application/models/maps/MapsProvider'

// TODO: Move this to config module
export const config = {
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? '',
  COUNTRY: process.env.COUNTRY ?? 'BD',
  GOOGLE_MAPS_BASE_URL: 'https://maps.googleapis.com/maps/api'
}

export class GoogleMapsProvider implements MapsProvider {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly country: string = ''

  constructor(apiKey?: string) {
    this.baseUrl = config.GOOGLE_MAPS_BASE_URL
    this.apiKey = apiKey ?? config.GOOGLE_MAPS_API_KEY
    this.country = config.COUNTRY
    this.validateAPIKey()
  }

  private validateAPIKey(): void {
    if (this.apiKey === '') {
      throw new Error('GOOGLE_MAPS_API_KEY is required')
    }
  }

  async getPlaceAutocomplete(params: PlaceAutocompleteRequest): Promise<APIResponse<PlaceAutocompleteResponse>> {
    try {
      const response = await axios.get(`${this.baseUrl}/place/autocomplete/json`, {
        params: {
          ...params,
          components: params.components ?? `country:${this.country}`,
          key: this.apiKey
        }
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  async getGeocode(params: GeocodeRequest): Promise<APIResponse<GeocodeResponse>> {
    try {
      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          ...params,
          key: this.apiKey
        }
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return this.handleError(error)
    }
  }

  handleError(error: unknown): APIResponse<never> {
    const axiosError = error as { response?: { data?: { error_message?: string; status?: string } }; message?: string }
    return {
      success: false,
      error: {
        message: axiosError.response?.data?.error_message ??
                (axiosError.message as string) ??
                'An error occurred',
        code: axiosError.response?.data?.status ?? 'UNKNOWN_ERROR'
      }
    }
  }
}
