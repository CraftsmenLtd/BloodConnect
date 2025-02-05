import { APIGatewayProxyResult } from 'aws-lambda'
import { z } from 'zod'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { MapsService } from '../../../application/maps/MapsService'
import { PlaceAutocompleteRequest } from '../../../application/maps/dto/googleMaps'
import { createHTTPLogger, HttpLoggerAttributes } from '../commons/httpLogger/HttpLogger'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'

const placeAutocompleteSchema = z.object({
  input: z.string().min(1),
  sessiontoken: z.string().optional(),
  components: z.string().optional(),
  location: z.string().optional(),
  radius: z.number().positive().optional(),
  types: z.string().optional(),
  language: z.string().optional()
})

const mapsService = new MapsService()

async function placeAutocomplete(
  event: PlaceAutocompleteRequest & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.userId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )

  try {
    const validatedParams = placeAutocompleteSchema.parse(event)

    const result = await mapsService.getPlaceAutocomplete(validatedParams)

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

export default placeAutocomplete
