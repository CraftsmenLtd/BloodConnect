import { renderHook, waitFor } from '@testing-library/react-native'
import useDonorResponses, {
  clearDonorDetailsCache
} from '../../src/myActivity/myPosts/donorResponses/useDonorResponses'
import { getDonorProfile } from '../../src/userWorkflow/services/userServices'

jest.mock('../../src/userWorkflow/services/userServices')

// Mirrors the real hook: a new client instance on every call, so an unstable dependency here
// would re-run the effect on every render.
jest.mock('../../src/setup/clients/useFetchClient', () => ({
  useFetchClient: () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn() })
}))

const mockedGetDonorProfile = getDonorProfile as jest.MockedFunction<typeof getDonorProfile>

const donorProfileResponse = (area: string, profilePicture?: string) => ({
  message: 'ok',
  status: 200,
  data: {
    preferredDonationLocations: [{ area }],
    ...(profilePicture !== undefined && { profilePicture })
  }
})

describe('useDonorResponses', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    clearDonorDetailsCache()
  })

  test('should expose picture and area keyed by donor id', async() => {
    mockedGetDonorProfile.mockResolvedValue(
      donorProfileResponse('Dhanmondi', 'https://example.com/a.jpg')
    )

    const { result } = renderHook(() => useDonorResponses([
      { donorId: 'donor-1', donorName: 'Ebrahim' }
    ]))

    await waitFor(() => {
      expect(result.current['donor-1']).toEqual({
        profilePicture: 'https://example.com/a.jpg',
        area: 'Dhanmondi'
      })
    })
  })

  test('should keep other donors when one profile fails to load', async() => {
    mockedGetDonorProfile.mockImplementation(async(donorId: string) => {
      if (donorId === 'donor-1') {
        throw new Error('not found')
      }

      return donorProfileResponse('Uttara', 'https://example.com/b.jpg')
    })

    const { result } = renderHook(() => useDonorResponses([
      { donorId: 'donor-1', donorName: 'Ebrahim' },
      { donorId: 'donor-2', donorName: 'Rahim' }
    ]))

    await waitFor(() => {
      expect(result.current['donor-2']?.area).toBe('Uttara')
    })
    expect(result.current['donor-1']).toBeUndefined()
  })

  test('should not refetch a donor already loaded on an earlier visit', async() => {
    mockedGetDonorProfile.mockResolvedValue(donorProfileResponse('Dhanmondi'))
    const acceptedDonors = [{ donorId: 'donor-1', donorName: 'Ebrahim' }]

    const firstVisit = renderHook(() => useDonorResponses(acceptedDonors))
    await waitFor(() => {
      expect(firstVisit.result.current['donor-1']).toBeDefined()
    })
    firstVisit.unmount()

    const secondVisit = renderHook(() => useDonorResponses(acceptedDonors))

    expect(secondVisit.result.current['donor-1']?.area).toBe('Dhanmondi')
    expect(mockedGetDonorProfile).toHaveBeenCalledTimes(1)
  })

  test('should retry a donor whose profile failed on an earlier visit', async() => {
    mockedGetDonorProfile.mockRejectedValueOnce(new Error('network'))
    mockedGetDonorProfile.mockResolvedValue(donorProfileResponse('Uttara'))
    const acceptedDonors = [{ donorId: 'donor-1', donorName: 'Ebrahim' }]

    const firstVisit = renderHook(() => useDonorResponses(acceptedDonors))
    await waitFor(() => {
      expect(mockedGetDonorProfile).toHaveBeenCalledTimes(1)
    })
    firstVisit.unmount()

    const secondVisit = renderHook(() => useDonorResponses(acceptedDonors))

    await waitFor(() => {
      expect(secondVisit.result.current['donor-1']?.area).toBe('Uttara')
    })
    expect(mockedGetDonorProfile).toHaveBeenCalledTimes(2)
  })

  test('should fetch only the donors that are not already cached', async() => {
    mockedGetDonorProfile.mockResolvedValue(donorProfileResponse('Dhanmondi'))

    const firstVisit = renderHook(() => useDonorResponses([
      { donorId: 'donor-1', donorName: 'Ebrahim' }
    ]))
    await waitFor(() => {
      expect(firstVisit.result.current['donor-1']).toBeDefined()
    })
    firstVisit.unmount()

    const secondVisit = renderHook(() => useDonorResponses([
      { donorId: 'donor-1', donorName: 'Ebrahim' },
      { donorId: 'donor-2', donorName: 'Rahim' }
    ]))

    await waitFor(() => {
      expect(secondVisit.result.current['donor-2']).toBeDefined()
    })
    expect(mockedGetDonorProfile).toHaveBeenCalledTimes(2)
    expect(mockedGetDonorProfile).toHaveBeenLastCalledWith('donor-2', expect.anything())
  })

  test('should not refetch when the component re-renders with the same donors', async() => {
    mockedGetDonorProfile.mockResolvedValue(donorProfileResponse('Dhanmondi'))
    const acceptedDonors = [{ donorId: 'donor-1', donorName: 'Ebrahim' }]

    const { result, rerender } = renderHook(() => useDonorResponses(acceptedDonors))

    await waitFor(() => {
      expect(result.current['donor-1']).toBeDefined()
    })
    expect(mockedGetDonorProfile).toHaveBeenCalledTimes(1)

    rerender({})
    rerender({})

    expect(mockedGetDonorProfile).toHaveBeenCalledTimes(1)
  })

  test('should settle without fetching when there are no accepted donors', async() => {
    const { result, rerender } = renderHook(() => useDonorResponses([]))

    rerender({})
    rerender({})

    expect(mockedGetDonorProfile).not.toHaveBeenCalled()
    expect(result.current).toEqual({})
  })
})
