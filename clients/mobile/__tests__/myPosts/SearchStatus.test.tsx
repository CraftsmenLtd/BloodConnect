import React from 'react'
import { render } from '@testing-library/react-native'
import SearchStatus, { getDisplayRadius } from '../../src/myActivity/myPosts/details/SearchStatus'
import type { DonationSearchStatusInfo } from '../../../../commons/dto/DonationDTO'
import { DonorSearchStatus } from '../../../../commons/dto/DonationDTO'

jest.mock('@maplibre/maplibre-react-native', () => ({
  MapView: 'MapView',
  Camera: 'Camera',
  ShapeSource: 'ShapeSource',
  FillLayer: 'FillLayer',
  LineLayer: 'LineLayer',
  MarkerView: 'MarkerView',
  RasterSource: 'RasterSource',
  RasterLayer: 'RasterLayer',
  StyleURL: { Default: 'mapbox://styles/mapbox/streets-v11' },
  StyleSheet: { absoluteFill: {} }
}))

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons'
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

jest.mock('../../src/setup/clients/useFetchClient', () => ({
  useFetchClient: () => ({
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn()
  })
}))

const mockUseDonationSearchStatus = jest.fn()

jest.mock('../../src/myActivity/myPosts/details/useDonationSearchStatus', () => ({
  __esModule: true,
  default: (...args: unknown[]) => mockUseDonationSearchStatus(...args)
}))

const defaultProps = {
  seekerId: 'seeker1',
  requestPostId: 'req1',
  createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  latitude: 23.79,
  longitude: 90.40
}

const mockSearchStatus: DonationSearchStatusInfo = {
  donorSearchStatus: DonorSearchStatus.PENDING,
  notifiedDonorsCount: 7,
  acceptedDonorsCount: 3,
  rejectedDonorsCount: 4,
  currentSearchRadiusKm: 5.2
}

describe('SearchStatus', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  test('shows skeleton when isLoading and searchStatus is null', () => {
    mockUseDonationSearchStatus.mockReturnValue({
      searchStatus: null,
      isLoading: true,
      error: null
    })

    const { getByTestId, queryByTestId } = render(<SearchStatus {...defaultProps} />)

    expect(getByTestId('search-status-skeleton')).toBeTruthy()
    expect(queryByTestId('search-status-container')).toBeNull()
  })

  test('renders count testIDs with correct values after data loads', () => {
    mockUseDonationSearchStatus.mockReturnValue({
      searchStatus: mockSearchStatus,
      isLoading: false,
      error: null
    })

    const { getByTestId } = render(<SearchStatus {...defaultProps} />)

    expect(getByTestId('search-status-container')).toBeTruthy()
    expect(getByTestId('search-status-notified-count').props.children).toBe(7)
    expect(getByTestId('search-status-accepted-count').props.children).toBe(3)
    expect(getByTestId('search-status-rejected-count').props.children).toBe(4)
  })

  test('does not show skeleton when isLoading but searchStatus already set', () => {
    mockUseDonationSearchStatus.mockReturnValue({
      searchStatus: mockSearchStatus,
      isLoading: true,
      error: null
    })

    const { queryByTestId, getByTestId } = render(<SearchStatus {...defaultProps} />)

    expect(queryByTestId('search-status-skeleton')).toBeNull()
    expect(getByTestId('search-status-container')).toBeTruthy()
  })

  test('renders elapsed time text', () => {
    mockUseDonationSearchStatus.mockReturnValue({
      searchStatus: mockSearchStatus,
      isLoading: false,
      error: null
    })

    const { getByTestId } = render(<SearchStatus {...defaultProps} />)

    const elapsedEl = getByTestId('search-status-elapsed-time')
    expect(elapsedEl.props.children[0]).toContain('Searching for')
    expect(elapsedEl.props.children[1]).toContain('m')
  })

  test('shows radius label with km value when radius is set', () => {
    mockUseDonationSearchStatus.mockReturnValue({
      searchStatus: mockSearchStatus,
      isLoading: false,
      error: null
    })

    const { getByText } = render(<SearchStatus {...defaultProps} />)

    expect(getByText('5.2 km radius')).toBeTruthy()
  })

  test('shows starting text in radius label when radius is 0', () => {
    mockUseDonationSearchStatus.mockReturnValue({
      searchStatus: { ...mockSearchStatus, currentSearchRadiusKm: 0 },
      isLoading: false,
      error: null
    })

    const { getByText } = render(<SearchStatus {...defaultProps} />)

    expect(getByText('Starting search…')).toBeTruthy()
  })
})

describe('getDisplayRadius', () => {
  test('returns actual radius when radiusKm > 0', () => {
    expect(getDisplayRadius(8.5, true)).toBe(8.5)
    expect(getDisplayRadius(8.5, false)).toBe(8.5)
  })

  test('returns INITIAL_SEARCH_RADIUS_KM when radiusKm is 0 and isPending', () => {
    expect(getDisplayRadius(0, true)).toBe(2)
  })

  test('returns 0 when radiusKm is 0 and not pending', () => {
    expect(getDisplayRadius(0, false)).toBe(0)
  })
})
