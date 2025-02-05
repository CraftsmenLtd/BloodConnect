import { APIGatewayProxyResult } from 'aws-lambda'
import { z } from 'zod'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { config, GoogleMapsService } from '../../../application/maps/GoogleMapsService'
import { GeocodeRequest } from '../../../application/maps/dto/googleMaps'
import { createHTTPLogger, HttpLoggerAttributes } from '../commons/httpLogger/HttpLogger'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'

const geocodeSchema = z.object({
  address: z.string().optional(),
  latlng: z.string().optional(),
  place_id: z.string().optional(),
  language: z.string().optional(),
  region: z.string().optional()
}).refine(data => (
  data?.address === null || data?.latlng === null || data?.place_id === null
), {
  message: 'At least one of address, latlng, or place_id must be provided'
})

const googleMapsService = new GoogleMapsService()

async function geocode(
  event: GeocodeRequest & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.userId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )

  try {
    if (config.GOOGLE_MAPS_API_KEY === '') {
      throw new Error('GOOGLE_MAPS_API_KEY is required')
    }
    const validatedParams = geocodeSchema.parse(event)

    const result = await googleMapsService.getGeocode(validatedParams)

    return generateApiGatewayResponse(
      {
        success: true,
        data: result,
        message: 'Geo code retrieved successfully'
      },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    return generateApiGatewayResponse({
      success: false,
      error: {
        message: error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE,
        code: 'VALIDATION_ERROR'
      }
    }, HTTP_CODES.BAD_REQUEST)
  }
}

export default geocode
