// import { SQS } from '@aws-sdk/client-sqs'
// import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
// import { NotificationStatus, PushNotificationDTO } from '../../../commons/dto/NotificationDTO'
// import { PushNotificationAttributes } from './Types'
// import NotificationOperationError from './NotificationOperationError'
// import { generateUniqueID } from '../utils/idGenerator'
// import { DynamoDBUserRepository } from '../technicalImpl/repositories/NotificationRepository'

// export class NotificationService {
//   constructor(
//     private readonly sqs: SQS,
//     private readonly userRepository: DynamoDBUserRepository
//   ) {}

//   async sendPushNotification(
//     notificationAttributes: PushNotificationAttributes,
//     queueUrl: string
//   ): Promise<string> {
//     try {
//       // Get user's device tokens
//       const deviceTokens = await this.userRepository.getUserDeviceTokens(notificationAttributes.userId)

//       if (deviceTokens.length === 0) {
//         throw new NotificationOperationError(
//           'User has no registered devices for notifications',
//           GENERIC_CODES.NOT_FOUND
//         )
//       }

//       const messageBody: PushNotificationDTO = {
//         id: generateUniqueID(),
//         userId: notificationAttributes.userId,
//         deviceTokens,
//         title: notificationAttributes.title,
//         body: notificationAttributes.body,
//         data: notificationAttributes.data,
//         status: NotificationStatus.PENDING,
//         retryCount: 0,
//         createdAt: new Date().toISOString()
//       }

//       await this.sqs.sendMessage({
//         QueueUrl: queueUrl,
//         MessageBody: JSON.stringify(messageBody),
//         MessageAttributes: {
//           userId: {
//             DataType: 'String',
//             StringValue: notificationAttributes.userId
//           }
//         }
//       })

//       return 'Notification queued successfully'
//     } catch (error) {
//       if (error instanceof NotificationOperationError) {
//         throw error
//       }
//       throw new NotificationOperationError(
//         `Failed to send push notification. Error: ${error}`,
//         GENERIC_CODES.ERROR
//       )
//     }
//   }
// }
