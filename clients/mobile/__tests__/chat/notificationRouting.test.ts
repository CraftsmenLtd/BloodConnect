import { SCREEN_FOR_NOTIFICATION } from '../../src/setup/notification/NotificationProvider'
import { SCREENS } from '../../src/setup/constant/screens'
import { NotificationType } from '../../../../commons/dto/NotificationDTO'

describe('chat notification routing', () => {
  it('routes a CHAT_MESSAGE notification to the chat room with the channelId', () => {
    const config = SCREEN_FOR_NOTIFICATION[NotificationType.CHAT_MESSAGE]

    expect(config?.screen).toBe(SCREENS.CHAT_ROOM)
    expect(config?.getParams?.({
      channelId: 'seeker#req#donor',
      senderId: 'seeker',
      messageId: '01HZ',
      createdAt: '2026-06-26T10:00:00.000Z'
    })).toEqual({ channelId: 'seeker#req#donor' })
  })
})
