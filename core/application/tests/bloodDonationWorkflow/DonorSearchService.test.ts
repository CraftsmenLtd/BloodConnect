import { DonorSearchService } from '../../bloodDonationWorkflow/DonorSearchService'
import {
  DonationStatus,
  DonorSearchStatus,
  DonorSearchCompletionReason
} from '../../../../commons/dto/DonationDTO'
import { donationDtoMock } from '../mocks/mockDonationRequestData'
import { mockLogger } from '../mocks/mockLogger'
import type { DonorSearchConfig } from '../../bloodDonationWorkflow/Types'
import type { BloodDonationService } from '../../bloodDonationWorkflow/BloodDonationService'
import type { AcceptDonationService } from '../../bloodDonationWorkflow/AcceptDonationRequestService'
import type { NotificationService } from '../../notificationWorkflow/NotificationService'
import type { H3SearchService } from '../../bloodDonationWorkflow/H3SearchService'
import type { QueueModel } from '../../models/queue/QueueModel'
import type { SchedulerModel } from '../../models/scheduler/SchedulerModel'
import type DonorSearchRepository from '../../models/policies/repositories/DonorSearchRepository'
import type { DonorInHexResult } from '../../models/policies/repositories/H3SearchRepository'

const mockConfig = {
  dynamodbTableName: 'table',
  awsRegion: 'ap-south-1',
  maxCellsPerExecution: 500,
  searchIntervalSeconds: 180,
  initialWaveDelaySeconds: 0,
  retryDelaySeconds: 300,
  maxRetries: 3,
  acceptanceWindowSeconds: 3600,
  maxSearchRadiusKm: 15,
  parallelQueryConcurrency: 25,
  notificationQueueUrl: 'queue-url',
  schedulerRoleArn: 'role-arn',
  donorSearchLambdaArn: 'lambda-arn'
} as DonorSearchConfig

const donorSearchRecordMock = {
  seekerId: donationDtoMock.seekerId,
  requestPostId: donationDtoMock.requestPostId,
  createdAt: donationDtoMock.createdAt,
  status: DonorSearchStatus.PENDING,
  notifiedEligibleDonors: {}
}

const buildDonor = (id: string): DonorInHexResult => ({
  userId: id,
  locationId: `loc-${id}`,
  h3Res8: donationDtoMock.h3Res8,
  latitude: 23.79,
  longitude: 90.4
})

describe('DonorSearchService.searchDonors terminal paths', () => {
  const mockDonorSearchRepository = {
    getDonorSearchItem: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  } as unknown as jest.Mocked<DonorSearchRepository>

  const mockBloodDonationService = {
    getDonationRequest: jest.fn()
  } as unknown as jest.Mocked<BloodDonationService>

  const mockAcceptDonationService = {
    getRemainingBagsNeeded: jest.fn()
  } as unknown as jest.Mocked<AcceptDonationService>

  const mockNotificationService = {
    queryBloodDonationNotifications: jest.fn(),
    sendRequestNotification: jest.fn()
  } as unknown as jest.Mocked<NotificationService>

  const mockH3SearchService = {
    buildRingBatch: jest.fn(),
    queryDonorsInHex: jest.fn()
  } as unknown as jest.Mocked<H3SearchService>

  const mockQueueModel = {} as unknown as QueueModel
  const mockSchedulerModel = { schedule: jest.fn() } as unknown as jest.Mocked<SchedulerModel>

  const baseArgs = {
    seekerId: donationDtoMock.seekerId,
    requestPostId: donationDtoMock.requestPostId,
    createdAt: donationDtoMock.createdAt,
    currentLevel: 0,
    remainingCells: [donationDtoMock.h3Res8],
    retryCount: 0,
    bloodDonationService: mockBloodDonationService,
    acceptDonationService: mockAcceptDonationService,
    notificationService: mockNotificationService,
    h3SearchService: mockH3SearchService,
    queueModel: mockQueueModel,
    schedulerModel: mockSchedulerModel
  }

  const buildService = () =>
    new DonorSearchService(mockDonorSearchRepository, mockLogger, mockConfig)

  beforeEach(() => {
    jest.clearAllMocks()
    mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue(donorSearchRecordMock)
    mockNotificationService.queryBloodDonationNotifications.mockResolvedValue([])
    mockNotificationService.sendRequestNotification.mockResolvedValue(undefined)
  })

  test('writes REQUEST_CLOSED when the donation request is already cancelled', async() => {
    mockBloodDonationService.getDonationRequest.mockResolvedValue(
      { ...donationDtoMock, status: DonationStatus.CANCELLED }
    )

    await buildService().searchDonors(baseArgs)

    expect(mockDonorSearchRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: DonorSearchStatus.COMPLETED,
        completionReason: DonorSearchCompletionReason.REQUEST_CLOSED
      })
    )
  })

  test('writes DONORS_ACCEPTED when enough bags are already accepted', async() => {
    mockBloodDonationService.getDonationRequest.mockResolvedValue(
      { ...donationDtoMock, status: DonationStatus.PENDING }
    )
    mockAcceptDonationService.getRemainingBagsNeeded.mockResolvedValue(0)

    await buildService().searchDonors(baseArgs)

    expect(mockDonorSearchRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: DonorSearchStatus.COMPLETED,
        completionReason: DonorSearchCompletionReason.DONORS_ACCEPTED
      })
    )
  })

  test('writes FOUND_ENOUGH when the wave notifies the target number of donors', async() => {
    mockBloodDonationService.getDonationRequest.mockResolvedValue(
      { ...donationDtoMock, status: DonationStatus.PENDING }
    )
    mockAcceptDonationService.getRemainingBagsNeeded.mockResolvedValue(2)
    mockH3SearchService.buildRingBatch.mockReturnValue(
      { cells: [donationDtoMock.h3Res8], finalLevel: 1 }
    )
    mockH3SearchService.queryDonorsInHex.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => buildDonor(`donor-${i}`))
    )

    await buildService().searchDonors(baseArgs)

    expect(mockDonorSearchRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: DonorSearchStatus.COMPLETED,
        completionReason: DonorSearchCompletionReason.FOUND_ENOUGH
      })
    )
  })

  test('writes RADIUS_EXHAUSTED when retries run out with donors still missing', async() => {
    mockBloodDonationService.getDonationRequest.mockResolvedValue(
      { ...donationDtoMock, status: DonationStatus.PENDING }
    )
    mockAcceptDonationService.getRemainingBagsNeeded.mockResolvedValue(2)
    mockH3SearchService.buildRingBatch.mockReturnValue(
      { cells: [donationDtoMock.h3Res8], finalLevel: 19 }
    )
    mockH3SearchService.queryDonorsInHex.mockResolvedValue([])

    await buildService().searchDonors({ ...baseArgs, retryCount: mockConfig.maxRetries })

    expect(mockDonorSearchRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: DonorSearchStatus.COMPLETED,
        completionReason: DonorSearchCompletionReason.RADIUS_EXHAUSTED
      })
    )
  })

  test('does not write a status when no search record exists', async() => {
    mockBloodDonationService.getDonationRequest.mockResolvedValue(
      { ...donationDtoMock, status: DonationStatus.PENDING }
    )
    mockDonorSearchRepository.getDonorSearchItem.mockResolvedValue(null)

    await buildService().searchDonors(baseArgs)

    expect(mockDonorSearchRepository.update).not.toHaveBeenCalled()
  })
})

