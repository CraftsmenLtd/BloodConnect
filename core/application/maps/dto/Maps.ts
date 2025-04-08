export type PlaceAutocompleteRequest = {
  input: string;
  sessiontoken?: string;
  components?: string;
  location?: string;
  radius?: number;
  types?: string;
  language?: string;
  countryCode: string;
}

export type PlaceAutocompleteResponse = {
  predictions: Prediction[];
  status: string;
}

export type GeocodeRequest = {
  address?: string;
  latlng?: string;
  place_id?: string;
  language?: string;
  region?: string;
}

export type GeocodeResponse = {
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

export type Prediction = {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
  terms?: Array<{ value: string }>;
  types: string[];
}

export type APIResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}
