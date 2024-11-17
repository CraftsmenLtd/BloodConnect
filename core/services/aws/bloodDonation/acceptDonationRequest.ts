import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { AcceptDonationRequestAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { AcceptedDonationDTO } from '../../../../commons/dto/DonationDTO'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import {
  AcceptDonationRequestModel,
  AcceptedDonationFields
} from '../../../application/models/dbModels/AcceptDonationModel'

const acceptDonationRequest = new AcceptDonationService()

async function acceptDonationRequestLambda(
  event: AcceptDonationRequestAttributes
): Promise<APIGatewayProxyResult> {
  try {
    const acceptDonationRequestAttributes = {
      donorId: event.donorId,
      seekerId: event.seekerId,
      createdAt: event.createdAt,
      requestPostId: event.requestPostId,
      acceptanceTime: event.acceptanceTime
    }
    const response = await acceptDonationRequest.createAcceptanceRecord(
      acceptDonationRequestAttributes,
      new DynamoDbTableOperations<
      AcceptedDonationDTO,
      AcceptedDonationFields,
      AcceptDonationRequestModel
      >(new AcceptDonationRequestModel())
    )
    return generateApiGatewayResponse({ message: response }, HTTP_CODES.OK)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    return generateApiGatewayResponse(
      `Error: ${errorMessage}`,
      HTTP_CODES.ERROR
    )
  }
}

export default acceptDonationRequestLambda
