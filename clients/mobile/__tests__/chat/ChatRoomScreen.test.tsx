import React from 'react'
import { StyleSheet } from 'react-native'
import { render, screen } from '@testing-library/react-native'
import ChatRoomScreen from '../../src/chat/ChatRoomScreen'
import { ThemeProvider } from '../../src/setup/theme/context/ThemeContext'
import { useChat } from '../../src/chat/context/ChatProvider'
import { useChatMessages } from '../../src/chat/hooks/useChatMessages'
import { useUserProfile } from '../../src/userWorkflow/context/UserProfileContext'
import { useFetchClient } from '../../src/setup/clients/useFetchClient'
import type { ChatChannelDTO, ChatMessageDTO } from '../../../../commons/dto/ChatDTO'

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { channelId: 'ch1', requestPostId: 'req-1', bloodGroup: 'O+' } }),
  useFocusEffect: jest.fn()
}))

jest.mock('../../src/setup/clients/useFetchClient', () => ({ useFetchClient: jest.fn() }))
jest.mock('../../src/userWorkflow/context/UserProfileContext', () => ({ useUserProfile: jest.fn() }))
jest.mock('../../src/chat/context/ChatProvider', () => ({ useChat: jest.fn() }))
jest.mock('../../src/chat/hooks/useChatRoomConnection', () => ({
  useChatRoomConnection: () => ({ isConnected: true, sendOrQueue: jest.fn().mockResolvedValue(undefined) })
}))
jest.mock('../../src/chat/hooks/useChatMessages', () => {
  const actual = jest.requireActual('../../src/chat/hooks/useChatMessages')

  return { ...actual, useChatMessages: jest.fn() }
})

const CURRENT_USER_ID = 'seeker-1'

const buildMessage = (messageId: string, senderId: string, text: string): ChatMessageDTO => ({
  channelId: 'ch1',
  messageId,
  senderId,
  text,
  createdAt: `2026-06-26T10:0${messageId.slice(-1)}:00.000Z`,
  expiresAt: 1_900_000_000
})

const buildChannel = (status: ChatChannelDTO['status']): ChatChannelDTO => ({
  channelId: 'ch1',
  seekerId: CURRENT_USER_ID,
  donorId: 'donor-1',
  requestPostId: 'req-1',
  status,
  createdAt: '2026-06-26T09:00:00.000Z'
})

const setupHooks = (channel: ChatChannelDTO, messages: ChatMessageDTO[]): void => {
  (useFetchClient as jest.Mock).mockReturnValue({ get: jest.fn(), post: jest.fn(), patch: jest.fn() });
  (useUserProfile as jest.Mock).mockReturnValue({ userProfile: { userId: CURRENT_USER_ID } });
  (useChat as jest.Mock).mockReturnValue({
    channels: [channel],
    messagesByChannel: {},
    upsertMessages: jest.fn(),
    setUnreadCount: jest.fn()
  });
  (useChatMessages as jest.Mock).mockReturnValue({
    messages,
    loading: false,
    hasMore: false,
    loadMore: jest.fn().mockResolvedValue(undefined),
    addMessages: jest.fn()
  })
}

const renderScreen = (): void => {
  render(
    <ThemeProvider>
      <ChatRoomScreen />
    </ThemeProvider>
  )
}

describe('ChatRoomScreen', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders sent and received messages with visually distinct styling', () => {
    setupHooks(buildChannel('ACTIVE'), [
      buildMessage('m1', 'donor-1', 'hello from donor'),
      buildMessage('m2', CURRENT_USER_ID, 'reply from seeker')
    ])

    renderScreen()

    const sent = screen.getByTestId('chat-message-sent')
    const received = screen.getByTestId('chat-message-received')
    const sentStyle = StyleSheet.flatten(sent.props.style)
    const receivedStyle = StyleSheet.flatten(received.props.style)

    expect(sentStyle.backgroundColor).not.toBe(receivedStyle.backgroundColor)
  })

  it('renders a composer for an active channel', () => {
    setupHooks(buildChannel('ACTIVE'), [])

    renderScreen()

    expect(screen.getByTestId('chat-composer')).toBeTruthy()
    expect(screen.queryByTestId('chat-locked-banner')).toBeNull()
  })

  it('renders read-only with no composer when the channel is locked', () => {
    setupHooks(buildChannel('LOCKED'), [buildMessage('m1', 'donor-1', 'hello')])

    renderScreen()

    expect(screen.queryByTestId('chat-composer')).toBeNull()
    expect(screen.getByTestId('chat-locked-banner')).toBeTruthy()
  })
})
