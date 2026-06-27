import React from 'react'
import { render, act } from '@testing-library/react-native'
import * as Notifications from 'expo-notifications'
import type { NavigationContainerRef, ParamListBase } from '@react-navigation/native'
import { NotificationProvider } from '../../src/setup/notification/NotificationProvider'
import { SCREENS } from '../../src/setup/constant/screens'
import { NotificationType } from '../../../../commons/dto/NotificationDTO'

jest.mock('expo-notifications', () => ({
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn().mockResolvedValue(null)
}))

jest.mock('../../src/utility/storageService', () => ({
  __esModule: true,
  default: {
    storeItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null)
  }
}))

type ResponseListener = (response: unknown) => void

const buildNavigationRef = (): { ref: NavigationContainerRef<ParamListBase>; navigate: jest.Mock } => {
  const navigate = jest.fn()
  const ref = {
    navigate,
    isReady: () => true,
    addListener: jest.fn(() => jest.fn())
  } as unknown as NavigationContainerRef<ParamListBase>

  return { ref, navigate }
}

const buildResponse = (type: string, payload: Record<string, unknown>): unknown => ({
  notification: {
    request: {
      identifier: 'notif-1',
      content: { data: { type, payload: JSON.stringify(payload) } }
    }
  }
})

const captureListener = (ref: NavigationContainerRef<ParamListBase>): ResponseListener => {
  render(React.createElement(NotificationProvider, { navigationRef: ref, children: null }))

  return (Notifications.addNotificationResponseReceivedListener as jest.Mock).mock.calls[0][0] as ResponseListener
}

describe('CHAT_MESSAGE notification deep-link', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('routes a CHAT_MESSAGE notification to the chat room with the channelId param', async() => {
    const { ref, navigate } = buildNavigationRef()
    const listener = captureListener(ref)
    const channelId = 'seeker-1#req-99#donor-7'

    await act(async() => {
      listener(buildResponse(NotificationType.CHAT_MESSAGE, { channelId, requestPostId: 'req-99' }))
    })

    expect(navigate).toHaveBeenCalledWith(SCREENS.CHAT_ROOM, { channelId, requestPostId: 'req-99' })
  })

  it('derives requestPostId from the channelId when the payload omits it (cold-start safe)', async() => {
    const { ref, navigate } = buildNavigationRef()
    const listener = captureListener(ref)
    const channelId = 'seeker-1#req-99#donor-7'

    await act(async() => {
      listener(buildResponse(NotificationType.CHAT_MESSAGE, { channelId }))
    })

    expect(navigate).toHaveBeenCalledWith(SCREENS.CHAT_ROOM, { channelId, requestPostId: 'req-99' })
  })
})
