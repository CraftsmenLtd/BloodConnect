import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import type { BloodDonationAttributes, BloodDonationEventAttributes } from '../../../application/bloodDonationWorkflow/Types'
import type { DonationDTO } from '../../../../commons/dto/DonationDTO'
import type {
  DonationFields
} from '../../../application/models/dbModels/BloodDonationModel';
import {
  BloodDonationModel
} from '../../../application/models/dbModels/BloodDonationModel';
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import BloodDonationOperationError from '../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import {
  CREATE_DONATION_REQUEST_SUCCESS,
  UNKNOWN_ERROR_MESSAGE
} from '../../../../commons/libs/constants/ApiResponseMessages'
import { UserService } from '../../../application/userWorkflow/UserService'
import type { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import type { UserFields } from '../../../application/models/dbModels/UserModel';
import UserModel from '../../../application/models/dbModels/UserModel'
import { Config } from '../../../../commons/libs/config/config'
import type { Logger } from 'core/application/models/logger/Logger'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'

const bloodDonationService = new BloodDonationService()
const userService = new UserService()

type ExpectedConfig = {
  dynamodbTableName: string;
  awsRegion: string;
}

async function createBloodDonation(
  event: BloodDonationEventAttributes,
  httpLogger: Logger,
  config: ExpectedConfig
): Promise<APIGatewayProxyResult> {
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
      new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
        new BloodDonationModel(), config.dynamodbTableName, config.awsRegion
      ),
      new BloodDonationModel(),
      userService,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel(), config.dynamodbTableName, config.awsRegion),
      httpLogger
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

const config = new Config<ExpectedConfig>().getConfig()

export default async function createBloodDonationLambda(
  event: BloodDonationAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  return createBloodDonation(event, httpLogger, config)
}
