import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { DonationRecordService } from '../../../application/bloodDonationWorkflow/DonationRecordService'
import { DonationRecordEventAttributes } from '../../../application/bloodDonationWorkflow/Types'
import {
  AcceptDonationStatus,
  DonationDTO,
  DonationRecordDTO,
  DonationStatus
} from '../../../../commons/dto/DonationDTO'
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
  NotificationType
} from '../../../../commons/dto/NotificationDTO'
import DonationNotificationModel, {
  BloodDonationNotificationFields
} from '../../../application/models/dbModels/DonationNotificationModel'
import NotificationDynamoDbOperations from '../commons/ddb/NotificationDynamoDbOperations'
import DonationRecordOperationError from '../../../application/bloodDonationWorkflow/DonationRecordOperationError'
import { createHTTPLogger, HttpLoggerAttributes } from '../commons/logger/HttpLogger'
import { UserService } from '../../../application/userWorkflow/UserService'
import { UpdateUserAttributes } from '../../../application/userWorkflow/Types'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import LocationModel from '../../../application/models/dbModels/LocationModel'
import UserModel, { UserFields } from '../../../application/models/dbModels/UserModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import LocationDynamoDbOperations from '../commons/ddb/LocationDynamoDbOperations'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'

const bloodDonationService = new BloodDonationService()
const donationRecordService = new DonationRecordService()
const notificationService = new NotificationService()
const userService = new UserService()

async function completeDonationRequest(
  event: DonationRecordEventAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.seekerId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
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

      await notificationService.updateBloodDonationNotificationStatus(
        donorId,
        event.requestPostId,
        NotificationType.BLOOD_REQ_POST,
        AcceptDonationStatus.COMPLETED,
        new NotificationDynamoDbOperations<
        BloodDonationNotificationDTO,
        BloodDonationNotificationFields,
        DonationNotificationModel
        >(new DonationNotificationModel())
      )

      const userAttributes = {
        lastDonationDate: new Date().toISOString(),
        availableForDonation: false
      }
      await userService.UpdateUserAttributes(
        donorId,
        userAttributes as UpdateUserAttributes,
        new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel()),
        new LocationDynamoDbOperations(new LocationModel())
      )
    }

    return generateApiGatewayResponse(
      { message: 'Donation completed and donation record added successfully' },
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
