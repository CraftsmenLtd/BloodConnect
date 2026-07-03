import { NotificationService } from '../../notificationWorkflow/NotificationService'
import { NotificationType } from '../../../../commons/dto/NotificationDTO'
import type { NotificationAttributes } from '../../notificationWorkflow/Types'
import { LocalCacheMapManager } from '../../utils/localCacheMapManager'
import type { SNSModel } from '../../models/sns/SNSModel'
import type NotificationRepository from '../../models/policies/repositories/NotificationRepository'
import type { UserService } from '../../userWorkflow/UserService'
import { mockLogger } from '../mocks/mockLogger'

const buildDeps = () => {
  const repository = { create: jest.fn(), getBloodDonationNotification: jest.fn() }
  const userService = { getDeviceSnsEndpointArn: jest.fn().mockResolvedValue('arn:sns:endpoint') }
  const snsModel = { publish: jest.fn() }
  const cache = new LocalCacheMapManager<string, string>(100)
  const service = new NotificationService(repository as unknown as NotificationRepository, mockLogger)

  return { repository, userService, snsModel, cache, service }
}

const chatNotification: NotificationAttributes = {
  userId: 'recipient-1',
  type: NotificationType.CHAT_MESSAGE,
  title: 'New message',
  body: 'hello',
  payload: { channelId: 'req-1#donor-1', requestPostId: 'req-1' }
}

describe('NotificationService.sendPushNotification — CHAT_MESSAGE', () => {
  it('publishes a chat message without persisting a notification record', async () => {
    const { repository, userService, snsModel, cache, service } = buildDeps()

    await service.sendPushNotification(
      chatNotification,
      'recipient-1',
      userService as unknown as UserService,
      cache,
      snsModel as unknown as SNSModel
    )

    expect(snsModel.publish).toHaveBeenCalledTimes(1)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('still persists a COMMON notification (regression guard)', async () => {
    const { repository, userService, snsModel, cache, service } = buildDeps()

    await service.sendPushNotification(
      { ...chatNotification, type: NotificationType.COMMON },
      'recipient-1',
      userService as unknown as UserService,
      cache,
      snsModel as unknown as SNSModel
    )

    expect(repository.create).toHaveBeenCalledTimes(1)
    expect(snsModel.publish).toHaveBeenCalledTimes(1)
  })
})
