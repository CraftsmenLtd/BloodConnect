import React from 'react'
import { Image } from 'react-native'
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

  const loadedDonor = {
    age: 30,
    bloodGroup: 'O+',
    donorName: 'Ebrahim Khan',
    gender: 'male',
    height: 5.9,
    weight: 70,
    profilePicture: '',
    phoneNumbers: ['+8801834567890'],
    preferredDonationLocations: [{ area: 'Banani, Dhaka' }]
  }

  test('should show the donor\'s uploaded picture when they have one', () => {
    mockedUseDonorProfile.mockReturnValue(
      donorProfileState({
        donorProfile: {
          ...loadedDonor,
          profilePicture: 'https://cdn.bloodconnect.net/avatars/donor-1.jpg'
        }
      })
    )

    const { queryByText, UNSAFE_getByType } = render(<DonorProfile />)

    expect(UNSAFE_getByType(Image).props.source).toEqual({
      uri: 'https://cdn.bloodconnect.net/avatars/donor-1.jpg'
    })
    // The initials placeholder must not be rendered alongside the real picture.
    expect(queryByText('EK')).toBeNull()
  })

  test('should fall back to the donor\'s initials when they have no picture', () => {
    mockedUseDonorProfile.mockReturnValue(donorProfileState({ donorProfile: loadedDonor }))

    const { getByText, UNSAFE_queryByType } = render(<DonorProfile />)

    expect(getByText('EK')).toBeTruthy()
    expect(UNSAFE_queryByType(Image)).toBeNull()
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
          profilePicture: '',
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
          profilePicture: '',
          phoneNumbers: [],
          preferredDonationLocations: []
        }
      })
    )

    const { getByText } = render(<DonorProfile />)

    expect(getByText('BMI: Not Available')).toBeTruthy()
  })
})
