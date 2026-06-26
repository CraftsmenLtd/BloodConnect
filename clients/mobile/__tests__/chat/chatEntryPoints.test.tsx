import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import DonorResponses from '../../src/myActivity/myPosts/donorResponses/DonorResponses'
import { ThemeProvider } from '../../src/setup/theme/context/ThemeContext'

const donors = [
  { donorId: 'donor-1', donorName: 'Alice' },
  { donorId: 'donor-2', donorName: 'Bob' }
]

const renderWithTheme = (component: React.ReactElement) =>
  render(<ThemeProvider>{component}</ThemeProvider>)

describe('DonorResponses chat entry point', () => {
  it('renders a Chat button per donor and fires onChatPress with the donorId when chat is enabled', () => {
    const onChatPress = jest.fn()
    const { getAllByText } = renderWithTheme(
      <DonorResponses acceptedDonors={donors} handlePressDonor={jest.fn()} onChatPress={onChatPress} />
    )

    const chatButtons = getAllByText('Chat')
    expect(chatButtons).toHaveLength(2)

    fireEvent.press(chatButtons[0])
    expect(onChatPress).toHaveBeenCalledWith('donor-1')
  })

  it('renders no Chat button when chat is disabled (onChatPress undefined)', () => {
    const { queryByText } = renderWithTheme(
      <DonorResponses acceptedDonors={donors} handlePressDonor={jest.fn()} />
    )

    expect(queryByText('Chat')).toBeNull()
  })
})
