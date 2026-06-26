import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import ChatInbox from '../../src/chat/ChatInbox'
import { ThemeProvider } from '../../src/setup/theme/context/ThemeContext'
import { ChatRole } from '../../../../commons/dto/ChatDTO'
import { SCREENS } from '../../src/setup/constant/screens'

const mockNavigate = jest.fn()
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate })
}))

const mockMarkRead = jest.fn()
const mockInboxState = {
  channels: [
    { channelId: 'seeker#req#donor', role: ChatRole.SEEKER, lastMessageAt: '2026-06-26T10:00:00.000Z', unread: true },
    { channelId: 's2#r2#d2', role: ChatRole.DONOR, lastMessageAt: '2026-06-26T09:00:00.000Z', unread: false }
  ],
  loading: false,
  error: null,
  refresh: jest.fn(),
  markRead: mockMarkRead
}
jest.mock('../../src/chat/useChatInbox', () => ({
  useChatInbox: () => mockInboxState
}))

const renderWithTheme = (component: React.ReactElement) =>
  render(<ThemeProvider>{component}</ThemeProvider>)

describe('ChatInbox', () => {
  afterEach(() => { jest.clearAllMocks() })

  it('lists channels and shows an unread badge only for unread channels', () => {
    const { getAllByText, getAllByTestId } = renderWithTheme(<ChatInbox />)

    expect(getAllByText('Chat with donor')).toHaveLength(1)
    expect(getAllByText('Chat with seeker')).toHaveLength(1)
    // Only the first channel is unread.
    expect(getAllByTestId('unread-badge')).toHaveLength(1)
  })

  it('navigates to the chat room and marks read when an unread channel is opened', () => {
    const { getByText } = renderWithTheme(<ChatInbox />)

    fireEvent.press(getByText('Chat with donor'))

    expect(mockMarkRead).toHaveBeenCalledWith('seeker#req#donor')
    expect(mockNavigate).toHaveBeenCalledWith(SCREENS.CHAT_ROOM, { channelId: 'seeker#req#donor' })
  })
})
