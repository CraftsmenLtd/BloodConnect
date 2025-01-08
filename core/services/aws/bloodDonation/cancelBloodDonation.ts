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
import { createHTTPLogger, HttpLoggerAttributes } from '../commons/httpLogger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'

const bloodDonationService = new BloodDonationService()

async function cancelBloodDonation(
  event: DonationRecordEventAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
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
    httpLogger.error(error)
    const errorMessage =
      error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    const errorCode =
      error instanceof BloodDonationOperationError
        ? error.errorCode
        : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default cancelBloodDonation
