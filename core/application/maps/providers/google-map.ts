import axios from 'axios'
import {
  APIResponse,
  GeocodeRequest,
  GeocodeResponse,
  PlaceAutocompleteRequest,
  PlaceAutocompleteResponse
} from '../dto/googleMaps'
import { MapsProvider } from '../interface/Maps-provider'

export const config = {
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY ?? '',
  COUNTRY: process.env.COUNTRY ?? 'BD',
  GOOGLE_MAPS_BASE_URL: 'https://maps.googleapis.com/maps/api'
}

export class GoogleMapProvider implements MapsProvider {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly country: string = ''

  constructor() {
    this.baseUrl = config.GOOGLE_MAPS_BASE_URL
    this.apiKey = config.GOOGLE_MAPS_API_KEY
    this.country = config.COUNTRY
  }

  private validateAPIKey(): void {
    if (this.apiKey === '') {
      throw new Error('GOOGLE_MAPS_API_KEY is required')
    }
  }

  async getPlaceAutocomplete(params: PlaceAutocompleteRequest): Promise<APIResponse<PlaceAutocompleteResponse>> {
    try {
      this.validateAPIKey()

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
      this.validateAPIKey()

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
