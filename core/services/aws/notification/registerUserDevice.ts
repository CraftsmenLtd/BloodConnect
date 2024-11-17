import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { UserDTO } from '../../../../commons/dto/UserDTO'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import BloodDonationOperationError from '../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import UserModel, {
  UserFields
} from '../../../application/models/dbModels/UserModel'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import SNSOperations from '../commons/sns/SNSOperations'
import { SnsRegistrationAttributes } from '../../../application/notificationWorkflow/Types'
import {
  createHTTPLogger,
  HttpLoggerAttributes
} from '../commons/httpLogger/HttpLogger'

const notificationService = new NotificationService()

async function registerUserDevice(
  event: SnsRegistrationAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.userId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  try {
    const snsAttributes = {
      userId: event.userId,
      deviceToken: event.deviceToken,
      platform: event.platform
    }
    const response = await notificationService.storeDevice(
      snsAttributes,
      new DynamoDbTableOperations<UserDTO, UserFields, UserModel>(
        new UserModel()
      ),
      new SNSOperations()
    )
    return generateApiGatewayResponse({ message: response }, HTTP_CODES.OK)
  } catch (error) {
    httpLogger.error(error)
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    const errorCode =
      error instanceof BloodDonationOperationError
        ? error.errorCode
        : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default registerUserDevice
