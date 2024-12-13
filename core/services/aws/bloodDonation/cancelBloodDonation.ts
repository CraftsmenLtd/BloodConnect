import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import {
  DonationRecordEventAttributes
} from '../../../application/bloodDonationWorkflow/Types'
import { DonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import {
  BloodDonationModel,
  DonationFields
} from '../../../application/models/dbModels/BloodDonationModel'
import BloodDonationOperationError from '../../../application/bloodDonationWorkflow/BloodDonationOperationError'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'

const bloodDonationService = new BloodDonationService()

async function cancelBloodDonation(
  event: DonationRecordEventAttributes
): Promise<APIGatewayProxyResult> {
  try {
    await bloodDonationService.updateDonationStatus(
      event.seekerId,
      event.requestPostId,
      event.requestCreatedAt,
      DonationStatus.CANCELLED,
      new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
        new BloodDonationModel()
      )
    )

    return generateApiGatewayResponse({ message: 'Donation post cancelled successfully', success: true }, HTTP_CODES.OK)
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

export default cancelBloodDonation
