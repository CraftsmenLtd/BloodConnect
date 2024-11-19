import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { AcceptDonationService } from '../../../application/bloodDonationWorkflow/AcceptDonationRequestService'
import { AcceptDonationRequestAttributes } from '../../../application/bloodDonationWorkflow/Types'
import { AcceptedDonationDTO } from '../../../../commons/dto/DonationDTO'
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

const acceptDonationRequest = new AcceptDonationService()
const userService = new UserService()
const notificationService = new NotificationService()

async function acceptDonationRequestLambda(
  event: AcceptDonationRequestAttributes
): Promise<APIGatewayProxyResult> {
  try {
    const acceptDonationRequestAttributes = {
      donorId: event.donorId,
      seekerId: event.seekerId,
      createdAt: event.createdAt,
      requestPostId: event.requestPostId,
      acceptanceTime: event.acceptanceTime
    }

    const userProfile = await userService.getUser(
      event.donorId,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(
        new UserModel()
      )
    )

    const response = await acceptDonationRequest.createAcceptanceRecord(
      acceptDonationRequestAttributes,
      new DynamoDbTableOperations<
      AcceptedDonationDTO,
      AcceptedDonationFields,
      AcceptDonationRequestModel
      >(new AcceptDonationRequestModel()),
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(
        new UserModel()
      )
    )

    const notificationAttributes: NotificationAttributes = {
      userId: event.seekerId,
      title: 'Donor Found',
      body: `${userProfile.bloodGroup} blood found`,
      type: 'donorAcceptRequest',
      payload: {
        seekerId: event.seekerId,
        createdAt: event.createdAt,
        requestPostId: event.requestPostId,
        donorId: event.donorId,
        name: userProfile.name,
        bloodGroup: userProfile.bloodGroup
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
