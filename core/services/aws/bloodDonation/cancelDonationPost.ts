import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import {
  DonationStatusManagerAttributes
} from '../../../application/bloodDonationWorkflow/Types'
import { DonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import {
  BloodDonationModel,
  DonationFields
} from '../../../application/models/dbModels/BloodDonationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import BloodDonationOperationError from '../../../application/bloodDonationWorkflow/BloodDonationOperationError'

const bloodDonationService = new BloodDonationService()

async function cancelDonationPostLambda(
  event: DonationStatusManagerAttributes
): Promise<APIGatewayProxyResult> {
  try {
    const payload = {
      seekerId: event.seekerId,
      requestPostId: event.requestPostId,
      createdAt: event.createdAt,
      status: DonationStatus.CANCELLED
    }
    await bloodDonationService.updateDonationPostStatus(
      payload,
      new DynamoDbTableOperations<
      DonationDTO,
      DonationFields,
      BloodDonationModel
      >(new BloodDonationModel())
    )
    return generateApiGatewayResponse({ message: 'Donation post cancelled successfully' }, HTTP_CODES.OK)
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

export default cancelDonationPostLambda
