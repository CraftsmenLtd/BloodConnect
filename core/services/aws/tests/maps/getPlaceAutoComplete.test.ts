import type { APIGatewayProxyResult } from 'aws-lambda'
import { MapsHandler } from '../../../maps/MapsHandler'
import generateApiGatewayResponse from '../../commons/lambda/ApiGateway'
import { HTTP_CODES } from '../../../../../commons/libs/constants/GenericCodes'
import type { PlaceAutocompleteRequest } from '../../../../application/maps/dto/Maps'
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

import placeAutocomplete from '../../maps/getPlaceAutoComplete'

const mockMapsHandler = MapsHandler as jest.MockedClass<typeof MapsHandler>
const mockGenerateApiGatewayResponse = generateApiGatewayResponse as jest.Mock

describe('placeAutocomplete', () => {
  const mockEvent: PlaceAutocompleteRequest & HttpLoggerAttributes = {
    input: 'Dhaka',
    userId: 'test-user-id',
    apiGwRequestId: 'test-api-gw-request-id',
    cloudFrontRequestId: 'test-cloudfront-request-id'
  }

  const mockAutocompleteResult = {
    data: {
      predictions: [
        {
          description: 'Dhaka, Bangladesh',
          place_id: 'ChIJgWoBeLc5VTcRqXbP02JYeLk',
          structured_formatting: {
            main_text: 'Dhaka',
            secondary_text: 'Bangladesh'
          }
        },
        {
          description: 'Dhaka Division, Bangladesh',
          place_id: 'ChIJ0wuiwrk5VTcR_4RGNbnNvA8',
          structured_formatting: {
            main_text: 'Dhaka Division',
            secondary_text: 'Bangladesh'
          }
        }
      ],
      status: 'OK'
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully get place autocomplete suggestions and return results', async () => {
    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue(mockAutocompleteResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockAutocompleteResult.data)
    })

    const result: APIGatewayProxyResult = await placeAutocomplete(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockAutocompleteResult.data)
    })
    expect(mockMapsHandler.prototype.getPlaceAutocomplete).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'Dhaka'
      })
    )
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      mockAutocompleteResult.data,
      HTTP_CODES.OK
    )
  })

  it('should handle autocomplete with no predictions', async () => {
    const emptyResult = {
      data: {
        predictions: [],
        status: 'ZERO_RESULTS'
      }
    }
    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue(emptyResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(emptyResult.data)
    })

    const result: APIGatewayProxyResult = await placeAutocomplete(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(emptyResult.data)
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(emptyResult.data, HTTP_CODES.OK)
  })

  it('should handle null data by returning default empty predictions', async () => {
    const nullDataResult = {
      data: null
    }
    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue(nullDataResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ predictions: [], status: 'OK' })
    })

    const result: APIGatewayProxyResult = await placeAutocomplete(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ predictions: [], status: 'OK' })
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { predictions: [], status: 'OK' },
      HTTP_CODES.OK
    )
  })

  it('should handle undefined data by returning default empty predictions', async () => {
    const undefinedDataResult = {
      data: undefined
    }
    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue(undefinedDataResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ predictions: [], status: 'OK' })
    })

    const result: APIGatewayProxyResult = await placeAutocomplete(mockEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ predictions: [], status: 'OK' })
    })
    expect(mockGenerateApiGatewayResponse).toHaveBeenCalledWith(
      { predictions: [], status: 'OK' },
      HTTP_CODES.OK
    )
  })

  it('should return error response when standard Error is thrown', async () => {
    const errorMessage = 'Place Autocomplete API failed'
    mockMapsHandler.prototype.getPlaceAutocomplete.mockRejectedValue(new Error(errorMessage))
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

    const result: APIGatewayProxyResult = await placeAutocomplete(mockEvent)

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
    mockMapsHandler.prototype.getPlaceAutocomplete.mockRejectedValue(nonErrorObject)
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

    const result: APIGatewayProxyResult = await placeAutocomplete(mockEvent)

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

  it('should handle partial input strings', async () => {
    const partialInputEvent = {
      ...mockEvent,
      input: 'New Y'
    }
    const partialResult = {
      data: {
        predictions: [
          {
            description: 'New York, NY, USA',
            place_id: 'ChIJOwg_06VPwokRYv534QaPC8g',
            structured_formatting: {
              main_text: 'New York',
              secondary_text: 'NY, USA'
            }
          },
          {
            description: 'New York, USA',
            place_id: 'ChIJqaUj8fBLzEwRZ5UY3sHGz90',
            structured_formatting: {
              main_text: 'New York',
              secondary_text: 'USA'
            }
          }
        ],
        status: 'OK'
      }
    }

    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue(partialResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(partialResult.data)
    })

    await placeAutocomplete(partialInputEvent)

    expect(mockMapsHandler.prototype.getPlaceAutocomplete).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'New Y'
      })
    )
  })

  it('should handle input with special characters', async () => {
    const specialCharEvent = {
      ...mockEvent,
      input: 'Café Rouge, Paris'
    }

    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue(mockAutocompleteResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockAutocompleteResult.data)
    })

    await placeAutocomplete(specialCharEvent)

    expect(mockMapsHandler.prototype.getPlaceAutocomplete).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'Café Rouge, Paris'
      })
    )
  })

  it('should handle input with non-Latin characters', async () => {
    const nonLatinEvent = {
      ...mockEvent,
      input: 'ঢাকা'
    }

    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue(mockAutocompleteResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockAutocompleteResult.data)
    })

    await placeAutocomplete(nonLatinEvent)

    expect(mockMapsHandler.prototype.getPlaceAutocomplete).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'ঢাকা'
      })
    )
  })

  it('should handle multiple predictions with detailed structure', async () => {
    const detailedResult = {
      data: {
        predictions: [
          {
            description: 'City Hospital, Dhaka, Bangladesh',
            place_id: 'place-id-1',
            structured_formatting: {
              main_text: 'City Hospital',
              secondary_text: 'Dhaka, Bangladesh'
            },
            types: ['hospital', 'health', 'point_of_interest']
          },
          {
            description: 'General Hospital, Dhaka, Bangladesh',
            place_id: 'place-id-2',
            structured_formatting: {
              main_text: 'General Hospital',
              secondary_text: 'Dhaka, Bangladesh'
            },
            types: ['hospital', 'health', 'point_of_interest']
          }
        ],
        status: 'OK'
      }
    }

    const hospitalEvent = {
      ...mockEvent,
      input: 'Hospital Dhaka'
    }

    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue(detailedResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(detailedResult.data)
    })

    const result: APIGatewayProxyResult = await placeAutocomplete(hospitalEvent)

    expect(result).toEqual({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(detailedResult.data)
    })
  })

  it('should handle validation errors gracefully', async () => {
    const validationError = new Error('Invalid input format')
    mockMapsHandler.prototype.getPlaceAutocomplete.mockRejectedValue(validationError)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.BAD_REQUEST,
      body: JSON.stringify({
        success: false,
        error: {
          message: 'Invalid input format',
          code: 'VALIDATION_ERROR'
        }
      })
    })

    const result: APIGatewayProxyResult = await placeAutocomplete(mockEvent)

    expect(result.statusCode).toBe(HTTP_CODES.BAD_REQUEST)
  })

  it('should handle empty input string', async () => {
    const emptyInputEvent = {
      ...mockEvent,
      input: ''
    }

    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue({
      data: { predictions: [], status: 'INVALID_REQUEST' }
    })
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify({ predictions: [], status: 'INVALID_REQUEST' })
    })

    await placeAutocomplete(emptyInputEvent)

    expect(mockMapsHandler.prototype.getPlaceAutocomplete).toHaveBeenCalledWith(
      expect.objectContaining({
        input: ''
      })
    )
  })

  it('should handle single character input', async () => {
    const singleCharEvent = {
      ...mockEvent,
      input: 'D'
    }

    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue(mockAutocompleteResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockAutocompleteResult.data)
    })

    await placeAutocomplete(singleCharEvent)

    expect(mockMapsHandler.prototype.getPlaceAutocomplete).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'D'
      })
    )
  })

  it('should handle long input strings', async () => {
    const longInputEvent = {
      ...mockEvent,
      input: 'Very long address string with multiple components including city state and country information'
    }

    mockMapsHandler.prototype.getPlaceAutocomplete.mockResolvedValue(mockAutocompleteResult)
    mockGenerateApiGatewayResponse.mockReturnValue({
      statusCode: HTTP_CODES.OK,
      body: JSON.stringify(mockAutocompleteResult.data)
    })

    await placeAutocomplete(longInputEvent)

    expect(mockMapsHandler.prototype.getPlaceAutocomplete).toHaveBeenCalledWith(
      expect.objectContaining({
        input: 'Very long address string with multiple components including city state and country information'
      })
    )
  })
})
