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

const bloodDonationService = new BloodDonationService()
const acceptDonationService = new AcceptDonationService()
const userService = new UserService()
const notificationService = new NotificationService()

async function acceptDonationRequestLambda(
  event: AcceptDonationRequestAttributes
): Promise<APIGatewayProxyResult> {
  try {
    const { donorId, seekerId, requestPostId, createdAt, status } = event

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
    if (acceptanceRecord !== null && acceptanceRecord.status === AcceptDonationStatus.COMPLETED) {
      throw new Error('You already donated.')
    }

    if (status === AcceptDonationStatus.ACCEPTED && acceptanceRecord === null) {
      await acceptBloodDonationRequest(donorId, seekerId, requestPostId, createdAt, status)
    } else if (status === AcceptDonationStatus.IGNORED && acceptanceRecord !== null) {
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

    return generateApiGatewayResponse(
      { message: 'Donation request accepted successfully.' },
      HTTP_CODES.OK
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    return generateApiGatewayResponse(`Error: ${errorMessage}`, HTTP_CODES.ERROR)
  }
}

export default acceptDonationRequestLambda

async function acceptBloodDonationRequest(
  donorId: string,
  seekerId: string,
  requestPostId: string,
  createdAt: string,
  status: AcceptDonationStatus
): Promise<void> {
  const userProfile = await userService.getUser(
    donorId,
    new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel())
  )
  if (userProfile === null) {
    throw new Error('Cannot find user')
  }
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
  const acceptDonationRequestAttributes: AcceptDonationRequestAttributes = {
    donorId,
    seekerId,
    createdAt,
    requestPostId,
    status: status as AcceptDonationStatus,
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
    title: 'Donor Found',
    status: AcceptDonationStatus.ACCEPTED,
    body: `${donationPost.requestedBloodGroup} blood found`,
    type: NotificationType.REQ_ACCEPTED,
    payload: {
      ...acceptDonationRequestAttributes,
      requestedBloodGroup: donationPost.requestedBloodGroup,
      urgencyLevel: donationPost.urgencyLevel,
      location: donationPost.location,
      donationDateTime: donationPost.donationDateTime,
      shortDescription: donationPost.shortDescription,
      acceptedDonors
    }
  }

  await notificationService.sendNotification(notificationAttributes, new SQSOperations())

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

  if (existingNotification === null && status === AcceptDonationStatus.ACCEPTED) {
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
