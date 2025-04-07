import type {
  PlaceAutocompleteRequest,
  GeocodeRequest,
  APIResponse,
  PlaceAutocompleteResponse,
  GeocodeResponse
} from './dto/Maps'
import type { MapsProvider } from '../models/maps/MapsProvider'

export class MapsService {
  private readonly mapsProvider: MapsProvider

  constructor(mapsProvider: MapsProvider) {
    this.mapsProvider = mapsProvider
  }

  async getPlaceAutocomplete(params: PlaceAutocompleteRequest): Promise<APIResponse<PlaceAutocompleteResponse>> {
    return this.mapsProvider.getPlaceAutocomplete(params)
  }

  async getGeocode(params: GeocodeRequest): Promise<APIResponse<GeocodeResponse>> {
    return this.mapsProvider.getGeocode(params)
  }
}
