import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { DonationRecordService } from '../../../application/bloodDonationWorkflow/DonationRecordService'
import { DonationRecordEventAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { DonationDTO, DonationRecordDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import {
  DonationRecordModel,
  DonationRecordFields
} from '../../../application/models/dbModels/DonationRecordModel'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'
import {
  BloodDonationModel,
  DonationFields
} from '../../../application/models/dbModels/BloodDonationModel'
import DonationRecordDynamoDbOperations from '../commons/ddb/DonationRecordDynamoDbOperations'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import {
  BloodDonationNotificationDTO,
  NotificationStatus,
  NotificationType
} from 'commons/dto/NotificationDTO'
import DonationNotificationModel, {
  BloodDonationNotificationFields
} from 'core/application/models/dbModels/DonationNotificationModel'
import NotificationDynamoDbOperations from '../commons/ddb/NotificationDynamoDbOperations'
import DonationRecordOperationError from 'core/application/bloodDonationWorkflow/DonationRecordOperationError'

const bloodDonationService = new BloodDonationService()
const donationRecordService = new DonationRecordService()
const notificationService = new NotificationService()

async function completeDonationRequest(
  event: DonationRecordEventAttributes
): Promise<APIGatewayProxyResult> {
  try {
    const { donorIds, seekerId, requestPostId, requestCreatedAt } = event
    const donationPost = await bloodDonationService.getDonationRequest(
      seekerId,
      requestPostId,
      requestCreatedAt,
      new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
        new BloodDonationModel()
      )
    )

    await bloodDonationService.updateDonationStatus(
      seekerId,
      requestPostId,
      requestCreatedAt,
      DonationStatus.COMPLETED,
      new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
        new BloodDonationModel()
      )
    )
    for (const donorId of donorIds) {
      await donationRecordService.createDonationRecord(
        {
          donorId,
          seekerId,
          requestPostId,
          requestCreatedAt,
          requestedBloodGroup: donationPost.requestedBloodGroup,
          location: donationPost.location,
          donationDateTime: donationPost.donationDateTime
        },
        new DonationRecordDynamoDbOperations<
          DonationRecordDTO,
          DonationRecordFields,
          DonationRecordModel
        >(new DonationRecordModel())
      )

      await notificationService.updateDonorNotificationStatus(
        donorId,
        event.requestPostId,
        NotificationType.BLOOD_REQ_POST,
        NotificationStatus.COMPLETED,
        new NotificationDynamoDbOperations<
          BloodDonationNotificationDTO,
          BloodDonationNotificationFields,
          DonationNotificationModel
        >(new DonationNotificationModel())
      )
    }

    return generateApiGatewayResponse(
      { message: 'Donation record is created successfully' },
      HTTP_CODES.OK
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    const errorCode =
      error instanceof DonationRecordOperationError ? error.errorCode : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default completeDonationRequest
