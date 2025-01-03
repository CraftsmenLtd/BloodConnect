import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse, { generateApiResponse } from '../commons/lambda/ApiGateway'
import { GetPublicDonationRequestAttributes } from '../../../application/bloodDonationWorkflow/Types'
import {
  BloodGroup,
  DonationDTO
} from '../../../../commons/dto/DonationDTO'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'
import {
  BloodDonationModel,
  DonationFields
} from '../../../application/models/dbModels/BloodDonationModel'
import { createHTTPLogger, HttpLoggerAttributes } from '../commons/httpLogger/HttpLogger'
import DonationRecordOperationError from '../../../application/bloodDonationWorkflow/DonationRecordOperationError'
import { PUBLIC_POSTS_MESSAGE, UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'

const bloodDonationService = new BloodDonationService()

async function getPublicPosts(
  event: GetPublicDonationRequestAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.userId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  try {
    const { userId, city, requestedBloodGroup } = event
    const donationPosts: DonationDTO[] = await bloodDonationService.queryPublicDonations(
      userId,
      city,
      requestedBloodGroup as BloodGroup,
      new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
        new BloodDonationModel()
      )
    )

    return generateApiResponse(
      {
        success: true,
        message: PUBLIC_POSTS_MESSAGE,
        statusCode: HTTP_CODES.OK,
        data: donationPosts
      }
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    const errorCode =
      error instanceof DonationRecordOperationError ? error.errorCode : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default getPublicPosts
