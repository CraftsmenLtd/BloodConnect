import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { AcceptDonationRequestAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { AcceptedDonationDTO, DonationDTO, DonationStatus } from '../../../../commons/dto/DonationDTO'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import {
  AcceptDonationRequestModel,
  AcceptedDonationFields
} from '../../../application/models/dbModels/AcceptDonationModel'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import UserModel, { UserFields } from '../../../application/models/dbModels/UserModel'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import SQSOperations from '../commons/sqs/SQSOperations'
import { NotificationAttributes } from '../../../application/notificationWorkflow/Types'
import { UserService } from '../../../application/userWorkflow/UserService'
import { BloodDonationService } from './../../../application/bloodDonationWorkflow/BloodDonationService'
import { DonationFields, BloodDonationModel } from '../../../application/models/dbModels/BloodDonationModel'

const bloodDonationService = new BloodDonationService()
const acceptDonationRequest = new AcceptDonationService()
const userService = new UserService()
const notificationService = new NotificationService()

async function acceptDonationRequestLambda(
  event: AcceptDonationRequestAttributes
): Promise<APIGatewayProxyResult> {
  try {
    const userProfile = await userService.getUser(
      event.donorId,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(
        new UserModel()
      )
    )
    if (userProfile === null) {
      throw new Error('Cannot find user')
    }
    const donationPost = await bloodDonationService.getDonationRequest(
      event.seekerId,
      event.requestPostId,
      event.createdAt,
      new DynamoDbTableOperations<
      DonationDTO,
      DonationFields,
      BloodDonationModel
      >(new BloodDonationModel())
    )
    if (donationPost.status !== DonationStatus.PENDING) {
      throw new Error('Donation request is no longer available for acceptance.')
    }

    const acceptDonationRequestAttributes = {
      donorId: event.donorId,
      seekerId: event.seekerId,
      createdAt: event.createdAt,
      requestPostId: event.requestPostId,
      acceptanceTime: event.acceptanceTime,
      status: event.status,
      donorName: userProfile?.name,
      phoneNumbers: userProfile?.phoneNumbers,
      requestedBloodGroup: donationPost.requestedBloodGroup,
      urgencyLevel: donationPost.urgencyLevel,
      location: donationPost.location,
      donationDateTime: donationPost.donationDateTime,
      shortDescription: donationPost.shortDescription
    }
    const response = await acceptDonationRequest.createAcceptanceRecord(
      acceptDonationRequestAttributes,
      new DynamoDbTableOperations<
      AcceptedDonationDTO,
      AcceptedDonationFields,
      AcceptDonationRequestModel
      >(new AcceptDonationRequestModel())
    )

    const acceptedDonors = await bloodDonationService.getAcceptedDonorList(
      event.seekerId,
      event.requestPostId,
      new DynamoDbTableOperations<AcceptedDonationDTO, AcceptedDonationFields, AcceptDonationRequestModel>(new AcceptDonationRequestModel())
    )

    const notificationAttributes: NotificationAttributes = {
      userId: event.seekerId,
      title: 'Donor Found',
      body: `${donationPost.requestedBloodGroup} blood found`,
      type: 'REQ_ACCEPTED',
      payload: {
        ...acceptDonationRequestAttributes,
        acceptedDonors
      }
    }

    await notificationService.sendNotification(
      notificationAttributes,
      new SQSOperations()
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
