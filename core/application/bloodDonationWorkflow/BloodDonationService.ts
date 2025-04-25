import { GENERIC_CODES } from '../../../commons/libs/constants/GenericCodes'
import BloodDonationOperationError from './BloodDonationOperationError'
import ThrottlingError from './ThrottlingError'
import type { DonationDTO } from '../../../commons/dto/DonationDTO'
import { AcceptDonationStatus, DonationStatus } from '../../../commons/dto/DonationDTO'
import { generateUniqueID } from '../utils/idGenerator'
import { generateGeohash } from '../utils/geohash'
import { validateInputWithRules } from '../utils/validator'
import type { BloodDonationResponse } from './Types'
import {
  type BloodDonationAttributes,
  type UpdateBloodDonationAttributes,
  type BloodDonationResponseAttributes,
  type BloodDonationEventAttributes,
  validationRules
} from './Types'
import { THROTTLING_LIMITS } from '../../../commons/libs/constants/ThrottlingLimits'
import type BloodDonationRepository from '../models/policies/repositories/BloodDonationRepository'
import type { UserService } from '../userWorkflow/UserService'
import type { Logger } from '../models/logger/Logger'
import type { NotificationService } from '../notificationWorkflow/NotificationService'
import type {
  DonationRequestPayloadAttributes,
  NotificationAttributes
} from '../notificationWorkflow/Types'
import type { AcceptDonationService } from './AcceptDonationRequestService'
import type { DonationRecordService } from './DonationRecordService'
import { NotificationStatus, NotificationType } from '../../../commons/dto/NotificationDTO'
import type { UpdateUserAttributes } from '../userWorkflow/Types'
import type { LocationService } from '../userWorkflow/LocationService'
import type { QueueModel } from '../models/queue/QueueModel'

export class BloodDonationService {
  constructor(
    protected readonly bloodDonationRepository: BloodDonationRepository,
    protected readonly logger: Logger
  ) {}

  async createBloodDonation(
    donationEventAttributes: BloodDonationEventAttributes,
    userService: UserService
  ): Promise<BloodDonationResponseAttributes> {
    const userProfile = await userService.getUser(donationEventAttributes.seekerId)
    const bloodDonationAttributes: BloodDonationAttributes = {
      ...donationEventAttributes,
      seekerName: userProfile.name,
      countryCode: userProfile.countryCode
    }

    this.logger.info('checking daily request limit')
    await this.checkDailyRequestThrottling(bloodDonationAttributes.seekerId)

    this.logger.info('validating donation request')
    const validationResponse = validateInputWithRules(
      {
        bloodQuantity: bloodDonationAttributes.bloodQuantity,
        donationDateTime: bloodDonationAttributes.donationDateTime
      },
      validationRules
    )
    if (validationResponse !== null) {
      throw new BloodDonationOperationError(
        `Invalid parameters for blood donation request. ${validationResponse}`,
        GENERIC_CODES.BAD_REQUEST
      )
    }

    this.logger.info('creating donation request')
    const response: DonationDTO = await this.bloodDonationRepository
      .create({
        requestPostId: generateUniqueID(),
        ...bloodDonationAttributes,
        status: DonationStatus.PENDING,
        geohash: generateGeohash(
          bloodDonationAttributes.latitude,
          bloodDonationAttributes.longitude
        ),
        donationDateTime: new Date(bloodDonationAttributes.donationDateTime).toISOString(),
        createdAt: new Date().toISOString()
      })
      .catch((error) => {
        if (error instanceof ThrottlingError) {
          throw error
        }
        throw new BloodDonationOperationError(
          `Failed to submit blood donation request. ${error}`,
          GENERIC_CODES.ERROR
        )
      })

    return {
      requestPostId: response.requestPostId,
      createdAt: response.createdAt
    }
  }

  private async checkDailyRequestThrottling(seekerId: string): Promise<void> {
    const datePrefix = new Date().toISOString().split('T')[0]
    try {
      const queryResult = await this.bloodDonationRepository.getDonationRequestsByDate(
        seekerId,
        datePrefix
      )
      if (
        queryResult !== null &&
        queryResult.length >= THROTTLING_LIMITS.BLOOD_REQUEST.MAX_REQUESTS_PER_DAY
      ) {
        throw new ThrottlingError(
          THROTTLING_LIMITS.BLOOD_REQUEST.ERROR_MESSAGE,
          GENERIC_CODES.TOO_MANY_REQUESTS
        )
      }
    } catch (error) {
      if (error instanceof ThrottlingError) {
        throw error
      }
      throw new BloodDonationOperationError(
        `Failed to check request limits: ${error}`,
        GENERIC_CODES.ERROR
      )
    }
  }

