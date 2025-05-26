import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import BloodDonationOperationError from '../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import SNSOperations from '../commons/sns/SNSOperations'
import type { SnsRegistrationAttributes } from '../../../application/notificationWorkflow/Types'
import type {
  HttpLoggerAttributes
} from '../commons/logger/HttpLogger';
import {
  createHTTPLogger
} from '../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { Config } from 'commons/libs/config/config'
import DonationNotificationDynamoDbOperations from '../commons/ddbOperations/DonationNotificationDynamoDbOperations'
import { UserService } from 'core/application/userWorkflow/UserService'
import UserDynamoDbOperations from '../commons/ddbOperations/UserDynamoDbOperations'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
  platformArnApns: string;
  platformArnFcm: string;
  minMonthsBetweenDonations: number;
}>().getConfig()

const notificationDynamoDbOperations = new DonationNotificationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)
const userDynamoDbOperations = new UserDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function registerUserDeviceLambda(
  event: SnsRegistrationAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.userId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  const notificationService = new NotificationService(notificationDynamoDbOperations, httpLogger)
  const userService = new UserService(userDynamoDbOperations, httpLogger)

  try {
    const snsAttributes = {
      userId: event.userId,
      deviceToken: event.deviceToken,
      platform: event.platform
    }
    const response = await notificationService.storeDevice(
      snsAttributes,
      userService,
      new SNSOperations(config.awsRegion, config.platformArnApns, config.platformArnFcm)
    )
    return generateApiGatewayResponse({ message: response }, HTTP_CODES.OK)
  } catch (error) {
    httpLogger.error(error)
    const errorMessage =
      error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    const errorCode =
      error instanceof BloodDonationOperationError
        ? error.errorCode
        : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default registerUserDeviceLambda
