/* eslint-disable no-console */
import { APIGatewayProxyResult } from 'aws-lambda'
import { SQS } from '@aws-sdk/client-sqs'
import { DynamoDB } from '@aws-sdk/client-dynamodb'
import { HTTP_CODES } from '../../../../commons/libs/constants/GenericCodes'
import generateApiGatewayResponse from '../commons/lambda/ApiGateway'
import { NotificationAttributes } from '../../../application/notificationWorkflow/Types'
// import NotificationOperationError from '../../../application/notificationWorkflow/NotificationOperationError'
import { DynamoDBUserRepository } from './DynamoDBUserRepository'
import { SQSNotificationService } from './SQSNotificationService'

const dynamoDB = new DynamoDB({})
const sqs = new SQS({})
const userRepository = new DynamoDBUserRepository(dynamoDB)
const sqsService = new SQSNotificationService(sqs)

async function sendPushNotificationLambda(event: NotificationAttributes): Promise<APIGatewayProxyResult> {
  // try {
  if (process.env.NOTIFICATION_QUEUE_URL == null) {
    throw new Error('NOTIFICATION_QUEUE_URL environment variable is not set')
  }

  // Check if user has device token
  const userProfile = await userRepository.getUserProfile(event.userId)
  console.log('l1-event', event)
  console.log('l1-userProfile', userProfile)
  console.log('l1-deviceToken', userProfile?.deviceToken)

  if ((userProfile?.deviceToken) == null) {
    return generateApiGatewayResponse(
      { message: 'User has no registered device for notifications' },
      HTTP_CODES.NOT_FOUND
    )
  }

  // Queue notification
  await sqsService.queueNotification(
    {
      userId: event.userId,
      deviceToken: userProfile.deviceToken,
      payload: {
        title: event.title,
        body: event.body,
        data: event.data
      }
    },
    process.env.NOTIFICATION_QUEUE_URL
  )

  return generateApiGatewayResponse(
    { message: 'Notification queued successfully' },
    HTTP_CODES.OK
  )
  // } catch (error) {
  //   const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred'
  //   const errorCode = error instanceof NotificationOperationError ? error.errorCode : HTTP_CODES.ERROR
  //   return generateApiGatewayResponse(`Error: ${errorMessage}`, errorCode)
  // }
}

export default sendPushNotificationLambda
