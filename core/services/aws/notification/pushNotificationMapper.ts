import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { NotificationAttributes } from '../../../application/notificationWorkflow/Types'
import NotificationOperationError from '../../../application/notificationWorkflow/NotificationOperationError'
import { UserService } from '../../../application/userWorkflows/UserService'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import UserModel, { UserFields } from '../../../application/technicalImpl/dbModels/UserModel'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import SQSOperations from '../commons/sqs/SQSOperations'

async function pushNotificationMapper(event: NotificationAttributes): Promise<APIGatewayProxyResult> {
  try {
    const userService = new UserService()

    const notificationAttributes: NotificationAttributes = {
      userId: event.userId,
      title: event.title,
      body: event.body,
      data: event.data
    }

    await userService.pushNotification(
      notificationAttributes,
      new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel()),
      new SQSOperations()
    )

    return generateApiGatewayResponse(
      { message: 'Notification Queued Successfully' },
      HTTP_CODES.OK
    )
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
    const errorCode = error instanceof NotificationOperationError ? error.errorCode : HTTP_CODES.ERROR
    return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  }
}

export default pushNotificationMapper
