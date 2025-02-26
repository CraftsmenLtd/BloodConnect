import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { GetDonationRequestAttributes } from '../../../application/bloodDonationWorkflow/Types'
import {
  AcceptedDonationDTO,
  DonationDTO
} from '../../../../commons/dto/DonationDTO'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'
import {
  BloodDonationModel,
  DonationFields
} from '../../../application/models/dbModels/BloodDonationModel'
import { createHTTPLogger, HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import AcceptedDonationDynamoDbOperations from '../commons/ddb/AcceptedDonationDynamoDbOperations'
import {
  AcceptDonationRequestModel,
  AcceptedDonationFields
} from '../../../application/models/dbModels/AcceptDonationModel'
import DonationRecordOperationError from '../../../application/bloodDonationWorkflow/DonationRecordOperationError'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'

const bloodDonationService = new BloodDonationService()
const acceptDonationService = new AcceptDonationService()

async function completeDonationRequest(
  event: GetDonationRequestAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  try {
    const { seekerId, requestPostId, createdAt } = event
    const donationPost = await bloodDonationService.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt,
      new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
        new BloodDonationModel()
      )
    )
    const acceptedDonors = await acceptDonationService.getAcceptedDonorList(
      seekerId,
      requestPostId,
      new AcceptedDonationDynamoDbOperations<
      AcceptedDonationDTO,
      AcceptedDonationFields,
      AcceptDonationRequestModel
      >(new AcceptDonationRequestModel())
    )

    const donationDetails = {
      ...donationPost,
      requestPostId: donationPost.id,
      acceptedDonors
    }
    return generateApiGatewayResponse(
      {
        success: true,
        data: donationDetails,
        message: 'Donation completed and donation record added successfully'
      },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    const errorCode =
      error instanceof DonationRecordOperationError ? error.errorCode : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default completeDonationRequest
