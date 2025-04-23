import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from 'application/bloodDonationWorkflow/BloodDonationService'
import type {
  DonationRecordEventAttributes
} from 'application/bloodDonationWorkflow/Types'
import { DonationStatus } from '../../../../commons/dto/DonationDTO'
import BloodDonationOperationError from 'application/bloodDonationWorkflow/BloodDonationOperationError'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { Config } from '../../../../commons/libs/config/config'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const bloodDonationDynamoDbOperations = new BloodDonationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function cancelBloodDonation(
  event: DonationRecordEventAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  const bloodDonationService = new BloodDonationService(bloodDonationDynamoDbOperations, httpLogger)
  try {
    await bloodDonationService.updateDonationStatus(
      event.seekerId,
      event.requestPostId,
      event.requestCreatedAt,
      DonationStatus.CANCELLED
    )

    return generateApiGatewayResponse(
      {
        message: 'Donation post cancelled successfully',
        success: true
      },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    const errorCode =
      error instanceof BloodDonationOperationError ? error.errorCode : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default cancelBloodDonation
