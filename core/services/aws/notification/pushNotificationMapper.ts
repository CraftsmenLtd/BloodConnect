import { APIGatewayProxyResult } from 'aws-lambda'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { NotificationAttributes } from '../../../application/notificationWorkflow/Types'
import NotificationOperationError from '../../../application/notificationWorkflow/NotificationOperationError'
import { UserService } from '../../../application/userWorkflows/UserService'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'
import UserModel, { UserFields } from '../../../application/Models/dbModels/UserModel'
import { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import SQSOperations from '../commons/sqs/SQSOperations'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import { LocalCacheMapManager } from '../../../application/utils/localCacheMapManager'
import { MAX_LOCAL_CACHE_SIZE_COUNT } from '../../../../commons/libs/constants/NoMagicNumbers'

const userDeviceToSnsEndpointMap = new LocalCacheMapManager<string, string>(MAX_LOCAL_CACHE_SIZE_COUNT)

async function pushNotificationMapper(event: NotificationAttributes): Promise<APIGatewayProxyResult> {
  try {
    const userService = new UserService()
    const notificationService = new NotificationService()

    const notificationAttributes: NotificationAttributes = {
      userId: event.userId,
      title: event.title,
      type: event.type,
      body: event.body,
      data: event.data
    }

    const cachedUserSnsEndpointArn = userDeviceToSnsEndpointMap.get(event.userId)
    if (cachedUserSnsEndpointArn === undefined) {
      const userSnsEndpointArn = await userService.getDeviceSnsEndpointArn(
        event.userId,
        new DynamoDbTableOperations<UserDetailsDTO, UserFields, UserModel>(new UserModel())
      )
      userDeviceToSnsEndpointMap.set(event.userId, userSnsEndpointArn)

      await notificationService.pushNotification(
        notificationAttributes,
        userSnsEndpointArn,
        new SQSOperations()
      )
    } else {
      await notificationService.pushNotification(
        notificationAttributes,
        cachedUserSnsEndpointArn,
        new SQSOperations()
      )
    }

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
