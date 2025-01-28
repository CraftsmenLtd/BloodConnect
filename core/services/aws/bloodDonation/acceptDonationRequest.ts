import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { AcceptDonationRequestAttributes } from '../../../application/bloodDonationWorkflow/Types'
import {
  AcceptDonationStatus,
  AcceptedDonationDTO,
  DonationDTO,
  DonationStatus
} from '../../../../commons/dto/DonationDTO'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import {
  AcceptDonationRequestModel,
  AcceptedDonationFields
} from '../../../application/models/dbModels/AcceptDonationModel'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import UserModel, { UserFields } from '../../../application/models/dbModels/UserModel'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import SQSOperations from '../commons/sqs/SQSOperations'
import { UserService } from '../../../application/userWorkflow/UserService'
import { BloodDonationService } from './../../../application/bloodDonationWorkflow/BloodDonationService'
import {
  DonationFields,
  BloodDonationModel
} from '../../../application/models/dbModels/BloodDonationModel'
import BloodDonationDynamoDbOperations from '../commons/ddb/BloodDonationDynamoDbOperations'
import {
  BloodDonationNotificationDTO,
  NotificationType
} from '../../../../commons/dto/NotificationDTO'
import NotificationDynamoDbOperations from '../commons/ddb/NotificationDynamoDbOperations'
import DonationNotificationModel, {
  BloodDonationNotificationFields
} from '../../../application/models/dbModels/DonationNotificationModel'
import AcceptedDonationDynamoDbOperations from '../commons/ddb/AcceptedDonationDynamoDbOperations'
import { DonationNotificationAttributes } from '../../../application/notificationWorkflow/Types'
import { createHTTPLogger, HttpLoggerAttributes } from '../commons/httpLogger/HttpLogger'
import { UNKNOWN_ERROR_MESSAGE } from '../../../../commons/libs/constants/ApiResponseMessages'

const bloodDonationService = new BloodDonationService()
const acceptDonationService = new AcceptDonationService()
const userService = new UserService()
const notificationService = new NotificationService()

