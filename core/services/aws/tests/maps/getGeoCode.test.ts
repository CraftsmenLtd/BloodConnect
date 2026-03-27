import type { APIGatewayProxyResult } from 'aws-lambda'
import { MapsHandler } from '../../../maps/MapsHandler'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { GeocodeRequest } from '../../../../application/maps/dto/Maps'
import type { HttpLoggerAttributes } from '../../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../../commons/libs/constants/ApiResponseMessages'

jest.mock('../../../maps/MapsHandler')
jest.mock('../../../maps/providers/GoogleMaps')
jest.mock('../../commons/lambda/ApiGateway')
jest.mock('../../commons/logger/HttpLogger', () => ({
  createHTTPLogger: jest.fn(() => ({
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }))
}))

import geocode from '../../maps/getGeoCode'

const mockMapsHandler = MapsHandler as jest.MockedClass<typeof MapsHandler>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('geocode', () => {
  const mockEvent: GeocodeRequest & HttpLoggerAttributes = {
    address: '1600 Amphitheatre Parkway, Mountain View, CA',
    userId: 'test-user-id',
    apiGwRequestId: 'test-api-gw-request-id',
    cloudFrontRequestId: 'test-cloudfront-request-id'
  }

  const mockGeocodeResult = {
    data: {
      results: [
        {
          formatted_address: '1600 Amphitheatre Parkway, Mountain View, CA 94043, USA',
          geometry: {
            location: {
              lat: 37.4224764,
              lng: -122.0842499
            }
          }
        }
      ],
      status: 'OK'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully geocode an address and return results', async () => {
    mockMapsHandler.prototype.getGeocode.mockResolvedValue(mockGeocodeResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockGeocodeResult.data)
    })

    const result: APIGatewayProxyResult = await geocode(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockGeocodeResult.data)
    })
    expect(mockMapsHandler.prototype.getGeocode).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '1600 Amphitheatre Parkway, Mountain View, CA'
      })
    )
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      mockGeocodeResult.data,
      HTTP_CODES.OK
    )
  })

  it('should handle geocode with minimal results', async () => {
    const minimalResult = {
      data: {
        results: [],
        status: 'ZERO_RESULTS'
      }
    }
    mockMapsHandler.prototype.getGeocode.mockResolvedValue(minimalResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(minimalResult.data)
    })

    const result: APIGatewayProxyResult = await geocode(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(minimalResult.data)
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(minimalResult.data, HTTP_CODES.OK)
  })

  it('should handle null data by returning default empty results', async () => {
    const nullDataResult = {
      data: null
    }
    mockMapsHandler.prototype.getGeocode.mockResolvedValue(nullDataResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ results: [], status: 'OK' })
    })

    const result: APIGatewayProxyResult = await geocode(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ results: [], status: 'OK' })
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { results: [], status: 'OK' },
      HTTP_CODES.OK
    )
  })

  it('should handle undefined data by returning default empty results', async () => {
    const undefinedDataResult = {
      data: undefined
    }
    mockMapsHandler.prototype.getGeocode.mockResolvedValue(undefinedDataResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ results: [], status: 'OK' })
    })

    const result: APIGatewayProxyResult = await geocode(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ results: [], status: 'OK' })
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { results: [], status: 'OK' },
      HTTP_CODES.OK
    )
  })

  it('should return error response when standard Error is thrown', async () => {
    const errorMessage = 'Geocoding API failed'
    mockMapsHandler.prototype.getGeocode.mockRejectedValue(new Error(errorMessage))
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: JSON.stringify({
        success: false,
        error: {
          message: errorMessage,
          code: 'VALIDATION_ERROR'
        }
      })
    })

    const result: APIGatewayProxyResult = await geocode(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: JSON.stringify({
        success: false,
        error: {
          message: errorMessage,
          code: 'VALIDATION_ERROR'
        }
      })
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      {
        success: false,
        error: {
          message: errorMessage,
          code: 'VALIDATION_ERROR'
        }
      },
      HTTP_CODES.BAD_REQUEST
    )
  })

  it('should handle non-Error objects with default error message', async () => {
    const nonErrorObject = { random: 'error' }
    mockMapsHandler.prototype.getGeocode.mockRejectedValue(nonErrorObject)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: JSON.stringify({
        success: false,
        error: {
          message: UNKNOWN_ERROR_MESSAGE,
          code: 'VALIDATION_ERROR'
        }
      })
    })

    const result: APIGatewayProxyResult = await geocode(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: JSON.stringify({
        success: false,
        error: {
          message: UNKNOWN_ERROR_MESSAGE,
          code: 'VALIDATION_ERROR'
        }
      })
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      {
        success: false,
        error: {
          message: UNKNOWN_ERROR_MESSAGE,
          code: 'VALIDATION_ERROR'
        }
      },
      HTTP_CODES.BAD_REQUEST
    )
  })

  it('should handle international addresses', async () => {
    const internationalEvent = {
      ...mockEvent,
      address: 'Eiffel Tower, Paris, France'
    }
    const internationalResult = {
      data: {
        results: [
          {
            formatted_address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France',
            geometry: {
              location: {
                lat: 48.8583701,
                lng: 2.2944813
              }
            }
          }
        ],
        status: 'OK'
      }
    }

    mockMapsHandler.prototype.getGeocode.mockResolvedValue(internationalResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(internationalResult.data)
    })

    await geocode(internationalEvent)

    expect(mockMapsHandler.prototype.getGeocode).toHaveBeenCalledWith(
      expect.objectContaining({
        address: 'Eiffel Tower, Paris, France'
      })
    )
  })

  it('should handle addresses with special characters', async () => {
    const specialCharEvent = {
      ...mockEvent,
      address: 'Dhaka, Bangladesh - রোড নং ১২'
    }

    mockMapsHandler.prototype.getGeocode.mockResolvedValue(mockGeocodeResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockGeocodeResult.data)
    })

    await geocode(specialCharEvent)

    expect(mockMapsHandler.prototype.getGeocode).toHaveBeenCalledWith(
      expect.objectContaining({
        address: 'Dhaka, Bangladesh - রোড নং ১২'
      })
    )
  })

  it('should handle multiple geocode results', async () => {
    const multipleResults = {
      data: {
        results: [
          {
            formatted_address: 'Springfield, IL, USA',
            geometry: { location: { lat: 39.7817, lng: -89.6501 } }
          },
          {
            formatted_address: 'Springfield, MA, USA',
            geometry: { location: { lat: 42.1015, lng: -72.5898 } }
          },
          {
            formatted_address: 'Springfield, MO, USA',
            geometry: { location: { lat: 37.2090, lng: -93.2923 } }
          }
        ],
        status: 'OK'
      }
    }

    mockMapsHandler.prototype.getGeocode.mockResolvedValue(multipleResults)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(multipleResults.data)
    })

    const springfieldEvent = {
      ...mockEvent,
      address: 'Springfield'
    }

    const result: APIGatewayProxyResult = await geocode(springfieldEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(multipleResults.data)
    })
  })

  it('should handle validation errors gracefully', async () => {
    const validationError = new Error('Invalid address format')
    mockMapsHandler.prototype.getGeocode.mockRejectedValue(validationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: JSON.stringify({
        success: false,
        error: {
          message: 'Invalid address format',
          code: 'VALIDATION_ERROR'
        }
      })
    })

    const result: APIGatewayProxyResult = await geocode(mockEvent)

    expect(result.statusCode).toBe(HTTP_CODES.BAD_REQUEST)
  })

  it('should handle empty address string', async () => {
    const emptyAddressEvent = {
      ...mockEvent,
      address: ''
    }

    mockMapsHandler.prototype.getGeocode.mockResolvedValue({
      data: { results: [], status: 'INVALID_REQUEST' }
    })
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ results: [], status: 'INVALID_REQUEST' })
    })

    await geocode(emptyAddressEvent)

    expect(mockMapsHandler.prototype.getGeocode).toHaveBeenCalledWith(
      expect.objectContaining({
        address: ''
      })
    )
  })
})
