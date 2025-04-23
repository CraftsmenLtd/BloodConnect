import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import {
  AcceptDonationService
} from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import type {
  AcceptDonationRequestAttributes
} from '../../../application/bloodDonationWorkflow/Types'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import { UserService } from '../../../application/userWorkflow/UserService'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import AcceptDonationDynamoDbOperations from '../commons/ddbOperations/AcceptedDonationDynamoDbOperations'
import { Config } from '../../../../commons/libs/config/config'
import DonationNotificationDynamoDbOperations from '../commons/ddbOperations/DonationNotificationDynamoDbOperations'
import UserDynamoDbOperations from '../commons/ddbOperations/UserDynamoDbOperations'
import SQSOperations from '../commons/sqs/SQSOperations'

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
const userDynamoDbOperations = new UserDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const notificationDynamoDbOperations = new DonationNotificationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function acceptDonationRequestLambda(
  event: AcceptDonationRequestAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.donorId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  const acceptDonationService = new AcceptDonationService(acceptDonationDynamoDbOperations, httpLogger)
  const bloodDonationService = new BloodDonationService(bloodDonationDynamoDbOperations, httpLogger)
  const notificationService = new NotificationService(notificationDynamoDbOperations, httpLogger)
  const userService = new UserService(userDynamoDbOperations, httpLogger)
  try {
    const { donorId, seekerId, requestPostId, createdAt, status } = event
    await acceptDonationService.acceptDonationRequest(
      donorId,
      seekerId,
      requestPostId,
      createdAt,
      status,
      bloodDonationService,
      userService,
      notificationService,
      new SQSOperations()
    )

    return generateApiGatewayResponse(
      { message: `Donation request ${status} successfully.` },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

export default acceptDonationRequestLambda
