import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import type {
  BloodDonationAttributes,
  BloodDonationEventAttributes
} from '../../../application/bloodDonationWorkflow/Types'
import BloodDonationOperationError from '../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import {
  CREATE_DONATION_REQUEST_SUCCESS,
  UNKNOWN_ERROR_MESSAGE
} from '../../../../commons/libs/constants/ApiResponseMessages'
import { UserService } from '../../../application/userWorkflow/UserService'
import { Config } from '../../../../commons/libs/config/config'
import BloodDonationDynamoDbOperations from '../commons/ddbOperations/BloodDonationDynamoDbOperations'
import UserDynamoDbOperations from '../commons/ddbOperations/UserDynamoDbOperations'

const config = new Config<{
  dynamodbTableName: string;
  awsRegion: string;
}>().getConfig()

const userDynamoDbOperations = new UserDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

const bloodDonationDynamoDbOperations = new BloodDonationDynamoDbOperations(
  config.dynamodbTableName,
  config.awsRegion
)

async function createBloodDonationLambda(
  event: BloodDonationAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  const userService = new UserService(userDynamoDbOperations, httpLogger)
  const bloodDonationService = new BloodDonationService(bloodDonationDynamoDbOperations, httpLogger)
  
  try {
    const bloodDonationAttributes: BloodDonationEventAttributes = {
      seekerId: event.seekerId,
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
    const response = await bloodDonationService.createBloodDonation(
      bloodDonationAttributes,
      userService
    )
    return generateApiGatewayResponse(
      {
        success: true,
        message: CREATE_DONATION_REQUEST_SUCCESS,
        data: response
      },
      HTTP_CODES.CREATED
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    const errorCode =
      error instanceof BloodDonationOperationError ? error.errorCode : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default createBloodDonationLambda