  async getDonationRequest(
    seekerId: string,
    requestPostId: string,
    createdAt: string
  ): Promise<DonationDTO> {
    const item = await this.bloodDonationRepository.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )
    if (item === null) {
      throw new Error('Donation not found.')
    }
    return item
  }

  async updateBloodDonation(
    donationAttributes: UpdateBloodDonationAttributes,
    notificationService: NotificationService
  ): Promise<BloodDonationResponseAttributes> {
    const { seekerId, requestPostId, donationDateTime, createdAt, ...restAttributes } =
      donationAttributes
    const item = await this.bloodDonationRepository.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )

    if (item === null) {
      throw new BloodDonationOperationError('Item not found.', GENERIC_CODES.NOT_FOUND)
    }

    this.logger.info('checking donation status')
    if (item?.status !== undefined && item.status === DonationStatus.CANCELLED) {
      throw new BloodDonationOperationError(
        'You can\'t update a cancelled request',
        GENERIC_CODES.ERROR
      )
    }

    const updateData: Partial<DonationDTO> = {
      ...restAttributes,
      seekerId,
      requestPostId,
      createdAt
    }

    this.logger.info('validating donation request')
    if (donationDateTime !== undefined) {
      const validationResponse = validateInputWithRules({ donationDateTime }, validationRules)
      if (validationResponse !== null) {
        throw new Error(validationResponse)
      }
      updateData.donationDateTime = new Date(donationDateTime).toISOString()
    }

    this.logger.info('updating donation request')
    await this.bloodDonationRepository.update(updateData).catch((error) => {
      if (error instanceof BloodDonationOperationError) {
        throw error
      }
      throw new BloodDonationOperationError(
        `Failed to update blood donation post. ${error}`,
        GENERIC_CODES.ERROR
      )
    })

    this.logger.info('updating donation notifications')
    await notificationService.updateBloodDonationNotifications(
      requestPostId,
      donationAttributes as Partial<DonationRequestPayloadAttributes>
    )

    return {
      requestPostId,
      createdAt
    }
  }

  async updateDonationStatus(
    seekerId: string,
    requestPostId: string,
    createdAt: string,
    status: DonationStatus
  ): Promise<void> {
    const item = await this.bloodDonationRepository.getDonationRequest(
      seekerId,
      requestPostId,
      createdAt
    )
    if (item === null) {
      throw new Error('Donation not found.')
    }
    const updateData: Partial<DonationDTO> = {
      ...item,
      seekerId,
      requestPostId,
      createdAt,
      status
    }
    this.logger.info('updating donation status')
    await this.bloodDonationRepository.update(updateData)
  }

  async checkAndUpdateDonationStatus(
    seekerId: string,
    requestPostId: string,
    createdAt: string,
    acceptDonationService: AcceptDonationService
  ): Promise<void> {
    this.logger.info('checking donation status')
    const donationPost = await this.getDonationRequest(seekerId, requestPostId, createdAt)
    const acceptedDonors = await acceptDonationService.getAcceptedDonorList(seekerId, requestPostId)

    if (acceptedDonors.length >= donationPost.bloodQuantity) {
      await this.updateDonationStatus(seekerId, requestPostId, createdAt, DonationStatus.MANAGED)
    }
    else {
      await this.updateDonationStatus(seekerId, requestPostId, createdAt, DonationStatus.PENDING)
    }
  }

  async getDonationRequestDetails(
    seekerId: string,
    requestPostId: string,
    createdAt: string,
    acceptDonationService: AcceptDonationService
  ): Promise<BloodDonationResponse> {
    const donationPost = await this.getDonationRequest(seekerId, requestPostId, createdAt)
    const acceptedDonors = await acceptDonationService.getAcceptedDonorList(seekerId, requestPostId)

    return {
      ...donationPost,
      acceptedDonors
    }
  }

  async completeDonationRequest(
    seekerId: string,
    requestPostId: string,
    requestCreatedAt: string,
    donorIds: string[],
    donationRecordService: DonationRecordService,
    userService: UserService,
    notificationService: NotificationService,
    locationService: LocationService,
    minMonthsBetweenDonations: number,
    queueModel: QueueModel
  ): Promise<void> {
    const donationPost = await this.getDonationRequest(seekerId, requestPostId, requestCreatedAt)

    await this.updateDonationStatus(
      seekerId,
      requestPostId,
      requestCreatedAt,
      DonationStatus.COMPLETED
    )
    for (const donorId of donorIds) {
      await donationRecordService.createDonationRecord({
        donorId,
        seekerId,
        requestPostId,
        requestCreatedAt,
        requestedBloodGroup: donationPost.requestedBloodGroup,
        location: donationPost.location,
        donationDateTime: donationPost.donationDateTime
      })

      await notificationService.updateBloodDonationNotificationStatus(
        donorId,
        requestPostId,
        NotificationType.BLOOD_REQ_POST,
        AcceptDonationStatus.COMPLETED
      )

      const userAttributes = {
        lastDonationDate: new Date().toISOString(),
        availableForDonation: false
      }
      await userService.updateUserAttributes(
        donorId,
        userAttributes as UpdateUserAttributes,
        locationService,
        minMonthsBetweenDonations
      )
    }

    await Promise.allSettled(
      donorIds.map(async(donorId) => {
        const notificationAttributes: NotificationAttributes = {
          userId: donorId,
          title: 'Thank you for your donation',
          status: NotificationStatus.COMPLETED,
          body: 'Thank you for your donation 🙏! A heartfelt thanks from the Blood Connect Team! ❤️',
          type: NotificationType.COMMON,
          payload: {
            donorId,
            seekerId,
            requestCreatedAt,
            requestPostId,
            requestedBloodGroup: donationPost.requestedBloodGroup,
            bloodQuantity: donationPost.bloodQuantity,
            urgencyLevel: donationPost.urgencyLevel,
            location: donationPost.location,
            donationDateTime: donationPost.donationDateTime,
            shortDescription: donationPost.shortDescription
          }
        }

        await notificationService.sendNotification(notificationAttributes, queueModel)
      })
    )
  }
}
