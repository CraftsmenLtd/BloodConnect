import { SQSEvent, SQSRecord } from 'aws-lambda'
import { NotificationQueueMessage } from '../../../application/notificationWorkflow/Types'
import { NotificationService } from '../../../application/notificationWorkflow/NotificationService'
import SNSOperations from '../commons/sns/SNSOperations'
import { NotificationDTO } from '../../../../commons/dto/NotificationDTO'
import NotificationModel, { NotificationFields } from '../../../application/models/dbModels/NotificationModel'
import DynamoDbTableOperations from '../commons/ddb/DynamoDbTableOperations'

const notificationService = new NotificationService()

async function sendPushNotification(event: SQSEvent): Promise<{ status: string }> {
  try {
    for (const record of event.Records) {
      await processSQSRecord(record)
    }
    return { status: 'Success' }
  } catch (error) {
    throw error instanceof Error ? error : new Error('An unknown error occurred')
  }
}

async function processSQSRecord(record: SQSRecord): Promise<void> {
  const body: NotificationQueueMessage = typeof record.body === 'string' && record.body.trim() !== ''
    ? JSON.parse(record.body)
    : {}

  await notificationService.publishNotification(
    body,
    new DynamoDbTableOperations<NotificationDTO, NotificationFields, NotificationModel>(new NotificationModel()),
    new SNSOperations()
  )
}

export default sendPushNotification
