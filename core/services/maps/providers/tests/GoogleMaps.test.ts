import axios from 'axios'
import { GoogleMapsProvider, config } from '../GoogleMaps'
import type {
  PlaceAutocompleteRequest,
  GeocodeRequest,
  PlaceAutocompleteResponse,
  GeocodeResponse
} from '../../../../application/maps/dto/Maps'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

describe('GoogleMapsProvider', () => {
  const mockApiKey = 'test-api-key-123'
  let googleMapsProvider: GoogleMapsProvider

  beforeEach(() => {
    jest.clearAllMocks()
    googleMapsProvider = new GoogleMapsProvider(mockApiKey)
  })

  describe('constructor', () => {
    it('should initialize with provided API key', () => {
      const provider = new GoogleMapsProvider('custom-key')
      expect(provider).toBeInstanceOf(GoogleMapsProvider)
    })

    it('should initialize with API key from config if not provided', () => {
      const originalKey = config.GOOGLE_MAPS_API_KEY
      config.GOOGLE_MAPS_API_KEY = 'config-api-key'

      const provider = new GoogleMapsProvider()
      expect(provider).toBeInstanceOf(GoogleMapsProvider)

      config.GOOGLE_MAPS_API_KEY = originalKey
    })

    it('should throw error if API key is empty string', () => {
      config.GOOGLE_MAPS_API_KEY = ''

      expect(() => new GoogleMapsProvider()).toThrow('GOOGLE_MAPS_API_KEY is required')
    })

    it('should throw error if provided API key is empty string', () => {
      expect(() => new GoogleMapsProvider('')).toThrow('GOOGLE_MAPS_API_KEY is required')
    })
  })

  describe('getPlaceAutocomplete', () => {
    it('should return successful response with predictions', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'Mirpur',
        countryCode: 'BD'
      }

      const mockResponseData: PlaceAutocompleteResponse = {
        predictions: [
          {
            description: 'Mirpur-1, Dhaka, Bangladesh',
            place_id: 'ChIJ3SnOb-nAVTcRTeapq1GezWw',
            structured_formatting: {
              main_text: 'Mirpur-1',
              secondary_text: 'Dhaka, Bangladesh'
            },
            terms: [
              { value: 'Mirpur-1' },
              { value: 'Dhaka' },
              { value: 'Bangladesh' }
            ],
            types: ['neighborhood', 'geocode', 'political']
          }
        ],
        status: 'OK'
      }

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      const result = await googleMapsProvider.getPlaceAutocomplete(request)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.GOOGLE_MAPS_BASE_URL}/place/autocomplete/json`,
        {
          params: {
            input: 'Mirpur',
            countryCode: 'BD',
            components: 'country:BD',
            key: mockApiKey
          }
        }
      )
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponseData)
      expect(result.data?.predictions).toHaveLength(1)
    })

    it('should use custom components if provided in request', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'Hospital',
        countryCode: 'BD',
        components: 'country:bd|locality:dhaka'
      }

      const mockResponseData: PlaceAutocompleteResponse = {
        predictions: [],
        status: 'OK'
      }

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      await googleMapsProvider.getPlaceAutocomplete(request)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.GOOGLE_MAPS_BASE_URL}/place/autocomplete/json`,
        {
          params: {
            input: 'Hospital',
            countryCode: 'BD',
            components: 'country:bd|locality:dhaka',
            key: mockApiKey
          }
        }
      )
    })

    it('should handle request with all optional parameters', async () => {
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

      const mockResponseData: PlaceAutocompleteResponse = {
        predictions: [],
        status: 'OK'
      }

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      const result = await googleMapsProvider.getPlaceAutocomplete(request)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.GOOGLE_MAPS_BASE_URL}/place/autocomplete/json`,
        {
          params: {
            ...request,
            key: mockApiKey
          }
        }
      )
      expect(result.success).toBe(true)
    })

    it('should return error response when API call fails', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'test',
        countryCode: 'BD'
      }

      const mockError = {
        response: {
          data: {
            error_message: 'Invalid request',
            status: 'INVALID_REQUEST'
          }
        }
      }

      mockedAxios.get.mockRejectedValue(mockError)

      const result = await googleMapsProvider.getPlaceAutocomplete(request)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Invalid request')
      expect(result.error?.code).toBe('INVALID_REQUEST')
    })

    it('should handle multiple predictions in response', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'Medical',
        countryCode: 'BD'
      }

      const mockResponseData: PlaceAutocompleteResponse = {
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
          }
        ],
        status: 'OK'
      }

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      const result = await googleMapsProvider.getPlaceAutocomplete(request)

      expect(result.success).toBe(true)
      expect(result.data?.predictions).toHaveLength(2)
    })

    it('should handle ZERO_RESULTS status', async () => {
      const request: PlaceAutocompleteRequest = {
        input: 'nonexistent place',
        countryCode: 'BD'
      }

      const mockResponseData: PlaceAutocompleteResponse = {
        predictions: [],
        status: 'ZERO_RESULTS'
      }

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      const result = await googleMapsProvider.getPlaceAutocomplete(request)

      expect(result.success).toBe(true)
      expect(result.data?.predictions).toEqual([])
      expect(result.data?.status).toBe('ZERO_RESULTS')
    })
  })

  describe('getGeocode', () => {
    it('should return successful geocode response with address', async () => {
      const request: GeocodeRequest = {
        address: 'Mirpur, Dhaka'
      }

      const mockResponseData: GeocodeResponse = {
        results: [
          {
            geometry: {
              location: {
                lat: 23.8223486,
                lng: 90.36542039999999
              }
            }
          }
        ],
        status: 'OK'
      }

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      const result = await googleMapsProvider.getGeocode(request)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.GOOGLE_MAPS_BASE_URL}/geocode/json`,
        {
          params: {
            address: 'Mirpur, Dhaka',
            key: mockApiKey
          }
        }
      )
      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponseData)
      expect(result.data?.results[0].geometry.location.lat).toBe(23.8223486)
    })

    it('should handle reverse geocoding with latlng', async () => {
      const request: GeocodeRequest = {
        latlng: '23.8103,90.4125'
      }

      const mockResponseData: GeocodeResponse = {
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

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      const result = await googleMapsProvider.getGeocode(request)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.GOOGLE_MAPS_BASE_URL}/geocode/json`,
        {
          params: {
            latlng: '23.8103,90.4125',
            key: mockApiKey
          }
        }
      )
      expect(result.success).toBe(true)
      expect(result.data?.results[0].geometry.location).toEqual({
        lat: 23.8103,
        lng: 90.4125
      })
    })

    it('should handle geocoding with place_id', async () => {
      const request: GeocodeRequest = {
        place_id: 'ChIJxyz123'
      }

      const mockResponseData: GeocodeResponse = {
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

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      const result = await googleMapsProvider.getGeocode(request)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.GOOGLE_MAPS_BASE_URL}/geocode/json`,
        {
          params: {
            place_id: 'ChIJxyz123',
            key: mockApiKey
          }
        }
      )
      expect(result.success).toBe(true)
    })

    it('should handle request with language and region parameters', async () => {
      const request: GeocodeRequest = {
        address: 'Hospital',
        language: 'bn',
        region: 'bd'
      }

      const mockResponseData: GeocodeResponse = {
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

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      const result = await googleMapsProvider.getGeocode(request)

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.GOOGLE_MAPS_BASE_URL}/geocode/json`,
        {
          params: {
            address: 'Hospital',
            language: 'bn',
            region: 'bd',
            key: mockApiKey
          }
        }
      )
      expect(result.success).toBe(true)
    })

    it('should return error response when API call fails', async () => {
      const request: GeocodeRequest = {
        address: 'invalid address'
      }

      const mockError = {
        response: {
          data: {
            error_message: 'Address not found',
            status: 'ZERO_RESULTS'
          }
        }
      }

      mockedAxios.get.mockRejectedValue(mockError)

      const result = await googleMapsProvider.getGeocode(request)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Address not found')
      expect(result.error?.code).toBe('ZERO_RESULTS')
    })

    it('should handle multiple results in response', async () => {
      const request: GeocodeRequest = {
        address: 'Main Street'
      }

      const mockResponseData: GeocodeResponse = {
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

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      const result = await googleMapsProvider.getGeocode(request)

      expect(result.success).toBe(true)
      expect(result.data?.results).toHaveLength(2)
    })

    it('should handle empty results', async () => {
      const request: GeocodeRequest = {
        address: 'unknown location'
      }

      const mockResponseData: GeocodeResponse = {
        results: [],
        status: 'ZERO_RESULTS'
      }

      mockedAxios.get.mockResolvedValue({ data: mockResponseData })

      const result = await googleMapsProvider.getGeocode(request)

      expect(result.success).toBe(true)
      expect(result.data?.results).toEqual([])
      expect(result.data?.status).toBe('ZERO_RESULTS')
    })
  })

  describe('handleError', () => {
    it('should handle error with response data', () => {
      const error = {
        response: {
          data: {
            error_message: 'API key is invalid',
            status: 'REQUEST_DENIED'
          }
        }
      }

      const result = googleMapsProvider.handleError(error)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('API key is invalid')
      expect(result.error?.code).toBe('REQUEST_DENIED')
    })

    it('should handle error with only message', () => {
      const error = {
        message: 'Network error occurred'
      }

      const result = googleMapsProvider.handleError(error)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Network error occurred')
      expect(result.error?.code).toBe('UNKNOWN_ERROR')
    })

    it('should handle unknown error format', () => {
      const error = {}

      const result = googleMapsProvider.handleError(error)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('An error occurred')
      expect(result.error?.code).toBe('UNKNOWN_ERROR')
    })

    it('should handle error with partial response data', () => {
      const error = {
        response: {
          data: {
            error_message: 'Rate limit exceeded'
          }
        }
      }

      const result = googleMapsProvider.handleError(error)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('Rate limit exceeded')
      expect(result.error?.code).toBe('UNKNOWN_ERROR')
    })

    it('should handle network timeout error', () => {
      const error = {
        message: 'timeout of 5000ms exceeded'
      }

      const result = googleMapsProvider.handleError(error)

      expect(result.success).toBe(false)
      expect(result.error?.message).toBe('timeout of 5000ms exceeded')
      expect(result.error?.code).toBe('UNKNOWN_ERROR')
    })

    it('should handle different Google Maps API error codes', () => {
      const errorCodes = [
        'OVER_QUERY_LIMIT',
        'REQUEST_DENIED',
        'INVALID_REQUEST',
        'UNKNOWN_ERROR',
        'ZERO_RESULTS',
        'MAX_WAYPOINTS_EXCEEDED',
        'MAX_ROUTE_LENGTH_EXCEEDED',
        'NOT_FOUND'
      ]

      errorCodes.forEach((code) => {
        const error = {
          response: {
            data: {
              error_message: `Error with code: ${code}`,
              status: code
            }
          }
        }

        const result = googleMapsProvider.handleError(error)

        expect(result.success).toBe(false)
        expect(result.error?.code).toBe(code)
      })
    })
  })

  describe('config', () => {
    it('should have correct default base URL', () => {
      expect(config.GOOGLE_MAPS_BASE_URL).toBe('https://maps.googleapis.com/maps/api')
    })

    it('should use environment variable for country or default to BD', () => {
      expect(config.COUNTRY).toBeDefined()
    })
  })
})
