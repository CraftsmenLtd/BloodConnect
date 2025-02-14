import {
  APIResponse,
  GeocodeRequest,
  GeocodeResponse,
  PlaceAutocompleteRequest,
  PlaceAutocompleteResponse
} from '../dto/Maps'

export interface MapsProvider {
  getPlaceAutocomplete(params: PlaceAutocompleteRequest): Promise<APIResponse<PlaceAutocompleteResponse>>;
  getGeocode(params: GeocodeRequest): Promise<APIResponse<GeocodeResponse>>;
  handleError(error: unknown): APIResponse<never>;
}
