import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { NearbyBloodRequestsService } from '../../../application/bloodDonationWorkflow/NearbyBloodRequestsService'
import NearbyBloodRequestsDynamoDbOperations from '../commons/ddbOperations/NearbyBloodRequestsDynamoDbOperations'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { Config } from '../../../../commons/libs/config/config'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const repo = new NearbyBloodRequestsDynamoDbOperations(config.dynamodbTableName, config.awsRegion)

type GetNearbyBloodRequestsEvent = {
  lat: string;
  lng: string;
  radius?: string;
  bloodGroup?: string;
  cursor?: string;
  pageSize?: string;
  countryCode?: string;
} & HttpLoggerAttributes

async function getNearbyBloodRequestsLambda(
  event: GetNearbyBloodRequestsEvent
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger('public', event.apiGwRequestId, event.cloudFrontRequestId)

  try {
    const lat = parseFloat(event.lat ?? '')
    const lng = parseFloat(event.lng ?? '')
    const radiusKm = event.radius !== undefined && event.radius !== '' ? parseFloat(event.radius) : undefined
    const bloodGroup = event.bloodGroup !== undefined && event.bloodGroup !== '' ? event.bloodGroup : undefined
    const cursor = event.cursor !== undefined && event.cursor !== '' ? event.cursor : undefined
    const pageSize = event.pageSize !== undefined && event.pageSize !== '' ? parseInt(event.pageSize, 10) : 20

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return generateApiGatewayResponse(
        { success: false, message: 'lat and lng query parameters are required' },
        HTTP_CODES.BAD_REQUEST
      )
    }

    const countryCode = event.countryCode !== undefined && event.countryCode !== '' ? event.countryCode : 'BD'

    const service = new NearbyBloodRequestsService(repo, httpLogger)
    const result = await service.getNearbyBloodRequests({
      lat,
      lng,
      radiusKm,
      countryCode,
      bloodGroup,
      pageSize,
      cursor
    })

    return generateApiGatewayResponse(
      {
        success: true,
        data: result.data,
        nextCursor: result.nextCursor,
        message: 'Blood requests retrieved successfully'
      },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    return generateApiGatewayResponse(
      { success: false, message: errorMessage },
      HTTP_CODES.ERROR
    )
  }
}

export default getNearbyBloodRequestsLambda
