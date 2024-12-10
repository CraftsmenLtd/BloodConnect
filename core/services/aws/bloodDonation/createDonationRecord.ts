import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { DonationRecordService } from '../../../application/bloodDonationWorkflow/DonationRecordService'
import { DonationRecordEventAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { DonationDTO, DonationRecordDTO } from '../../../../commons/dto/DonationDTO'
import {
  DonationRecordModel,
  DonationRecordFields
} from '../../../application/models/dbModels/DonationRecordModel'
import DonationRecordOperationError from '../../../application/bloodDonationWorkflow/DonationRecordOperationError'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'
import { BloodDonationModel, DonationFields } from '../../../application/models/dbModels/BloodDonationModel'
import DonationRecordDynamoDbOperations from '../commons/ddb/DonationRecordDynamoDbOperations'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import { BloodDonationNotificationDTO, NotificationStatus, NotificationType } from 'commons/dto/NotificationDTO'
import DonationNotificationModel, { BloodDonationNotificationFields } from 'core/application/models/dbModels/DonationNotificationModel'
import NotificationDynamoDbOperations from '../commons/ddb/NotificationDynamoDbOperations'

const bloodDonationService = new BloodDonationService()
const donationRecordService = new DonationRecordService()
const notificationService = new NotificationService()

async function createDonationRecord(
  event: DonationRecordEventAttributes
): Promise<APIGatewayProxyResult> {
  try {
    const donationPost = await bloodDonationService.getDonationRequest(
      event.seekerId,
      event.requestPostId,
      event.requestCreatedAt,
      new BloodDonationDynamoDbOperations<
      DonationDTO,
      DonationFields,
      BloodDonationModel
      >(new BloodDonationModel())
    )

    const DonationRecordAttributes = {
      donorId: event.donorId,
      seekerId: event.seekerId,
      requestPostId: event.requestPostId,
      requestCreatedAt: event.requestCreatedAt,
      requestedBloodGroup: donationPost.requestedBloodGroup,
      location: donationPost.location,
      donationDateTime: donationPost.donationDateTime
    }
    await donationRecordService.createDonationRecord(
      DonationRecordAttributes,
      new DonationRecordDynamoDbOperations<
      DonationRecordDTO,
      DonationRecordFields,
      DonationRecordModel
      >(new DonationRecordModel())
    )

    await notificationService.updateDonorNotificationStatus(
      event.donorId,
      event.requestPostId,
      NotificationType.BLOOD_REQ_POST,
      NotificationStatus.COMPLETED,
      new NotificationDynamoDbOperations<
      BloodDonationNotificationDTO,
      BloodDonationNotificationFields,
      DonationNotificationModel
      >(new DonationNotificationModel())
    )

    return generateApiGatewayResponse({ message: 'Donation record is created successfully' }, HTTP_CODES.OK)
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred'
    const errorCode =
      error instanceof DonationRecordOperationError
        ? error.errorCode
        : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default createDonationRecord
