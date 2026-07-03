import type { OfflineNotifier } from '../../../application/models/realtime/RealtimeNotifier'
import type { ChatChannelDTO, ChatMessageDTO } from '../../../../commons/dto/ChatDTO'
import { NotificationType } from '../../../../commons/dto/NotificationDTO'
import type { QueueModel } from '../../../application/models/queue/QueueModel'

const PREVIEW_LENGTH = 120

export default class ChatPushNotifier implements OfflineNotifier {
  constructor(
    private readonly queue: QueueModel,
    private readonly pushQueueUrl: string
  ) {}

  async notifyNewMessage(
    recipientId: string,
    channel: ChatChannelDTO,
    message: ChatMessageDTO
  ): Promise<void> {
    const notification = {
      userId: recipientId,
      type: NotificationType.CHAT_MESSAGE,
      title: 'New message',
      body: message.body.slice(0, PREVIEW_LENGTH),
      payload: {
        channelId: channel.channelId,
        requestPostId: channel.requestPostId,
        seekerId: channel.seekerId,
        donorId: channel.donorId,
        senderId: message.senderId,
        messageId: message.messageId
      }
    }
    await this.queue.queue(notification, this.pushQueueUrl)
  }
}
