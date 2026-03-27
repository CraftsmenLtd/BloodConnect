import { DonationRecordService } from '../../bloodDonationWorkflow/DonationRecordService'
import type { DonationRecordAttributes } from '../../bloodDonationWorkflow/Types'
import type DonationRecordRepository from '../../models/policies/repositories/DonationRecordRepository'
import type { Logger } from '../../models/logger/Logger'
import { generateUniqueID } from '../../utils/idGenerator'

jest.mock('../../utils/idGenerator')

describe('DonationRecordService', () => {
  let donationRecordService: DonationRecordService
  let mockDonationRecordRepository: jest.Mocked<DonationRecordRepository>
  let mockLogger: jest.Mocked<Logger>

  beforeEach(() => {
    mockDonationRecordRepository = {
      create: jest.fn()
    } as unknown as jest.Mocked<DonationRecordRepository>

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    } as jest.Mocked<Logger>

    donationRecordService = new DonationRecordService(
      mockDonationRecordRepository,
      mockLogger
    )
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('createDonationRecord', () => {
    test('should create donation record with all required fields', async () => {
      const mockId = 'generated-unique-id'
      const mockCreatedAt = '2025-01-15T10:00:00.000Z'

      ;(generateUniqueID as jest.Mock).mockReturnValue(mockId)

      jest.spyOn(global, 'Date').mockImplementation(() => ({
        toISOString: () => mockCreatedAt
      } as Date))

      const donationRecordAttributes: DonationRecordAttributes = {
        donorId: 'donor-123',
        seekerId: 'seeker-456',
        requestPostId: 'request-789',
        requestCreatedAt: '2025-01-15T09:00:00.000Z',
        requestedBloodGroup: 'A+',
        location: 'Dhaka Medical College',
        donationDateTime: '2025-01-20T14:00:00.000Z'
      }

      await donationRecordService.createDonationRecord(donationRecordAttributes)

      expect(generateUniqueID).toHaveBeenCalledTimes(1)
      expect(mockDonationRecordRepository.create).toHaveBeenCalledWith({
        id: mockId,
        donorId: 'donor-123',
        seekerId: 'seeker-456',
        requestPostId: 'request-789',
        requestCreatedAt: '2025-01-15T09:00:00.000Z',
        requestedBloodGroup: 'A+',
        location: 'Dhaka Medical College',
        donationDateTime: '2025-01-20T14:00:00.000Z',
        createdAt: mockCreatedAt
      })

      jest.restoreAllMocks()
    })

    test('should create donation record with different blood group', async () => {
      const mockId = 'unique-id-2'
      ;(generateUniqueID as jest.Mock).mockReturnValue(mockId)

      const donationRecordAttributes: DonationRecordAttributes = {
        donorId: 'donor-999',
        seekerId: 'seeker-888',
        requestPostId: 'request-777',
        requestCreatedAt: '2025-01-10T08:00:00.000Z',
        requestedBloodGroup: 'O-',
        location: 'Chittagong Medical College',
        donationDateTime: '2025-01-25T10:00:00.000Z'
      }

      await donationRecordService.createDonationRecord(donationRecordAttributes)

      expect(mockDonationRecordRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockId,
          donorId: 'donor-999',
          seekerId: 'seeker-888',
          requestPostId: 'request-777',
          requestedBloodGroup: 'O-',
          location: 'Chittagong Medical College'
        })
      )
    })

    test('should generate unique ID for each donation record', async () => {
      const firstId = 'first-unique-id'
      const secondId = 'second-unique-id'

      ;(generateUniqueID as jest.Mock)
        .mockReturnValueOnce(firstId)
        .mockReturnValueOnce(secondId)

      const firstRecord: DonationRecordAttributes = {
        donorId: 'donor-1',
        seekerId: 'seeker-1',
        requestPostId: 'request-1',
        requestCreatedAt: '2025-01-15T09:00:00.000Z',
        requestedBloodGroup: 'A+',
        location: 'Location 1',
        donationDateTime: '2025-01-20T14:00:00.000Z'
      }

      const secondRecord: DonationRecordAttributes = {
        donorId: 'donor-2',
        seekerId: 'seeker-2',
        requestPostId: 'request-2',
        requestCreatedAt: '2025-01-15T10:00:00.000Z',
        requestedBloodGroup: 'B+',
        location: 'Location 2',
        donationDateTime: '2025-01-21T15:00:00.000Z'
      }

      await donationRecordService.createDonationRecord(firstRecord)
      await donationRecordService.createDonationRecord(secondRecord)

      expect(generateUniqueID).toHaveBeenCalledTimes(2)
      expect(mockDonationRecordRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ id: firstId, donorId: 'donor-1' })
      )
      expect(mockDonationRecordRepository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ id: secondId, donorId: 'donor-2' })
      )
    })

    test('should set createdAt to current timestamp', async () => {
      const mockId = 'test-id'
      const mockNow = new Date('2025-01-15T12:30:45.678Z')

      ;(generateUniqueID as jest.Mock).mockReturnValue(mockId)
      jest.spyOn(global, 'Date').mockImplementation(() => mockNow)

      const donationRecordAttributes: DonationRecordAttributes = {
        donorId: 'donor-123',
        seekerId: 'seeker-456',
        requestPostId: 'request-789',
        requestCreatedAt: '2025-01-15T09:00:00.000Z',
        requestedBloodGroup: 'AB+',
        location: 'Test Location',
        donationDateTime: '2025-01-20T14:00:00.000Z'
      }

      await donationRecordService.createDonationRecord(donationRecordAttributes)

      expect(mockDonationRecordRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: '2025-01-15T12:30:45.678Z'
        })
      )

      jest.restoreAllMocks()
    })

    test('should propagate repository errors', async () => {
      const mockId = 'test-id'
      ;(generateUniqueID as jest.Mock).mockReturnValue(mockId)

      const repositoryError = new Error('Database connection failed')
      mockDonationRecordRepository.create.mockRejectedValue(repositoryError)

      const donationRecordAttributes: DonationRecordAttributes = {
        donorId: 'donor-123',
        seekerId: 'seeker-456',
        requestPostId: 'request-789',
        requestCreatedAt: '2025-01-15T09:00:00.000Z',
        requestedBloodGroup: 'A+',
        location: 'Test Location',
        donationDateTime: '2025-01-20T14:00:00.000Z'
      }

      await expect(
        donationRecordService.createDonationRecord(donationRecordAttributes)
      ).rejects.toThrow('Database connection failed')
    })

    test('should handle all blood group types', async () => {
      const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
      ;(generateUniqueID as jest.Mock).mockReturnValue('test-id')

      for (const bloodGroup of bloodGroups) {
        const donationRecordAttributes: DonationRecordAttributes = {
          donorId: 'donor-123',
          seekerId: 'seeker-456',
          requestPostId: 'request-789',
          requestCreatedAt: '2025-01-15T09:00:00.000Z',
          requestedBloodGroup: bloodGroup as DonationRecordAttributes['requestedBloodGroup'],
          location: 'Test Location',
          donationDateTime: '2025-01-20T14:00:00.000Z'
        }

        await donationRecordService.createDonationRecord(donationRecordAttributes)

        expect(mockDonationRecordRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            requestedBloodGroup: bloodGroup
          })
        )

        mockDonationRecordRepository.create.mockClear()
      }
    })

    test('should preserve all original attributes from input', async () => {
      const mockId = 'test-id'
      ;(generateUniqueID as jest.Mock).mockReturnValue(mockId)

      const donationRecordAttributes: DonationRecordAttributes = {
        donorId: 'specific-donor-id',
        seekerId: 'specific-seeker-id',
        requestPostId: 'specific-request-id',
        requestCreatedAt: '2025-01-01T00:00:00.000Z',
        requestedBloodGroup: 'B-',
        location: 'Specific Hospital Location',
        donationDateTime: '2025-02-01T18:30:00.000Z'
      }

      await donationRecordService.createDonationRecord(donationRecordAttributes)

      const callArgs = mockDonationRecordRepository.create.mock.calls[0][0]

      expect(callArgs.donorId).toBe('specific-donor-id')
      expect(callArgs.seekerId).toBe('specific-seeker-id')
      expect(callArgs.requestPostId).toBe('specific-request-id')
      expect(callArgs.requestCreatedAt).toBe('2025-01-01T00:00:00.000Z')
      expect(callArgs.requestedBloodGroup).toBe('B-')
      expect(callArgs.location).toBe('Specific Hospital Location')
      expect(callArgs.donationDateTime).toBe('2025-02-01T18:30:00.000Z')
    })
  })
})
