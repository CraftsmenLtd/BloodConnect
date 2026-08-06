import React from 'react'
import { render } from '@testing-library/react-native'
import DonorProfile from '../../src/myActivity/donorProfile/DonorProfile'
import useDonorProfile from '../../src/myActivity/donorProfile/useDonorProfile'

jest.mock('../../src/myActivity/donorProfile/useDonorProfile')

jest.mock('../../src/setup/theme/hooks/useTheme', () => ({
  useTheme: () => ({
    colors: {
      textSecondary: '#666666',
      textPrimary: '#000000',
      textTertiary: '#999999',
      primary: '#FF4D4D',
      surface: '#FFFFFF',
      onPrimary: '#FFFFFF',
      goldenYellow: '#FFD700'
    },
    typography: { fontFamily: 'Roboto_400Regular' }
  }),
  useIsDark: () => false
}))

const mockedUseDonorProfile = useDonorProfile as jest.MockedFunction<typeof useDonorProfile>

describe('DonorProfile', () => {
  const donorProfileState = (
    overrides: Partial<ReturnType<typeof useDonorProfile>>
  ): ReturnType<typeof useDonorProfile> => ({
    donorProfile: null,
    loading: false,
    error: null,
    handleCall: jest.fn(),
    ...overrides
  })

  test('should not crash while the donor profile is still loading', () => {
    mockedUseDonorProfile.mockReturnValue(donorProfileState({ loading: true }))

    expect(() => render(<DonorProfile />)).not.toThrow()
  })

  test('should not crash when the donor profile fails to load', () => {
    mockedUseDonorProfile.mockReturnValue(
      donorProfileState({ error: 'Failed to fetch donor profile.' })
    )

    const { getByText } = render(<DonorProfile />)

    expect(getByText('Failed to fetch donor profile.')).toBeTruthy()
  })

  test('should show the BMI once the donor profile has loaded', () => {
    mockedUseDonorProfile.mockReturnValue(
      donorProfileState({
        donorProfile: {
          age: 30,
          bloodGroup: 'O+',
          donorName: 'Ebrahim',
          gender: 'male',
          height: 5.9,
          weight: 70,
          phoneNumbers: ['+8801834567890'],
          preferredDonationLocations: [{ area: 'Banani, Dhaka' }]
        }
      })
    )

    const { getByText } = render(<DonorProfile />)

    expect(getByText('Ebrahim')).toBeTruthy()
    expect(getByText(/^BMI: \d/)).toBeTruthy()
  })

  test('should show "Not Available" when the donor has no weight or height', () => {
    mockedUseDonorProfile.mockReturnValue(
      donorProfileState({
        donorProfile: {
          age: 30,
          bloodGroup: 'O+',
          donorName: 'Ebrahim',
          gender: 'male',
          height: 0,
          weight: 0,
          phoneNumbers: [],
          preferredDonationLocations: []
        }
      })
    )

    const { getByText } = render(<DonorProfile />)

    expect(getByText('BMI: Not Available')).toBeTruthy()
  })
})
