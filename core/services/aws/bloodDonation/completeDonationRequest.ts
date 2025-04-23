import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import { DonationRecordService } from 'application/bloodDonationWorkflow/DonationRecordService'
import type {
  DonationRecordEventAttributes
} from 'application/bloodDonationWorkflow/Types'
import { BloodDonationService } from 'application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import DonationRecordDynamoDbOperations from '../commons/ddbOperations/DonationRecordDynamoDbOperations'
import { NotificationService } from 'application/notificationWorkflow/NotificationService'
import DonationRecordOperationError from 'application/bloodDonationWorkflow/DonationRecordOperationError'
import { UserService } from 'application/userWorkflow/UserService'
import LocationDynamoDbOperations from '../commons/ddbOperations/LocationDynamoDbOperations'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from 'commons/libs/constants/ApiResponseMessages';
import { Config } from 'commons/libs/config/config';
import DonationNotificationDynamoDbOperations from '../commons/ddbOperations/DonationNotificationDynamoDbOperations';
import UserDynamoDbOperations from '../commons/ddbOperations/UserDynamoDbOperations';
import { LocationService } from 'core/application/userWorkflow/LocationService';
import SQSOperations from '../commons/sqs/SQSOperations'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
  minMonthsBetweenDonations: number;
}>().getConfig()

const userDynamoDbOperations = new UserDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const bloodDonationDynamoDbOperations = new BloodDonationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const notificationDynamoDbOperations = new DonationNotificationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const donationRecordDynamoDbOperations = new DonationRecordDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const locationDynamoDbOperations = new LocationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)


async function completeDonationRequest(
  event: DonationRecordEventAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  const bloodDonationService = new BloodDonationService(bloodDonationDynamoDbOperations, httpLogger)
  const notificationService = new NotificationService(notificationDynamoDbOperations, httpLogger)
  const userService = new UserService(userDynamoDbOperations, httpLogger)
  const donationRecordService = new DonationRecordService(donationRecordDynamoDbOperations, httpLogger)
  const locationService = new LocationService(locationDynamoDbOperations, httpLogger)
  try {
    const { donorIds, seekerId, requestPostId, requestCreatedAt } = event
    await bloodDonationService.completeDonationRequest(
      seekerId,
      requestPostId,
      requestCreatedAt,
      donorIds,
      donationRecordService,
      userService,
      notificationService,
      locationService,
      config.minMonthsBetweenDonations,
      new SQSOperations()
    )

    return generateApiGatewayResponse(
      { message: 'Donation completed and donation record added successfully' },
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

export default completeDonationRequest
