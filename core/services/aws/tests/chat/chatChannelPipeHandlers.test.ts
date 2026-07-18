const mockGetDonationRequest = jest.fn()
const mockOpenChannel = jest.fn()
const mockLockChannel = jest.fn()

jest.mock('../../../../application/bloodDonationWorkflow/BloodDonationService', () => ({
  BloodDonationService: jest.fn().mockImplementation(() => ({
    getDonationRequest: mockGetDonationRequest
  }))
}))

jest.mock('../../../../application/chatWorkflow/ChatService', () => ({
  ChatService: jest.fn().mockImplementation(() => ({
    openChannel: mockOpenChannel,
    lockChannel: mockLockChannel
  }))
}))

jest.mock('../../commons/ddbOperations/BloodDonationDynamoDbOperations')
jest.mock('../../commons/ddbOperations/ChatDynamoDbOperations')
jest.mock('../../commons/ddbOperations/ChatRateLimitDynamoDbOperations')
jest.mock('../../commons/logger/ServiceLogger', () => ({
  createServiceLogger: jest.fn(() => ({
    info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn()
  }))
}))

import chatChannelCreator from '../../chat/chatChannelCreator'
import chatChannelLocker from '../../chat/chatChannelLocker'

const donationPost = {
  requestedBloodGroup: 'O+',
  urgencyLevel: 'urgent',
  donationDateTime: '2026-06-30T10:00:00.000Z',
  location: 'Dhaka'
}

const acceptEvent = {
  PK: 'BLOOD_REQ#seeker-1',
  SK: 'ACCEPTED#req-1#donor-1',
  createdAt: '2026-06-26T00:00:00.000Z'
}

describe('chatChannelCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetDonationRequest.mockResolvedValue(donationPost)
  })

  test('opens the channel with a context snapshot from the donation post on first accept', async() => {
    const result = await chatChannelCreator(acceptEvent)

    expect(result).toEqual({ status: 'Success' })
    expect(mockGetDonationRequest).toHaveBeenCalledWith('seeker-1', 'req-1', acceptEvent.createdAt)
    expect(mockOpenChannel).toHaveBeenCalledWith({
      seekerId: 'seeker-1',
      requestPostId: 'req-1',
      donorId: 'donor-1',
      context: {
        requestedBloodGroup: 'O+',
        urgencyLevel: 'urgent',
        donationDateTime: '2026-06-30T10:00:00.000Z',
        location: 'Dhaka'
      }
    })
  })

  test('re-opens on re-accept (idempotent upsert, called again)', async() => {
    await chatChannelCreator(acceptEvent)
    await chatChannelCreator(acceptEvent)

    expect(mockOpenChannel).toHaveBeenCalledTimes(2)
  })

  test('processes a batched array of pipe records', async() => {
    await chatChannelCreator([acceptEvent, { ...acceptEvent, SK: 'ACCEPTED#req-1#donor-2' }])

    expect(mockOpenChannel).toHaveBeenCalledTimes(2)
    expect(mockOpenChannel.mock.calls[1][0].donorId).toBe('donor-2')
  })
})

describe('chatChannelLocker', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLockChannel.mockResolvedValue(undefined)
  })

  test('locks the donor channel parsed from the REMOVE record', async() => {
    const result = await chatChannelLocker(acceptEvent)

    expect(result).toEqual({ status: 'Success' })
    expect(mockLockChannel).toHaveBeenCalledWith('seeker-1', 'req-1', 'donor-1')
  })

  test('completes without error when the channel does not exist (adapter no-op)', async() => {
    mockLockChannel.mockResolvedValue(undefined)

    await expect(chatChannelLocker(acceptEvent)).resolves.toEqual({ status: 'Success' })
  })
})
