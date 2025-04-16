import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import type { UpdateBloodDonationAttributes } from '../../../application/bloodDonationWorkflow/Types'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE, UPDATE_DONATION_REQUEST_SUCCESS } from '../../../../commons/libs/constants/ApiResponseMessages'
import { Config } from '../../../../commons/libs/config/config'
import DonationNotificationDynamoDbOperations from '../commons/ddbOperations/DonationNotificationDynamoDbOperations'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const notificationDynamoDbOperations = new DonationNotificationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

const bloodDonationDynamoDbOperations = new BloodDonationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function updateBloodDonationLambda(
  event: UpdateBloodDonationAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  const bloodDonationService = new BloodDonationService(bloodDonationDynamoDbOperations, httpLogger)
  const notificationService = new NotificationService(notificationDynamoDbOperations, httpLogger)
  try {
    const bloodDonationAttributes: UpdateBloodDonationAttributes = {
      seekerId: event.seekerId,
      requestPostId: event.requestPostId,
      createdAt: event.createdAt,
      patientName: event.patientName,
      requestedBloodGroup: event.requestedBloodGroup,
      bloodQuantity: event.bloodQuantity,
      urgencyLevel: event.urgencyLevel,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      donationDateTime: event.donationDateTime,
      shortDescription: event.shortDescription,
      contactNumber: event.contactNumber,
      transportationInfo: event.transportationInfo
    }
    const response = await bloodDonationService.updateBloodDonation(
      bloodDonationAttributes,
      notificationService,
      httpLogger
    )
    return generateApiGatewayResponse(
      {
        success: true,
        message: UPDATE_DONATION_REQUEST_SUCCESS,
        data: response
      },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

export default updateBloodDonationLambda
