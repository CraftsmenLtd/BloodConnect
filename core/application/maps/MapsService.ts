import {
  PlaceAutocompleteRequest,
  GeocodeRequest,
  APIResponse,
  PlaceAutocompleteResponse,
  GeocodeResponse
} from './dto/Maps'
import { MapsProvider } from './interfaces/MapsProvider'
import { GoogleMapsProvider } from './providers/GoogleMaps'

export class MapsService {
  private readonly mapsProvider: MapsProvider

  constructor() {
    this.mapsProvider = new GoogleMapsProvider()
  }

  async getPlaceAutocomplete(params: PlaceAutocompleteRequest): Promise<APIResponse<PlaceAutocompleteResponse>> {
    return this.mapsProvider.getPlaceAutocomplete(params)
  }

  async getGeocode(params: GeocodeRequest): Promise<APIResponse<GeocodeResponse>> {
    return this.mapsProvider.getGeocode(params)
  }
}