async function acceptDonationRequest(
  event: AcceptDonationRequestAttributes & HttpLoggerAttributes
): Promise<APIGatewayProxyResult> {
  const httpLogger = createHTTPLogger(
    event.donorId,
    event.apiGwRequestId,
    event.cloudFrontRequestId
  )
  try {
    const { donorId, seekerId, requestPostId, createdAt, status } = event

    if (![AcceptDonationStatus.ACCEPTED, AcceptDonationStatus.IGNORED].includes(status)) {
      throw new Error('Invalid status for donation response.')
    }

    const acceptanceRecord = await acceptDonationService.getAcceptanceRecord(
      seekerId,
      requestPostId,
      donorId,
      new AcceptedDonationDynamoDbOperations<
      AcceptedDonationDTO,
      AcceptedDonationFields,
      AcceptDonationRequestModel
      >(new AcceptDonationRequestModel())
    )
    if (isAlreadyDonated(acceptanceRecord)) {
      throw new Error('You already donated.')
    }

    const userProfile = await userService.getUser(
      donorId,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel())
    )
    const donationPost = await getDonationRequest(seekerId, requestPostId, createdAt)

    if (userProfile.bloodGroup !== donationPost.requestedBloodGroup) {
      throw new Error('Your blood group doesn\'t match with the request blood group')
    }

    if (acceptanceRecord === null) {
      if (status === AcceptDonationStatus.ACCEPTED) {
        await createAcceptanceRecord(donorId, seekerId, createdAt, requestPostId, userProfile)
        await sendNotificationToSeeker(
          seekerId,
          requestPostId,
          donationPost,
          donorId,
          createdAt,
          status,
          userProfile
        )
      }
    } else {
      if (status === AcceptDonationStatus.IGNORED) {
        await acceptDonationService.deleteAcceptedRequest(
          seekerId,
          requestPostId,
          donorId,
          new AcceptedDonationDynamoDbOperations<
          AcceptedDonationDTO,
          AcceptedDonationFields,
          AcceptDonationRequestModel
          >(new AcceptDonationRequestModel())
        )
      }
      if (status !== acceptanceRecord.status) {
        await sendNotificationToSeeker(
          seekerId,
          requestPostId,
          donationPost,
          donorId,
          createdAt,
          status,
          userProfile
        )
      }
    }

    await updateDonationNotification(
      donorId,
      requestPostId,
      seekerId,
      createdAt,
      status,
      donationPost,
      userProfile
    )

    return generateApiGatewayResponse(
      { message: `Donation request ${status} successfully.` },
      HTTP_CODES.OK
    )
  } catch (error) {
    httpLogger.error(error)
    const errorMessage = error instanceof Error ? error.message : UNKNOWN_ERROR_MESSAGE
    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

function isAlreadyDonated(acceptanceRecord: AcceptedDonationDTO | null): boolean {
  return acceptanceRecord != null && acceptanceRecord.status === AcceptDonationStatus.COMPLETED
}

async function getDonationRequest(
  seekerId: string,
  requestPostId: string,
  createdAt: string
): Promise<DonationDTO> {
  const donationPost = await bloodDonationService.getDonationRequest(
    seekerId,
    requestPostId,
    createdAt,
    new BloodDonationDynamoDbOperations<DonationDTO, DonationFields, BloodDonationModel>(
      new BloodDonationModel()
    )
  )

  if (donationPost.status !== DonationStatus.PENDING) {
    throw new Error('Donation request is no longer available for acceptance.')
  }
  return donationPost
}

async function createAcceptanceRecord(
  donorId: string,
  seekerId: string,
  createdAt: string,
  requestPostId: string,
  userProfile: UserDetailsDTO
): Promise<void> {
  const acceptDonationRequestAttributes: AcceptDonationRequestAttributes = {
    donorId,
    seekerId,
    createdAt,
    requestPostId,
    status: AcceptDonationStatus.ACCEPTED,
    donorName: userProfile?.name,
    phoneNumbers: userProfile?.phoneNumbers
  }

  await acceptDonationService.createAcceptanceRecord(
    acceptDonationRequestAttributes,
    new AcceptedDonationDynamoDbOperations<
    AcceptedDonationDTO,
    AcceptedDonationFields,
    AcceptDonationRequestModel
    >(new AcceptDonationRequestModel())
  )
}

async function sendNotificationToSeeker(
  seekerId: string,
  requestPostId: string,
  donationPost: DonationDTO,
  donorId: string,
  createdAt: string,
  status: AcceptDonationStatus,
  userProfile: UserDetailsDTO
): Promise<void> {
  const acceptedDonors = await acceptDonationService.getAcceptedDonorList(
    seekerId,
    requestPostId,
    new AcceptedDonationDynamoDbOperations<
    AcceptedDonationDTO,
    AcceptedDonationFields,
    AcceptDonationRequestModel
    >(new AcceptDonationRequestModel())
  )

  const notificationAttributes: DonationNotificationAttributes = {
    userId: seekerId,
    title: status === AcceptDonationStatus.ACCEPTED ? 'Donor Found' : 'Donor Ignored',
    status,
    body:
      status === AcceptDonationStatus.ACCEPTED
        ? `${donationPost.requestedBloodGroup} blood found`
        : 'request was ignored by donor',
    type: NotificationType.REQ_ACCEPTED,
    payload: {
      donorId,
      seekerId,
      createdAt,
      requestPostId,
      donorName: userProfile?.name,
      phoneNumbers: userProfile?.phoneNumbers,
      requestedBloodGroup: donationPost.requestedBloodGroup,
      urgencyLevel: donationPost.urgencyLevel,
      location: donationPost.location,
      donationDateTime: donationPost.donationDateTime,
      shortDescription: donationPost.shortDescription,
      acceptedDonors
    }
  }

  await notificationService.sendNotification(notificationAttributes, new SQSOperations())
}

async function updateDonationNotification(
  donorId: string,
  requestPostId: string,
  seekerId: string,
  createdAt: string,
  status: AcceptDonationStatus,
  donationPost: DonationDTO,
  userProfile: UserDetailsDTO
): Promise<void> {
  const existingNotification = await notificationService.getBloodDonationNotification(
    donorId,
    requestPostId,
    NotificationType.BLOOD_REQ_POST,
    new NotificationDynamoDbOperations<
    BloodDonationNotificationDTO,
    BloodDonationNotificationFields,
    DonationNotificationModel
    >(new DonationNotificationModel())
  )

  if (existingNotification === null) {
    if (status === AcceptDonationStatus.ACCEPTED) {
      const notificationData: DonationNotificationAttributes = {
        type: NotificationType.BLOOD_REQ_POST,
        payload: {
          seekerId,
          requestPostId,
          createdAt,
          bloodQuantity: donationPost.bloodQuantity,
          requestedBloodGroup: donationPost.requestedBloodGroup as string,
          urgencyLevel: donationPost.urgencyLevel as string,
          contactNumber: donationPost.contactNumber,
          donationDateTime: donationPost.donationDateTime,
          patientName: donationPost.patientName as string,
          seekerName: userProfile.name,
          location: donationPost.location,
          shortDescription: donationPost.shortDescription as string,
          transportationInfo: donationPost.transportationInfo as string
        },
        status: status as AcceptDonationStatus,
        userId: donorId,
        title: 'Blood Request Accepted',
        body: `${donationPost.requestedBloodGroup} blood request Accepted`
      }

      await notificationService.createBloodDonationNotification(
        notificationData,
        new NotificationDynamoDbOperations<
        BloodDonationNotificationDTO,
        BloodDonationNotificationFields,
        DonationNotificationModel
        >(new DonationNotificationModel())
      )
    }
  } else {
    await notificationService.updateBloodDonationNotificationStatus(
      donorId,
      requestPostId,
      NotificationType.BLOOD_REQ_POST,
      status,
      new NotificationDynamoDbOperations<
      BloodDonationNotificationDTO,
      BloodDonationNotificationFields,
      DonationNotificationModel
      >(new DonationNotificationModel())
    )
  }
}

export default acceptDonationRequest
