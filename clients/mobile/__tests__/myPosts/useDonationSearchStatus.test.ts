import { renderHook, act } from '@testing-library/react-native'
import useDonationSearchStatus from '../../src/myActivity/myPosts/details/useDonationSearchStatus'
import { fetchSingleDonationPost } from '../../src/donationWorkflow/donationService'
import type { DonationSearchStatusInfo } from '../../../../commons/dto/DonationDTO'
import { DonorSearchStatus } from '../../../../commons/dto/DonationDTO'

jest.mock('../../src/donationWorkflow/donationService', () => ({
  fetchSingleDonationPost: jest.fn()
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
        API_BASE_URL: 'https://mock-api.test'
      }
    }
  }
}))

jest.mock('../../src/authentication/context/AuthContext', () => ({
  AuthContext: { Consumer: jest.fn(), Provider: jest.fn() }
}))

const mockFetchSingleDonationPost = fetchSingleDonationPost as jest.Mock

const pendingSearchStatus: DonationSearchStatusInfo = {
  donorSearchStatus: DonorSearchStatus.PENDING,
  notifiedDonorsCount: 5,
  acceptedDonorsCount: 2,
  rejectedDonorsCount: 3,
  currentSearchRadiusKm: 8.5
}

const completedSearchStatus: DonationSearchStatusInfo = {
  donorSearchStatus: DonorSearchStatus.COMPLETED,
  notifiedDonorsCount: 10,
  acceptedDonorsCount: 4,
  rejectedDonorsCount: 6,
  currentSearchRadiusKm: 12.0
}

const mockSuccessResponse = (status: DonationSearchStatusInfo) => ({
  data: { searchStatus: status },
  status: 200
})

describe('useDonationSearchStatus', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  test('fetches on mount and sets searchStatus from response', async() => {
    mockFetchSingleDonationPost.mockResolvedValue(mockSuccessResponse(pendingSearchStatus))

    const { result } = renderHook(() =>
      useDonationSearchStatus('seeker1', 'req1', '2026-01-01T00:00:00Z')
    )

    expect(result.current.isLoading).toBe(true)
    expect(result.current.searchStatus).toBeNull()

    await act(async() => {
      await Promise.resolve()
    })

    expect(result.current.isLoading).toBe(false)
    expect(result.current.searchStatus).toEqual(pendingSearchStatus)
    expect(result.current.error).toBeNull()
    expect(mockFetchSingleDonationPost).toHaveBeenCalledTimes(1)
    expect(mockFetchSingleDonationPost).toHaveBeenCalledWith('req1', '2026-01-01T00:00:00Z', expect.any(Object))
  })

  test('polls again after 15 seconds when status is PENDING', async() => {
    mockFetchSingleDonationPost.mockResolvedValue(mockSuccessResponse(pendingSearchStatus))

    const { result } = renderHook(() =>
      useDonationSearchStatus('seeker1', 'req1', '2026-01-01T00:00:00Z')
    )

    await act(async() => {
      await Promise.resolve()
    })

    expect(mockFetchSingleDonationPost).toHaveBeenCalledTimes(1)

    await act(async() => {
      jest.advanceTimersByTime(15_000)
      await Promise.resolve()
    })

    expect(mockFetchSingleDonationPost).toHaveBeenCalledTimes(2)
    expect(result.current.searchStatus).toEqual(pendingSearchStatus)
  })

  test('does not poll after status becomes COMPLETED', async() => {
    mockFetchSingleDonationPost.mockResolvedValue(mockSuccessResponse(completedSearchStatus))

    renderHook(() =>
      useDonationSearchStatus('seeker1', 'req1', '2026-01-01T00:00:00Z')
    )

    await act(async() => {
      await Promise.resolve()
    })

    expect(mockFetchSingleDonationPost).toHaveBeenCalledTimes(1)

    await act(async() => {
      jest.advanceTimersByTime(15_000)
      await Promise.resolve()
    })

    expect(mockFetchSingleDonationPost).toHaveBeenCalledTimes(1)
  })

  test('sets error but keeps prior searchStatus on poll failure', async() => {
    mockFetchSingleDonationPost
      .mockResolvedValueOnce(mockSuccessResponse(pendingSearchStatus))
      .mockRejectedValueOnce(new Error('Network timeout'))

    const { result } = renderHook(() =>
      useDonationSearchStatus('seeker1', 'req1', '2026-01-01T00:00:00Z')
    )

    await act(async() => {
      await Promise.resolve()
    })

    expect(result.current.searchStatus).toEqual(pendingSearchStatus)

    await act(async() => {
      jest.advanceTimersByTime(15_000)
      await Promise.resolve()
    })

    expect(result.current.error).toBe('Network timeout')
    expect(result.current.searchStatus).toEqual(pendingSearchStatus)
  })

  test('clears interval on unmount', async() => {
    mockFetchSingleDonationPost.mockResolvedValue(mockSuccessResponse(pendingSearchStatus))
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

    const { unmount } = renderHook(() =>
      useDonationSearchStatus('seeker1', 'req1', '2026-01-01T00:00:00Z')
    )

    await act(async() => {
      await Promise.resolve()
    })

    unmount()

    expect(clearIntervalSpy).toHaveBeenCalled()
    clearIntervalSpy.mockRestore()
  })
})
