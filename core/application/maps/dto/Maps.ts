export interface PlaceAutocompleteRequest {
  input: string;
  sessiontoken?: string;
  components?: string;
  location?: string;
  radius?: number;
  types?: string;
  language?: string;
}

export interface PlaceAutocompleteResponse {
  predictions: Prediction[];
  status: string;
}

export interface GeocodeRequest {
  address?: string;
  latlng?: string;
  place_id?: string;
  language?: string;
  region?: string;
}

export interface GeocodeResponse {
  results: Array<{
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }>;
  status: string;
}

export interface Prediction {
  description: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
  terms?: Array<{ value: string }>;
  types: string[];
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}
