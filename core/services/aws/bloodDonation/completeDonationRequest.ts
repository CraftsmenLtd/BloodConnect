import type { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { DonationRecordService } from '../../../application/bloodDonationWorkflow/DonationRecordService'
import type { DonationRecordEventAttributes } from '../../../application/bloodDonationWorkflow/Types'
import type {
  DonationDTO,
  DonationRecordDTO} from '../../../../commons/dto/DonationDTO';
import {
  AcceptDonationStatus,
  DonationStatus
} from '../../../../commons/dto/DonationDTO'
import type {
  DonationRecordFields
} from '../../../application/models/dbModels/DonationRecordModel';
import {
  DonationRecordModel
} from '../../../application/models/dbModels/DonationRecordModel'
import { BloodDonationService } from '../../../application/bloodDonationWorkflow/BloodDonationService'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'
import type {
  DonationFields
} from '../../../application/models/dbModels/BloodDonationModel';
import {
  BloodDonationModel
} from '../../../application/models/dbModels/BloodDonationModel'
import DonationRecordDynamoDbOperations from '../commons/ddb/DonationRecordDynamoDbOperations'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import type {
  BloodDonationNotificationDTO} from '../../../../commons/dto/NotificationDTO';
import {
  NotificationType
} from '../../../../commons/dto/NotificationDTO'
import type {
  BloodDonationNotificationFields
} from '../../../application/models/dbModels/DonationNotificationModel';
import DonationNotificationModel from '../../../application/models/dbModels/DonationNotificationModel'
import NotificationDynamoDbOperations from '../commons/ddb/NotificationDynamoDbOperations'
import DonationRecordOperationError from '../../../application/bloodDonationWorkflow/DonationRecordOperationError'
import type { HttpLoggerAttributes } from '../commons/logger/HttpLogger';
import { createHTTPLogger } from '../commons/logger/HttpLogger'
import { UserService } from '../../../application/userWorkflow/UserService'
import type { UpdateUserAttributes } from '../../../application/userWorkflow/Types'
import type { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import LocationModel from '../../../application/models/dbModels/LocationModel'
import type { UserFields } from '../../../application/models/dbModels/UserModel';
import UserModel from '../../../application/models/dbModels/UserModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import LocationDynamoDbOperations from '../commons/ddb/LocationDynamoDbOperations'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'

const bloodDonationService = new BloodDonationService()
const donationRecordService = new DonationRecordService()
const notificationService = new NotificationService()
const userService = new UserService()

async function completeDonationRequest (
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
