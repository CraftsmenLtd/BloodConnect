import React from 'react'
import { render } from '@testing-library/react-native'
import ChatRoom from '../../src/chat/ChatRoom'
import { ThemeProvider } from '../../src/setup/theme/context/ThemeContext'
import { ChatChannelStatus } from '../../../../commons/dto/ChatDTO'

jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { channelId: 'seeker-1#req-1#donor-1' } })
}))

jest.mock('../../src/userWorkflow/context/UserProfileContext', () => ({
  useUserProfile: () => ({ userProfile: { userId: 'donor-1' } })
}))

const chatRoomState: Record<string, unknown> = {}
jest.mock('../../src/chat/useChatRoom', () => ({
  useChatRoom: () => chatRoomState
}))

const context = {
  requestedBloodGroup: 'O+',
  urgencyLevel: 'urgent',
  donationDateTime: '2026-06-30T10:00:00.000Z',
  location: 'Dhaka Medical'
}

const messages = [
  { channelId: 'c', messageId: 'm2', senderId: 'donor-1', content: 'mine', createdAt: '2026-06-26T10:00:02.000Z' },
  { channelId: 'c', messageId: 'm1', senderId: 'seeker-1', content: 'theirs', createdAt: '2026-06-26T10:00:01.000Z' }
]

const renderWithTheme = (component: React.ReactElement) =>
  render(<ThemeProvider>{component}</ThemeProvider>)

describe('ChatRoom', () => {
  it('renders the header context snapshot on a cold-start deep-link (no post fetch)', () => {
    Object.assign(chatRoomState, {
      messages, channel: { status: ChatChannelStatus.OPEN, context }, loading: false, error: null, send: jest.fn()
    })

    const { getByText } = renderWithTheme(<ChatRoom />)

    expect(getByText('O+')).toBeTruthy()
    expect(getByText('Dhaka Medical')).toBeTruthy()
    // Both participants' messages render.
    expect(getByText('mine')).toBeTruthy()
    expect(getByText('theirs')).toBeTruthy()
  })

  it('shows the input when the channel is open', () => {
    Object.assign(chatRoomState, {
      messages: [], channel: { status: ChatChannelStatus.OPEN, context }, loading: false, error: null, send: jest.fn()
    })

    const { getByText, queryByText } = renderWithTheme(<ChatRoom />)

    expect(getByText('Send')).toBeTruthy()
    expect(queryByText(/conversation is closed/i)).toBeNull()
  })

  it('shows a read-only locked banner instead of the input when the channel is locked', () => {
    Object.assign(chatRoomState, {
      messages: [], channel: { status: ChatChannelStatus.LOCKED, context }, loading: false, error: null, send: jest.fn()
    })

    const { getByText, queryByText } = renderWithTheme(<ChatRoom />)

    expect(getByText(/conversation is closed/i)).toBeTruthy()
    expect(queryByText('Send')).toBeNull()
  })
})
