import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import type { BloodDonationAttributes } from '../../../application/bloodDonationWorkflow/Types'
import type { DonationDTO } from '../../../../commons/dto/DonationDTO'
import type {
  DonationFields
} from '../../../application/models/dbModels/BloodDonationModel';
import {
  BloodDonationModel
} from '../../../application/models/dbModels/BloodDonationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import BloodDonationOperationError from '../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { CREATE_DONATION_REQUEST_SUCCESS, UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'
import { UserService } from '../../../application/userWorkflow/UserService'
import type { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import type { UserFields } from '../../../application/models/dbModels/UserModel';
import UserModel from '../../../application/models/dbModels/UserModel'

const bloodDonationService = new BloodDonationService()
const userService = new UserService()

async function createBloodDonationLambda(
  event: BloodDonationAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )

  try {
    const userProfile = await userService.getUser(
      event.seekerId,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel())
    )

    const bloodDonationAttributes: BloodDonationAttributes = {
      seekerId: event.seekerId,
      seekerName: userProfile.name,
      patientName: event.patientName,
      requestedBloodGroup: event.requestedBloodGroup,
      bloodQuantity: event.bloodQuantity,
      urgencyLevel: event.urgencyLevel,
      countryCode: userProfile.countryCode,
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
      new DynamoDbTableOperations<DonationDTO, DonationFields, BloodDonationModel>(
        new BloodDonationModel()
      ),
      new BloodDonationModel()
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
