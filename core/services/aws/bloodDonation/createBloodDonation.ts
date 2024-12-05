import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import { BloodDonationAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { DonationDTO } from '../../../../commons/dto/DonationDTO'
import {
  BloodDonationModel,
  DonationFields
} from '../../../application/models/dbModels/BloodDonationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import BloodDonationOperationError from '../../../application/bloodDonationWorkflow/BloodDonationOperationError'

const bloodDonationService = new BloodDonationService()

async function createBloodDonationLambda(
  event: BloodDonationAttributes
): Promise<APIGatewayProxyResult> {
  try {
    const bloodDonationAttributes = {
      seekerId: event.seekerId,
      patientName: event.patientName,
      requestedBloodGroup: event.requestedBloodGroup,
      bloodQuantity: event.bloodQuantity,
      urgencyLevel: event.urgencyLevel,
      city: event.city,
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
      new DynamoDbTableOperations<
      DonationDTO,
      DonationFields,
      BloodDonationModel
      >(new BloodDonationModel()),
      new BloodDonationModel()
    )
    return generateApiGatewayResponse({ message: response }, HTTP_CODES.OK)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    const errorCode =
      error instanceof BloodDonationOperationError
        ? error.errorCode
        : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default createBloodDonationLambda
