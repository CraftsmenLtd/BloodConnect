import { MapsService } from '../../maps/MapsService'
import type { MapsProvider } from '../../models/maps/MapsProvider'
import type {
  PlaceAutocompleteRequest,
  GeocodeRequest,
  APIResponse,
  PlaceAutocompleteResponse,
  GeocodeResponse
} from '../../maps/dto/Maps'

describe('MapsService', () => {
  let mapsService: MapsService
  let mockMapsProvider: jest.Mocked<MapsProvider>

  beforeEach(() => {
    mockMapsProvider = {
      getPlaceAutocomplete: jest.fn(),
      getGeocode: jest.fn()
    } as jest.Mocked<MapsProvider>

    mapsService = new MapsService(mockMapsProvider)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('getPlaceAutocomplete', () => {
    test('should call provider getPlaceAutocomplete and return successful response', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'Dhaka Medical',
        countryCode: 'BD',
        language: 'en'
      }

      const mockResponse: APIResponse<PlaceAutocompleteResponse> = {
        success: true,
        data: {
          predictions: [
            {
              description: 'Dhaka Medical College Hospital',
              place_id: 'ChIJxyz123',
              types: ['hospital', 'establishment'],
              structured_formatting: {
                main_text: 'Dhaka Medical College Hospital',
                secondary_text: 'Dhaka, Bangladesh'
              }
            }
          ],
          status: 'OK'
        }
      }

      mockMapsProvider.getPlaceAutocomplete.mockResolvedValue(mockResponse)

      const result = await mapsService.getPlaceAutocomplete(request)

      expect(mockMapsProvider.getPlaceAutocomplete).toHaveBeenCalledWith(request)
      expect(mockMapsProvider.getPlaceAutocomplete).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data?.predictions).toHaveLength(1)
    })

    test('should handle request with all optional parameters', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'Hospital',
        countryCode: 'BD',
        sessiontoken: 'session-token-123',
        components: 'country:bd',
        location: '23.8103,90.4125',
        radius: 5000,
        types: 'hospital',
        language: 'bn'
      }

      const mockResponse: APIResponse<PlaceAutocompleteResponse> = {
        success: true,
        data: {
          predictions: [],
          status: 'ZERO_RESULTS'
        }
      }

      mockMapsProvider.getPlaceAutocomplete.mockResolvedValue(mockResponse)

      const result = await mapsService.getPlaceAutocomplete(request)

      expect(mockMapsProvider.getPlaceAutocomplete).toHaveBeenCalledWith(request)
      expect(result).toEqual(mockResponse)
    })

    test('should return error response from provider', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'invalid',
        countryCode: 'XX'
      }

      const mockErrorResponse: APIResponse<PlaceAutocompleteResponse> = {
        success: false,
        error: {
          message: 'Invalid country code',
          code: 'INVALID_REQUEST'
        }
      }

      mockMapsProvider.getPlaceAutocomplete.mockResolvedValue(mockErrorResponse)

      const result = await mapsService.getPlaceAutocomplete(request)

      expect(mockMapsProvider.getPlaceAutocomplete).toHaveBeenCalledWith(request)
      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Invalid country code')
      expect(result.error?.code).toBe('INVALID_REQUEST')
    })

    test('should handle multiple predictions in response', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'Medical',
        countryCode: 'BD'
      }

      const mockResponse: APIResponse<PlaceAutocompleteResponse> = {
        success: true,
        data: {
          predictions: [
            {
              description: 'Dhaka Medical College',
              place_id: 'place1',
              types: ['hospital'],
              structured_formatting: {
                main_text: 'Dhaka Medical College'
              }
            },
            {
              description: 'Chittagong Medical College',
              place_id: 'place2',
              types: ['hospital'],
              structured_formatting: {
                main_text: 'Chittagong Medical College'
              }
            },
            {
              description: 'Sylhet Medical College',
              place_id: 'place3',
              types: ['hospital'],
              structured_formatting: {
                main_text: 'Sylhet Medical College'
              }
            }
          ],
          status: 'OK'
        }
      }

      mockMapsProvider.getPlaceAutocomplete.mockResolvedValue(mockResponse)

      const result = await mapsService.getPlaceAutocomplete(request)

      expect(result.data?.predictions).toHaveLength(3)
      expect(result.data?.predictions[0].description).toBe('Dhaka Medical College')
      expect(result.data?.predictions[1].description).toBe('Chittagong Medical College')
      expect(result.data?.predictions[2].description).toBe('Sylhet Medical College')
    })

    test('should propagate provider errors', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'test',
        countryCode: 'BD'
      }

      const error = new Error('Network error')
      mockMapsProvider.getPlaceAutocomplete.mockRejectedValue(error)

      await expect(
        mapsService.getPlaceAutocomplete(request)
      ).rejects.toThrow('Network error')
    })

    test('should handle empty input string', async () => {
      const request: PlaceAutocompleteRequest = {
        input: '',
        countryCode: 'BD'
      }

      const mockResponse: APIResponse<PlaceAutocompleteResponse> = {
        success: true,
        data: {
          predictions: [],
          status: 'ZERO_RESULTS'
        }
      }

      mockMapsProvider.getPlaceAutocomplete.mockResolvedValue(mockResponse)

      const result = await mapsService.getPlaceAutocomplete(request)

      expect(result.data?.predictions).toEqual([])
      expect(result.data?.status).toBe('ZERO_RESULTS')
    })

    test('should handle predictions with all optional fields', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'Gulshan',
        countryCode: 'BD'
      }

      const mockResponse: APIResponse<PlaceAutocompleteResponse> = {
        success: true,
        data: {
          predictions: [
            {
              description: 'Gulshan, Dhaka, Bangladesh',
              place_id: 'gulshan-place-id',
              types: ['locality', 'political'],
              structured_formatting: {
                main_text: 'Gulshan',
                secondary_text: 'Dhaka, Bangladesh'
              },
              terms: [
                { value: 'Gulshan' },
                { value: 'Dhaka' },
                { value: 'Bangladesh' }
              ]
            }
          ],
          status: 'OK'
        }
      }

      mockMapsProvider.getPlaceAutocomplete.mockResolvedValue(mockResponse)

      const result = await mapsService.getPlaceAutocomplete(request)

      expect(result.data?.predictions[0].terms).toHaveLength(3)
      expect(result.data?.predictions[0].structured_formatting?.secondary_text).toBe('Dhaka, Bangladesh')
    })
  })

  describe('getGeocode', () => {
    test('should call provider getGeocode and return successful response with address', async () => {
      const request: GeocodeRequest = {
        address: 'Dhaka Medical College Hospital, Dhaka'
      }

      const mockResponse: APIResponse<GeocodeResponse> = {
        success: true,
        data: {
          results: [
            {
              geometry: {
                location: {
                  lat: 23.7261,
                  lng: 90.3987
                }
              }
            }
          ],
          status: 'OK'
        }
      }

      mockMapsProvider.getGeocode.mockResolvedValue(mockResponse)

      const result = await mapsService.getGeocode(request)

      expect(mockMapsProvider.getGeocode).toHaveBeenCalledWith(request)
      expect(mockMapsProvider.getGeocode).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockResponse)
      expect(result.success).toBe(true)
      expect(result.data?.results[0].geometry.location.lat).toBe(23.7261)
      expect(result.data?.results[0].geometry.location.lng).toBe(90.3987)
    })

    test('should handle reverse geocoding with latlng', async () => {
      const request: GeocodeRequest = {
        latlng: '23.8103,90.4125'
      }

      const mockResponse: APIResponse<GeocodeResponse> = {
        success: true,
        data: {
          results: [
            {
              geometry: {
                location: {
                  lat: 23.8103,
                  lng: 90.4125
                }
              }
            }
          ],
          status: 'OK'
        }
      }

      mockMapsProvider.getGeocode.mockResolvedValue(mockResponse)

      const result = await mapsService.getGeocode(request)

      expect(mockMapsProvider.getGeocode).toHaveBeenCalledWith(request)
      expect(result.data?.results[0].geometry.location).toEqual({
        lat: 23.8103,
        lng: 90.4125
      })
    })

    test('should handle geocoding with place_id', async () => {
      const request: GeocodeRequest = {
        place_id: 'ChIJxyz123'
      }

      const mockResponse: APIResponse<GeocodeResponse> = {
        success: true,
        data: {
          results: [
            {
              geometry: {
                location: {
                  lat: 23.7500,
                  lng: 90.4000
                }
              }
            }
          ],
          status: 'OK'
        }
      }

      mockMapsProvider.getGeocode.mockResolvedValue(mockResponse)

      const result = await mapsService.getGeocode(request)

      expect(mockMapsProvider.getGeocode).toHaveBeenCalledWith(request)
      expect(result.data?.results).toHaveLength(1)
    })

    test('should handle request with language and region parameters', async () => {
      const request: GeocodeRequest = {
        address: 'Hospital',
        language: 'bn',
        region: 'bd'
      }

      const mockResponse: APIResponse<GeocodeResponse> = {
        success: true,
        data: {
          results: [
            {
              geometry: {
                location: {
                  lat: 23.8000,
                  lng: 90.4200
                }
              }
            }
          ],
          status: 'OK'
        }
      }

      mockMapsProvider.getGeocode.mockResolvedValue(mockResponse)

      const result = await mapsService.getGeocode(request)

      expect(mockMapsProvider.getGeocode).toHaveBeenCalledWith(request)
      expect(result).toEqual(mockResponse)
    })

    test('should return error response from provider', async () => {
      const request: GeocodeRequest = {
        address: 'nonexistent address'
      }

      const mockErrorResponse: APIResponse<GeocodeResponse> = {
        success: false,
        error: {
          message: 'Address not found',
          code: 'ZERO_RESULTS'
        }
      }

      mockMapsProvider.getGeocode.mockResolvedValue(mockErrorResponse)

      const result = await mapsService.getGeocode(request)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Address not found')
      expect(result.error?.code).toBe('ZERO_RESULTS')
    })

    test('should handle multiple results in response', async () => {
      const request: GeocodeRequest = {
        address: 'Main Street'
      }

      const mockResponse: APIResponse<GeocodeResponse> = {
        success: true,
        data: {
          results: [
            {
              geometry: {
                location: {
                  lat: 23.7000,
                  lng: 90.3500
                }
              }
            },
            {
              geometry: {
                location: {
                  lat: 23.8000,
                  lng: 90.4500
                }
              }
            }
          ],
          status: 'OK'
        }
      }

      mockMapsProvider.getGeocode.mockResolvedValue(mockResponse)

      const result = await mapsService.getGeocode(request)

      expect(result.data?.results).toHaveLength(2)
      expect(result.data?.results[0].geometry.location.lat).toBe(23.7000)
      expect(result.data?.results[1].geometry.location.lat).toBe(23.8000)
    })

    test('should propagate provider errors', async () => {
      const request: GeocodeRequest = {
        address: 'test'
      }

      const error = new Error('API request failed')
      mockMapsProvider.getGeocode.mockRejectedValue(error)

      await expect(
        mapsService.getGeocode(request)
      ).rejects.toThrow('API request failed')
    })

    test('should handle empty results', async () => {
      const request: GeocodeRequest = {
        address: 'unknown location'
      }

      const mockResponse: APIResponse<GeocodeResponse> = {
        success: true,
        data: {
          results: [],
          status: 'ZERO_RESULTS'
        }
      }

      mockMapsProvider.getGeocode.mockResolvedValue(mockResponse)

      const result = await mapsService.getGeocode(request)

      expect(result.data?.results).toEqual([])
      expect(result.data?.status).toBe('ZERO_RESULTS')
    })

    test('should handle coordinates with high precision', async () => {
      const request: GeocodeRequest = {
        latlng: '23.81030000,90.41250000'
      }

      const mockResponse: APIResponse<GeocodeResponse> = {
        success: true,
        data: {
          results: [
            {
              geometry: {
                location: {
                  lat: 23.81030000,
                  lng: 90.41250000
                }
              }
            }
          ],
          status: 'OK'
        }
      }

      mockMapsProvider.getGeocode.mockResolvedValue(mockResponse)

      const result = await mapsService.getGeocode(request)

      expect(result.data?.results[0].geometry.location.lat).toBe(23.81030000)
      expect(result.data?.results[0].geometry.location.lng).toBe(90.41250000)
    })
  })
})