describe('DonorSearchService.initiateDonorSearchRequest restart logic', () => {
  const repo = {
    getDonorSearchItem: jest.fn(),
    update: jest.fn(),
    create: jest.fn()
  } as unknown as jest.Mocked<DonorSearchRepository>

  const scheduler = { schedule: jest.fn() } as unknown as jest.Mocked<SchedulerModel>

  const initiatorAttributes = {
    seekerId: donationDtoMock.seekerId,
    requestPostId: donationDtoMock.requestPostId,
    createdAt: donationDtoMock.createdAt,
    centerHex: donationDtoMock.h3Res8,
    h3Res5: donationDtoMock.h3Res5
  }

  const completedRecord = { ...donorSearchRecordMock, status: DonorSearchStatus.COMPLETED }

  const buildService = () => new DonorSearchService(repo, mockLogger, mockConfig)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('restarts when a completed search sees status transition into PENDING', async() => {
    repo.getDonorSearchItem.mockResolvedValue(completedRecord)

    await buildService().initiateDonorSearchRequest(
      initiatorAttributes, scheduler, DonationStatus.PENDING, DonationStatus.MANAGED
    )

    expect(repo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: DonorSearchStatus.PENDING,
        completionReason: null
      })
    )
    expect(scheduler.schedule).toHaveBeenCalledTimes(1)
  })

  test('does not restart on a benign edit that leaves status PENDING', async() => {
    repo.getDonorSearchItem.mockResolvedValue(completedRecord)

    await buildService().initiateDonorSearchRequest(
      initiatorAttributes, scheduler, DonationStatus.PENDING, DonationStatus.PENDING
    )

    expect(repo.update).not.toHaveBeenCalled()
    expect(scheduler.schedule).not.toHaveBeenCalled()
  })

  test('does not restart while the search is still running', async() => {
    repo.getDonorSearchItem.mockResolvedValue(donorSearchRecordMock)

    await buildService().initiateDonorSearchRequest(
      initiatorAttributes, scheduler, DonationStatus.PENDING, DonationStatus.MANAGED
    )

    expect(repo.update).not.toHaveBeenCalled()
    expect(scheduler.schedule).not.toHaveBeenCalled()
  })

  test('creates and schedules a brand new search', async() => {
    repo.getDonorSearchItem.mockResolvedValue(null)

    await buildService().initiateDonorSearchRequest(
      initiatorAttributes, scheduler, DonationStatus.PENDING, '' as DonationStatus
    )

    expect(repo.create).toHaveBeenCalledTimes(1)
    expect(scheduler.schedule).toHaveBeenCalledTimes(1)
  })
})
