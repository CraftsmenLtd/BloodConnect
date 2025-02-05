import {
  PlaceAutocompleteRequest,
  GeocodeRequest,
  APIResponse,
  PlaceAutocompleteResponse,
  GeocodeResponse
} from './dto/googleMaps'
import { MapsProvider } from './interface/Maps-provider'
import { GoogleMapProvider } from './providers/google-map'

export class MapsService {
  private readonly mapsProvider: MapsProvider

  constructor() {
    this.mapsProvider = new GoogleMapProvider()
  }

  async getPlaceAutocomplete(params: PlaceAutocompleteRequest): Promise<APIResponse<PlaceAutocompleteResponse>> {
    return this.mapsProvider.getPlaceAutocomplete(params)
  }

  async getGeocode(params: GeocodeRequest): Promise<APIResponse<GeocodeResponse>> {
    return this.mapsProvider.getGeocode(params)
  }
}
