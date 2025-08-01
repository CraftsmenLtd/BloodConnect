import { mockedNavigate } from '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useAddPersonalInfo } from '../../src/userWorkflow/personalInfo/hooks/useAddPersonalInfo'
import { createUserProfile } from '../../src/userWorkflow/services/userProfileService'
import { SCREENS } from '../../src/setup/constant/screens'

const mockFetchUserProfile = jest.fn()
const mockGetLatLon = jest.fn()

jest.mock('aws-amplify/auth', () => ({
  getCurrentUser: jest.fn().mockResolvedValue({ username: 'test-user' })
}))

jest.mock('../../src/userWorkflow/services/userProfileService', () => ({
  createUserProfile: jest.fn()
}))

jest.mock('../../src/LocationService/LocationService', () => ({
  LocationService: jest.fn().mockImplementation(() => ({
    getLatLon: mockGetLatLon
  }))
}))

jest.mock('../../src/userWorkflow/context/UserProfileContext', () => ({
  useUserProfile: () => ({
    userProfile: null,
    loading: false,
    error: null,
    fetchUserProfile: mockFetchUserProfile
  })
}))

jest.mock('../../src/setup/clients/useFetchClient', () => ({
  useFetchClient: () => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn()
  })
}))

jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        API_BASE_URL: 'https://mock-api-url.com',
        GOOGLE_MAP_API: 'mock-api-key'
      }
    }
  }
}))

describe('useAddPersonalInfo Hook', () => {
  const validPersonalInfo = {
    bloodGroup: 'O+',
    height: '5.8',
    weight: '60',
    gender: 'male',
    lastDonationDate: new Date('2023-01-01'),
    dateOfBirth: new Date('2000-01-01'),
    lastVaccinatedDate: new Date('2023-06-01'),
    locations: ['Mirpur'],
    availableForDonation: 'yes',
    acceptPolicy: true
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockGetLatLon.mockReset()
    mockFetchUserProfile.mockReset()
    mockGetLatLon.mockResolvedValue({ latitude: 23.7936, longitude: 90.4043 })
    mockFetchUserProfile.mockResolvedValue(null)
  })

  test('should initialize with default values', async() => {
    const { result } = renderHook(() => useAddPersonalInfo())

    expect(result.current.personalInfo).toEqual(expect.objectContaining({
      bloodGroup: '',
      height: null,
      weight: null,
      gender: '',
      lastDonationDate: null,
      dateOfBirth: expect.any(Date),
      lastVaccinatedDate: null,
      locations: [],
      availableForDonation: true,
      acceptPolicy: false
    }))
    expect(result.current.errors).toEqual(expect.any(Object))
    expect(result.current.errorMessage).toBe('')
    expect(result.current.loading).toBe(false)
    expect(result.current.isButtonDisabled).toBe(true)

  })

  test('should update personalInfo and validate input on handleInputChange', () => {
    const { result } = renderHook(() => useAddPersonalInfo())

    act(() => {
      result.current.handleInputChange('bloodGroup', 'O+')
    })

    expect(result.current.personalInfo.bloodGroup).toBe('O+')
    expect(result.current.errors.bloodGroup).toBe(null)
  })

  test('should disable button if fields are missing or errors exist', async() => {
    const { result } = renderHook(() => useAddPersonalInfo())

    for (const [key, value] of Object.entries(validPersonalInfo)) {
      if (key !== 'acceptPolicy') {
        await act(async() => {
          result.current.handleInputChange(key as keyof typeof validPersonalInfo, value)
        })
      }
    }

    expect(result.current.isButtonDisabled).toBe(true)

    act(() => {
      result.current.handleInputChange('acceptPolicy', 'true')
    })

    expect(result.current.isButtonDisabled).toBe(false)
  })

  test('should submit data and navigate on successful submission', async() => {
    mockGetLatLon.mockResolvedValue({ latitude: 23.7936, longitude: 90.4043 });
    (createUserProfile as jest.Mock).mockResolvedValue({ status: 201 })

    const { result } = renderHook(() => useAddPersonalInfo())

    for (const [key, value] of Object.entries(validPersonalInfo)) {
      await act(async() => {
        result.current.handleInputChange(key as keyof typeof validPersonalInfo, value)
      })
    }

    await act(async() => {
      await result.current.handleSubmit()
    })

    expect(createUserProfile).toHaveBeenCalled()
    expect(mockFetchUserProfile).toHaveBeenCalled()
    expect(mockedNavigate).toHaveBeenCalledWith(SCREENS.BOTTOM_TABS)
  })

  test('should set errorMessage on failed submission', async() => {
    mockGetLatLon.mockResolvedValue({ latitude: 23.7936, longitude: 90.4043 })
    const errorMessage = 'network error';
    (createUserProfile as jest.Mock).mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useAddPersonalInfo())

    for (const [key, value] of Object.entries(validPersonalInfo)) {
      await act(async() => {
        result.current.handleInputChange(key as keyof typeof validPersonalInfo, value)
      })
    }

    await act(async() => {
      await result.current.handleSubmit()
    })

    expect(result.current.errorMessage).toBe('Please check your internet connection.')
    expect(result.current.loading).toBe(false)
  })
})
