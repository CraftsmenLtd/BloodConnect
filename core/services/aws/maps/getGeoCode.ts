import { APIGatewayProxyResult } from 'aws-lambda'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { MapsHandler } from '../../../application/maps/MapsHandler'
import { GeocodeRequest } from '../../../application/maps/dto/Maps'
import { createHTTPLogger, HttpLoggerAttributes } from '../commons/httpLogger/HttpLogger'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'

const mapsHandler = new MapsHandler()

async function geocode(
  event: GeocodeRequest & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.userId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )

  try {
    const result = await mapsHandler.getGeocode({
      ...event as GeocodeRequest
    })

    return generateApiGatewayResponse(
      result.data ?? { results: [], status: 'OK' },
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
