import type { APIGatewayProxyResult } from 'aws-lambda'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { MapsHandler } from '../../maps/MapsHandler'
import type { GeocodeRequest } from '../../../application/maps/dto/Maps'
import { MapsService } from '../../../application/maps/MapsService'
import { GoogleMapsProvider } from '../../maps/providers/GoogleMaps'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'

const googleMapsProvider = new GoogleMapsProvider()
const mapsService = new MapsService(googleMapsProvider)
const mapsHandler = new MapsHandler(mapsService)

async function geocode (
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
