import { DynamoDBDocumentClient, GetCommand, TransactWriteCommand } from '@aws-sdk/lib-dynamodb'
import { mockClient } from 'aws-sdk-client-mock'
import { AcceptDonationService } from '../../bloodDonationWorkflow/AcceptDonationRequestService'
import { ChatChannelService } from '../../chatWorkflow/ChatChannelService'
import ChatChannelDynamoDbOperations from '../../../services/aws/commons/ddbOperations/ChatChannelDynamoDbOperations'
import { AcceptDonationStatus, DonationStatus } from '../../../../commons/dto/DonationDTO'
import { NotificationType } from '../../../../commons/dto/NotificationDTO'
import type { AcceptDonationDTO, DonationDTO } from '../../../../commons/dto/DonationDTO'
import type AcceptDonationRepository from '../../models/policies/repositories/AcceptDonationRepository'
import type { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import type { NotificationService } from '../../notificationWorkflow/NotificationService'
import type { UserService } from '../../userWorkflow/UserService'
import type { QueueModel } from '../../models/queue/QueueModel'
import type { UserDetailsDTO } from '../../../../commons/dto/UserDTO'
import { mockLogger } from '../mocks/mockLogger'
import { donationDtoMock } from '../mocks/mockDonationRequestData'
import { mockUserDetailsWithStringId } from '../mocks/mockUserData'

const donorId = 'donor1'
const seekerId = 'seeker1'
const requestPostId = 'req1'
const createdAt = '2026-06-26T10:00:00.000Z'
const notificationQueueUrl = 'http://localhost/queue'
const channelId = `${seekerId}#${requestPostId}#${donorId}`

const donorProfile: UserDetailsDTO = { ...mockUserDetailsWithStringId, id: donorId, bloodGroup: 'O-' }
const seekerProfile: UserDetailsDTO = { ...mockUserDetailsWithStringId, id: seekerId }
const donationPost: DonationDTO = {
  ...donationDtoMock,
  seekerId,
  requestPostId,
  requestedBloodGroup: 'O-',
  status: DonationStatus.PENDING
}

const acceptedRecord: AcceptDonationDTO = {
  donorId,
  seekerId,
  requestPostId,
  createdAt,
  status: AcceptDonationStatus.ACCEPTED,
  acceptanceTime: createdAt
}

const ddbMock = mockClient(DynamoDBDocumentClient)

const acceptDonationRepository = {
  getAcceptedRequest: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  deleteAcceptedRequest: jest.fn(),
  queryAcceptedRequests: jest.fn()
} as unknown as jest.Mocked<AcceptDonationRepository>

const bloodDonationService = {
  getDonationRequest: jest.fn()
} as unknown as jest.Mocked<BloodDonationService>

const userService = {
  getUser: jest.fn()
} as unknown as jest.Mocked<UserService>

const notificationService = {
  sendNotification: jest.fn(),
  getBloodDonationNotification: jest.fn(),
  createBloodDonationNotification: jest.fn(),
  updateBloodDonationNotificationStatus: jest.fn()
} as unknown as jest.Mocked<NotificationService>

const queueModel = {
  queue: jest.fn(),
  updateVisibilityTimeout: jest.fn()
} as unknown as jest.Mocked<QueueModel>

const chatChannelService = new ChatChannelService(
  new ChatChannelDynamoDbOperations('TestTable', 'ap-south-1')
)
const service = new AcceptDonationService(acceptDonationRepository, mockLogger)

const runAccept = (status: AcceptDonationStatus): Promise<void> =>
  service.acceptDonationRequest(
    donorId,
    seekerId,
    requestPostId,
    createdAt,
    status,
    bloodDonationService,
    userService,
    notificationService,
    queueModel,
    notificationQueueUrl,
    chatChannelService
  )

const chatOpenedNotifications = (): { userId: string; channelId: unknown }[] =>
  notificationService.sendNotification.mock.calls
    .map((call) => call[0])
    .filter((attributes) => attributes.type === NotificationType.CHAT_MESSAGE)
    .map((attributes) => ({
      userId: attributes.userId,
      channelId: (attributes.payload as Record<string, unknown>).channelId
    }))

describe('AcceptDonationService chat-channel integration (TASK-010)', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ddbMock.reset()
    ddbMock.on(GetCommand).resolves({ Item: undefined })
    ddbMock.on(TransactWriteCommand).resolves({ $metadata: { httpStatusCode: 200 } })
    userService.getUser.mockImplementation(
      (id: string) => Promise.resolve(id === donorId ? donorProfile : seekerProfile)
    )
    bloodDonationService.getDonationRequest.mockResolvedValue(donationPost)
    acceptDonationRepository.queryAcceptedRequests.mockResolvedValue([])
    acceptDonationRepository.create.mockResolvedValue(acceptedRecord)
    notificationService.getBloodDonationNotification.mockResolvedValue(null)
  })

  it('creates exactly one channel plus two inbox pointers on a new acceptance', async() => {
    acceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)

    await runAccept(AcceptDonationStatus.ACCEPTED)

    const transactCalls = ddbMock.commandCalls(TransactWriteCommand)
    expect(transactCalls).toHaveLength(1)
    const items = transactCalls[0].args[0].input.TransactItems
    expect(items).toHaveLength(3)
    expect(items?.[0].Put?.ConditionExpression).toBe('attribute_not_exists(PK)')
    expect(items?.[0].Put?.Item?.PK).toBe(`CHAT#${channelId}`)
    expect(items?.[1].Put?.Item?.PK).toBe(`USER#${seekerId}`)
    expect(items?.[2].Put?.Item?.PK).toBe(`USER#${donorId}`)
  })

  it('notifies both the seeker and the donor that the chat is open', async() => {
    acceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)

    await runAccept(AcceptDonationStatus.ACCEPTED)

    const notified = chatOpenedNotifications()
    expect(notified.map((entry) => entry.userId).sort()).toEqual([donorId, seekerId].sort())
    expect(notified.every((entry) => entry.channelId === channelId)).toBe(true)
  })

  it('recovers from a partial failure: a retry via the else branch creates the missing channel', async() => {
    // ADV-001: acceptance record already written, but the prior channel-create failed,
    // so the retry re-enters via the already-accepted (else) branch with no channel yet.
    acceptDonationRepository.getAcceptedRequest.mockResolvedValue(acceptedRecord)
    ddbMock.on(GetCommand).resolves({ Item: undefined })

    await runAccept(AcceptDonationStatus.ACCEPTED)

    const transactCalls = ddbMock.commandCalls(TransactWriteCommand)
    expect(transactCalls).toHaveLength(1)
    expect(transactCalls[0].args[0].input.TransactItems?.[0].Put?.Item?.PK).toBe(`CHAT#${channelId}`)
    expect(chatOpenedNotifications().map((entry) => entry.userId).sort())
      .toEqual([donorId, seekerId].sort())
  })

  it('does not create a duplicate channel when one already exists (idempotency)', async() => {
    acceptDonationRepository.getAcceptedRequest.mockResolvedValue(acceptedRecord)
    ddbMock.on(GetCommand).resolves({
      Item: {
        PK: `CHAT#${channelId}`,
        SK: 'METADATA',
        seekerId,
        donorId,
        requestPostId,
        status: 'ACTIVE',
        createdAt,
        expiresAt: 1790000000
      }
    })

    await runAccept(AcceptDonationStatus.ACCEPTED)

    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(0)
    expect(chatOpenedNotifications().map((entry) => entry.userId).sort())
      .toEqual([donorId, seekerId].sort())
  })

  it('does not create a channel when a donor ignores an existing acceptance', async() => {
    acceptDonationRepository.getAcceptedRequest.mockResolvedValue(acceptedRecord)

    await runAccept(AcceptDonationStatus.IGNORED)

    expect(acceptDonationRepository.deleteAcceptedRequest).toHaveBeenCalledWith(
      seekerId,
      requestPostId,
      donorId
    )
    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(0)
    expect(chatOpenedNotifications()).toHaveLength(0)
  })

  it('does not create a channel for a brand-new IGNORED response', async() => {
    acceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)

    await runAccept(AcceptDonationStatus.IGNORED)

    expect(acceptDonationRepository.create).not.toHaveBeenCalled()
    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(0)
    expect(chatOpenedNotifications()).toHaveLength(0)
  })

  it('preserves existing acceptance behavior: writes the acceptance record on a new accept', async() => {
    acceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)

    await runAccept(AcceptDonationStatus.ACCEPTED)

    expect(acceptDonationRepository.create).toHaveBeenCalledTimes(1)
    expect(notificationService.sendNotification).toHaveBeenCalledWith(
      expect.objectContaining({ type: NotificationType.REQ_ACCEPTED, userId: seekerId }),
      queueModel,
      notificationQueueUrl
    )
  })

  it('rejects a blood-group mismatch without touching the channel', async() => {
    acceptDonationRepository.getAcceptedRequest.mockResolvedValue(null)
    userService.getUser.mockImplementation(
      (id: string) => Promise.resolve(
        id === donorId ? { ...donorProfile, bloodGroup: 'A+' } : seekerProfile
      )
    )

    await expect(runAccept(AcceptDonationStatus.ACCEPTED)).rejects.toThrow(
      'Your blood group doesn\'t match with the request blood group'
    )
    expect(ddbMock.commandCalls(TransactWriteCommand)).toHaveLength(0)
  })

  it('rejects an invalid status', async() => {
    await expect(runAccept('PENDING' as AcceptDonationStatus)).rejects.toThrow(
      'Invalid status for donation response.'
    )
  })
})
