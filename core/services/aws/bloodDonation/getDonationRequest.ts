import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import type { GetDonationRequestAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import DonationRecordOperationError from '../../../application/bloodDonationWorkflow/DonationRecordOperationError'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import AcceptDonationDynamoDbOperations from '../commons/ddbOperations/AcceptedDonationDynamoDbOperations'
import { Config } from '../../../../commons/libs/config/config'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const bloodDonationDynamoDbOperations = new BloodDonationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const acceptDonationDynamoDbOperations = new AcceptDonationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function getDonationRequestLambda(
  event: GetDonationRequestAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  const bloodDonationService = new BloodDonationService(bloodDonationDynamoDbOperations, httpLogger)
  const acceptDonationService = new AcceptDonationService(acceptDonationDynamoDbOperations, httpLogger)
  try {
    const { seekerId, requestPostId, createdAt } = event
    const donationDetails = await bloodDonationService.getDonationRequestDetails(
      seekerId,
      requestPostId,
      createdAt,
      acceptDonationService
    )
    return generateApiGatewayResponse(
      {
        success: true,
        data: donationDetails,
        message: 'Donation completed and donation record added successfully'
      },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    const errorCode =
      error instanceof DonationRecordOperationError ? error.errorCode : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default getDonationRequestLambda
