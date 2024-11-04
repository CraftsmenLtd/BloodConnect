import { mockedNavigate } from '../__mocks__/reactNavigation.mock'
import { renderHook, act } from '@testing-library/react-native'
import { useAddPersonalInfo } from '../../src/userWorkflow/personalInfo/hooks/useAddPersonalInfo'
import { addPersonalInfoHandler } from '../../src/userWorkflow/services/userServices'
import { SCREENS } from '../../src/setup/constant/screens'

jest.mock('../../src/userWorkflow/services/userServices', () => ({
  addPersonalInfoHandler: jest.fn()
}))

jest.mock('../../src/LocationService/LocationService', () => ({
  LocationService: jest.fn().mockImplementation(() => ({
    getCoordinates: jest.fn().mockResolvedValue({ lat: 23.7936, lon: 90.4043 })
  }))
}))

jest.mock('@react-navigation/native', () => ({
  useNavigation: jest.fn()
}))

describe('useAddPersonalInfo Hook', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useAddPersonalInfo())

    expect(result.current.personalInfo).toEqual({
      bloodGroup: '',
      height: '',
      weight: '',
      gender: '',
      lastDonationDate: expect.any(Date),
      dateOfBirth: expect.any(Date),
      lastVaccinatedDate: expect.any(Date),
      city: '',
      locations: [],
      availableForDonation: 'yes',
      acceptPolicy: false
    })
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

  test('should disable button if fields are missing or errors exist', () => {
    const { result } = renderHook(() => useAddPersonalInfo())

    act(() => {
      result.current.handleInputChange('locations', ['Dhaka'])
      result.current.handleInputChange('gender', 'male')
      result.current.handleInputChange('city', 'Dhaka')
      result.current.handleInputChange('bloodGroup', 'O+')
      result.current.handleInputChange('height', '5.8')
      result.current.handleInputChange('weight', '60')
      result.current.handleInputChange('lastDonationDate', '2024-11-02T21:15:58.670Z')
      result.current.handleInputChange('dateOfBirth', '2002-11-03T21:15:58.670Z')
      result.current.handleInputChange('lastVaccinatedDate', '2024-11-02T21:15:58.670Z')
    })

    expect(result.current.isButtonDisabled).toBe(true)

    act(() => {
      result.current.handleInputChange('acceptPolicy', true)
    })

    expect(result.current.isButtonDisabled).toBe(false)
  })

  test('should submit data and navigate on successful submission', async() => {
    const { result } = renderHook(() => useAddPersonalInfo())
    ;(addPersonalInfoHandler as jest.Mock).mockResolvedValue({ status: 200 })

    act(() => {
      result.current.handleInputChange('bloodGroup', 'O+')
      result.current.handleInputChange('height', '170')
      result.current.handleInputChange('weight', '60')
      result.current.handleInputChange('acceptPolicy', true)
    })

    await act(async() => {
      await result.current.handleSubmit()
    })

    expect(addPersonalInfoHandler).toHaveBeenCalled()
    expect(mockedNavigate).toHaveBeenCalledWith(SCREENS.BOTTOM_TABS)
  })

  test('should set errorMessage on failed submission', async() => {
    const errorMessage = 'Submission failed'
    const { result } = renderHook(() => useAddPersonalInfo())
    ;(addPersonalInfoHandler as jest.Mock).mockRejectedValue(new Error(errorMessage))

    await act(async() => {
      await result.current.handleSubmit()
    })

    expect(result.current.errorMessage).toBe(errorMessage)
    expect(result.current.loading).toBe(false)
  })
})
